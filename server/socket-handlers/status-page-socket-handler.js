const { R } = require("redbean-node");
const { checkLogin } = require("../util-server");
const dayjs = require("dayjs");
const { log } = require("../../src/util");
const ImageDataURI = require("../image-data-uri");
const Database = require("../database");
const apicache = require("../utils/response-cache");
const StatusPage = require("../model/status_page");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const { Settings } = require("../settings");

/**
 * Validates incident data
 * @param {object} incident - The incident object
 * @returns {void}
 * @throws {Error} If validation fails
 */
function validateIncident(incident) {
    if (typeof incident.title !== "string" || incident.title.trim() === "") {
        throw new Error("Please input title");
    }
    if (typeof incident.content !== "string" || incident.content.trim() === "") {
        throw new Error("Please input content");
    }
}

/**
 * Validate that affected monitors belong to the status page.
 * @param {number} statusPageID Status page ID
 * @param {number[]} monitorIDs Monitor IDs selected by the user
 * @returns {Promise<number[]>} Validated monitor IDs
 */
async function validateAffectedMonitors(statusPageID, monitorIDs) {
    if (!Array.isArray(monitorIDs)) {
        throw new Error("Invalid affected monitors");
    }

    const requestedIDs = [...new Set(monitorIDs.map((monitorID) => Number(monitorID)))];
    if (requestedIDs.some((monitorID) => !Number.isSafeInteger(monitorID) || monitorID <= 0)) {
        throw new Error("Invalid affected monitors");
    }

    const publicMonitorIDs = new Set(
        (await R.getCol(
            `SELECT DISTINCT monitor_group.monitor_id
             FROM monitor_group
             INNER JOIN \`group\` ON \`group\`.id = monitor_group.group_id
             WHERE \`group\`.public = 1 AND \`group\`.status_page_id = ?`,
            [statusPageID]
        )).map((monitorID) => Number(monitorID))
    );
    if (requestedIDs.some((monitorID) => !publicMonitorIDs.has(monitorID))) {
        throw new Error("Invalid affected monitors");
    }

    return requestedIDs;
}

/**
 * Replace the monitors affected by an incident.
 * @param {number} incidentID Incident ID
 * @param {number[]} monitorIDs Validated monitor IDs
 * @returns {Promise<void>}
 */
async function saveAffectedMonitors(incidentID, monitorIDs) {
    await R.knex.transaction(async (transaction) => {
        await transaction("incident_monitor").where("incident_id", incidentID).delete();
        if (monitorIDs.length > 0) {
            await transaction("incident_monitor").insert(
                monitorIDs.map((monitorID) => ({
                    incident_id: incidentID,
                    monitor_id: monitorID,
                }))
            );
        }
    });
}

/**
 * Save a status update for an incident.
 * @param {number} incidentID Incident ID
 * @param {string} status Incident status
 * @param {string} content Update content
 * @param {string} createdDate Update time
 * @returns {Promise<void>}
 */
async function saveIncidentUpdate(incidentID, status, content, createdDate) {
    await R.knex("incident_update").insert({
        incident_id: incidentID,
        status,
        content,
        created_date: createdDate,
    });
}

/**
 * Socket handlers for status page
 * @param {Socket} socket Socket.io instance to add listeners on
 * @returns {void}
 */
module.exports.statusPageSocketHandler = (socket) => {
    // Post or edit incident
    socket.on("postIncident", async (slug, incident, callback) => {
        try {
            checkLogin(socket);
            validateIncident(incident);

            let statusPageID = await StatusPage.slugToID(slug);

            if (!statusPageID) {
                throw new Error("slug is not found");
            }

            const hasAffectedMonitors = Object.prototype.hasOwnProperty.call(incident, "affectedMonitorIDs");
            const affectedMonitorIDs = hasAffectedMonitors
                ? await validateAffectedMonitors(statusPageID, incident.affectedMonitorIDs)
                : null;

            let incidentBean;

            if (incident.id) {
                incidentBean = await R.findOne("incident", " id = ? AND status_page_id = ? ", [
                    incident.id,
                    statusPageID,
                ]);
            }

            if (incidentBean == null) {
                incidentBean = R.dispense("incident");
            }

            incidentBean.title = incident.title;
            incidentBean.content = incident.content;
            const validStyles = ["info", "warning", "danger", "primary", "light", "dark"];
            incidentBean.style = validStyles.includes(incident.style) ? incident.style : "warning";
            incidentBean.pin = true;
            incidentBean.active = true;
            incidentBean.status_page_id = statusPageID;

            const isNewIncident = !incidentBean.id;
            const now = R.isoDateTime(dayjs.utc());
            if (incident.id) {
                incidentBean.last_updated_date = now;
            } else {
                incidentBean.created_date = now;
            }

            await R.store(incidentBean);
            if (affectedMonitorIDs !== null) {
                await saveAffectedMonitors(incidentBean.id, affectedMonitorIDs);
            }
            if (isNewIncident) {
                await saveIncidentUpdate(incidentBean.id, "investigating", incident.content, now);
            }
            apicache.clear();

            callback({
                ok: true,
                incident: incidentBean.toPublicJSON(),
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
            });
        }
    });

    socket.on("unpinIncident", async (slug, callback) => {
        try {
            checkLogin(socket);

            let statusPageID = await StatusPage.slugToID(slug);

            await R.exec("UPDATE incident SET pin = 0 WHERE pin = 1 AND status_page_id = ? ", [statusPageID]);

            callback({
                ok: true,
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
            });
        }
    });

    socket.on("getIncidentHistory", async (slug, cursor, callback) => {
        try {
            let statusPageID = await StatusPage.slugToID(slug);
            if (!statusPageID) {
                throw new Error("slug is not found");
            }

            const isPublic = !socket.userID;
            const result = await StatusPage.getIncidentHistory(statusPageID, cursor, isPublic);
            callback({
                ok: true,
                ...result,
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
            });
        }
    });

    socket.on("editIncident", async (slug, incidentID, incident, callback) => {
        try {
            checkLogin(socket);

            let statusPageID = await StatusPage.slugToID(slug);
            if (!statusPageID) {
                callback({
                    ok: false,
                    msg: "slug is not found",
                    msgi18n: true,
                });
                return;
            }

            let bean = await R.findOne("incident", " id = ? AND status_page_id = ? ", [incidentID, statusPageID]);
            if (!bean) {
                callback({
                    ok: false,
                    msg: "Incident not found or access denied",
                    msgi18n: true,
                });
                return;
            }

            try {
                validateIncident(incident);
            } catch (e) {
                callback({
                    ok: false,
                    msg: e.message,
                    msgi18n: true,
                });
                return;
            }

            const validStyles = ["info", "warning", "danger", "primary", "light", "dark"];
            if (!validStyles.includes(incident.style)) {
                incident.style = "warning";
            }

            const hasAffectedMonitors = Object.prototype.hasOwnProperty.call(incident, "affectedMonitorIDs");
            const affectedMonitorIDs = hasAffectedMonitors
                ? await validateAffectedMonitors(statusPageID, incident.affectedMonitorIDs)
                : null;

            bean.title = incident.title;
            bean.content = incident.content;
            bean.style = incident.style;
            bean.pin = incident.pin !== false;
            bean.last_updated_date = R.isoDateTime(dayjs.utc());

            await R.store(bean);
            if (affectedMonitorIDs !== null) {
                await saveAffectedMonitors(bean.id, affectedMonitorIDs);
            }
            apicache.clear();

            callback({
                ok: true,
                msg: "Saved.",
                msgi18n: true,
                incident: bean.toPublicJSON(),
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
                msgi18n: true,
            });
        }
    });

    socket.on("deleteIncident", async (slug, incidentID, callback) => {
        try {
            checkLogin(socket);

            let statusPageID = await StatusPage.slugToID(slug);
            if (!statusPageID) {
                callback({
                    ok: false,
                    msg: "slug is not found",
                    msgi18n: true,
                });
                return;
            }

            let bean = await R.findOne("incident", " id = ? AND status_page_id = ? ", [incidentID, statusPageID]);
            if (!bean) {
                callback({
                    ok: false,
                    msg: "Incident not found or access denied",
                    msgi18n: true,
                });
                return;
            }

            await R.trash(bean);
            apicache.clear();

            callback({
                ok: true,
                msg: "successDeleted",
                msgi18n: true,
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
                msgi18n: true,
            });
        }
    });

    socket.on("resolveIncident", async (slug, incidentID, contentOrCallback, maybeCallback) => {
        const callback = typeof contentOrCallback === "function" ? contentOrCallback : maybeCallback;
        const content =
            typeof contentOrCallback === "string"
                ? contentOrCallback
                : "All affected services are operating normally again.";
        try {
            checkLogin(socket);

            let statusPageID = await StatusPage.slugToID(slug);
            if (!statusPageID) {
                callback({
                    ok: false,
                    msg: "slug is not found",
                    msgi18n: true,
                });
                return;
            }

            let bean = await R.findOne("incident", " id = ? AND status_page_id = ? ", [incidentID, statusPageID]);
            if (!bean) {
                callback({
                    ok: false,
                    msg: "Incident not found or access denied",
                    msgi18n: true,
                });
                return;
            }

            const resolvedAt = R.isoDateTime(dayjs.utc());
            await saveIncidentUpdate(incidentID, "resolved", content, resolvedAt);
            await bean.resolve();
            apicache.clear();

            callback({
                ok: true,
                msg: "Resolved",
                msgi18n: true,
                incident: bean.toPublicJSON(),
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
                msgi18n: true,
            });
        }
    });

    socket.on("postIncidentUpdate", async (slug, incidentID, update, callback) => {
        try {
            checkLogin(socket);

            const statusPageID = await StatusPage.slugToID(slug);
            if (!statusPageID) {
                throw new Error("slug is not found");
            }

            const incident = await R.findOne("incident", " id = ? AND status_page_id = ? ", [incidentID, statusPageID]);
            if (!incident) {
                throw new Error("Incident not found or access denied");
            }

            const validStatuses = ["investigating", "identified", "monitoring", "resolved"];
            if (!update || !validStatuses.includes(update.status)) {
                throw new Error("Invalid incident status");
            }
            if (typeof update.content !== "string" || update.content.trim() === "") {
                throw new Error("Please input content");
            }

            const now = R.isoDateTime(dayjs.utc());
            await saveIncidentUpdate(incidentID, update.status, update.content, now);
            incident.active = update.status !== "resolved";
            incident.pin = incident.active;
            incident.last_updated_date = now;
            await R.store(incident);
            apicache.clear();

            callback({
                ok: true,
                msg: "Saved.",
                msgi18n: true,
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
                msgi18n: true,
            });
        }
    });

    socket.on("getStatusPage", async (slug, callback) => {
        try {
            checkLogin(socket);

            let statusPage = await R.findOne("status_page", " slug = ? ", [slug]);

            if (!statusPage) {
                throw new Error("No slug?");
            }

            callback({
                ok: true,
                config: await statusPage.toJSON(),
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
            });
        }
    });

    // Save Status Page
    // imgDataUrl Only Accept PNG!
    socket.on("saveStatusPage", async (slug, config, imgDataUrl, publicGroupList, callback) => {
        try {
            checkLogin(socket);

            // Save Config
            let statusPage = await R.findOne("status_page", " slug = ? ", [slug]);

            if (!statusPage) {
                throw new Error("No slug?");
            }

            checkSlug(config.slug);

            const design = config.design ?? "modern";
            if (!["modern", "classic"].includes(design)) {
                throw new Error("Invalid status page design");
            }

            const header = "data:image/png;base64,";

            // Check logo format
            // If is image data url, convert to png file
            // Else assume it is a url, nothing to do
            if (imgDataUrl.startsWith("data:")) {
                if (!imgDataUrl.startsWith(header)) {
                    throw new Error("Only allowed PNG logo.");
                }

                const filename = `logo${statusPage.id}.png`;

                // Convert to file
                await ImageDataURI.outputFile(imgDataUrl, Database.uploadDir + filename);
                config.logo = `/upload/${filename}?t=` + Date.now();
            } else {
                config.logo = imgDataUrl;
            }

            statusPage.slug = config.slug;
            statusPage.title = config.title;
            statusPage.description = config.description;
            statusPage.icon = config.logo;
            statusPage.design = design;
            ((statusPage.autoRefreshInterval = config.autoRefreshInterval), (statusPage.theme = config.theme));
            //statusPage.published = ;
            //statusPage.search_engine_index = ;
            statusPage.show_tags = config.showTags;
            //statusPage.password = null;
            statusPage.footer_text = config.footerText;
            statusPage.custom_css = config.customCSS;
            statusPage.show_powered_by = config.showPoweredBy;
            statusPage.rss_title = config.rssTitle;
            statusPage.show_only_last_heartbeat = config.showOnlyLastHeartbeat;
            statusPage.show_certificate_expiry = config.showCertificateExpiry;
            statusPage.modified_date = R.isoDateTime();
            statusPage.analytics_id = config.analyticsId;
            statusPage.analytics_script_url = config.analyticsScriptUrl;
            const validAnalyticsTypes = ["google", "umami", "plausible", "matomo", "rybbit"];
            if (config.analyticsType !== null && !validAnalyticsTypes.includes(config.analyticsType)) {
                throw new Error("Invalid analytics type");
            }
            statusPage.analytics_type = config.analyticsType;

            await R.store(statusPage);

            await statusPage.updateDomainNameList(config.domainNameList);
            await StatusPage.loadDomainMappingList();

            // Save Public Group List
            const groupIDList = [];
            let groupOrder = 1;

            for (let group of publicGroupList) {
                let groupBean;
                if (group.id) {
                    groupBean = await R.findOne("group", " id = ? AND public = 1 AND status_page_id = ? ", [
                        group.id,
                        statusPage.id,
                    ]);
                } else {
                    groupBean = R.dispense("group");
                }

                groupBean.status_page_id = statusPage.id;
                groupBean.name = group.name;
                groupBean.public = true;
                groupBean.weight = groupOrder++;

                await R.store(groupBean);

                await R.exec("DELETE FROM monitor_group WHERE group_id = ? ", [groupBean.id]);

                let monitorOrder = 1;

                for (let monitor of group.monitorList) {
                    let relationBean = R.dispense("monitor_group");
                    relationBean.weight = monitorOrder++;
                    relationBean.group_id = groupBean.id;
                    relationBean.monitor_id = monitor.id;

                    if (monitor.sendUrl !== undefined) {
                        relationBean.send_url = monitor.sendUrl;
                    }

                    if (monitor.url !== undefined) {
                        relationBean.custom_url = monitor.url;
                    }

                    await R.store(relationBean);
                }

                groupIDList.push(groupBean.id);
                group.id = groupBean.id;
            }

            // Delete groups that are not in the list
            log.debug("socket", "Delete groups that are not in the list");
            if (groupIDList.length === 0) {
                await R.exec("DELETE FROM `group` WHERE status_page_id = ?", [statusPage.id]);
            } else {
                const slots = groupIDList.map(() => "?").join(",");

                const data = [...groupIDList, statusPage.id];
                await R.exec(`DELETE FROM \`group\` WHERE id NOT IN (${slots}) AND status_page_id = ?`, data);
            }

            const server = UptimeKumaServer.getInstance();

            // Also change entry page to new slug if it is the default one, and slug is changed.
            if (server.entryPage === "statusPage-" + slug && statusPage.slug !== slug) {
                server.entryPage = "statusPage-" + statusPage.slug;
                await Settings.set("entryPage", server.entryPage, "general");
            }

            apicache.clear();

            callback({
                ok: true,
                publicGroupList,
            });
        } catch (error) {
            log.error("socket", error);

            callback({
                ok: false,
                msg: error.message,
            });
        }
    });

    // Add a new status page
    socket.on("addStatusPage", async (title, slug, callback) => {
        try {
            checkLogin(socket);

            title = title?.trim();
            slug = slug?.trim();

            // Check empty
            if (!title || !slug) {
                throw new Error("Please input all fields");
            }

            // Make sure slug is string
            if (typeof slug !== "string") {
                throw new Error("Slug -Accept string only");
            }

            // lower case only
            slug = slug.toLowerCase();

            checkSlug(slug);

            let statusPage = R.dispense("status_page");
            statusPage.slug = slug;
            statusPage.title = title;
            statusPage.theme = "auto";
            statusPage.design = "modern";
            statusPage.icon = "";
            statusPage.autoRefreshInterval = 300;
            await R.store(statusPage);

            callback({
                ok: true,
                msg: "successAdded",
                msgi18n: true,
                slug: slug,
            });
        } catch (error) {
            log.error("socket", error);
            callback({
                ok: false,
                msg: error.message,
            });
        }
    });

    // Delete a status page
    socket.on("deleteStatusPage", async (slug, callback) => {
        const server = UptimeKumaServer.getInstance();

        try {
            checkLogin(socket);

            let statusPageID = await StatusPage.slugToID(slug);

            if (statusPageID) {
                // Reset entry page if it is the default one.
                if (server.entryPage === "statusPage-" + slug) {
                    server.entryPage = "dashboard";
                    await Settings.set("entryPage", server.entryPage, "general");
                }

                // No need to delete records from `status_page_cname`, because it has cascade foreign key.
                // But for incident & group, it is hard to add cascade foreign key during migration, so they have to be deleted manually.

                // Delete incident
                await R.exec("DELETE FROM incident WHERE status_page_id = ? ", [statusPageID]);

                // Delete group
                await R.exec("DELETE FROM `group` WHERE status_page_id = ? ", [statusPageID]);

                // Delete status_page
                await R.exec("DELETE FROM status_page WHERE id = ? ", [statusPageID]);

                apicache.clear();
            } else {
                throw new Error("Status Page is not found");
            }

            callback({
                ok: true,
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
            });
        }
    });
};

/**
 * Check slug a-z, 0-9, - only
 * Regex from: https://stackoverflow.com/questions/22454258/js-regex-string-validation-for-slug
 * @param {string} slug Slug to test
 * @returns {void}
 * @throws Slug is not valid
 */
function checkSlug(slug) {
    if (typeof slug !== "string") {
        throw new Error("Slug must be string");
    }

    slug = slug.trim();

    if (!slug) {
        throw new Error("Slug cannot be empty");
    }

    if (!slug.match(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/)) {
        throw new Error("Invalid Slug");
    }
}
