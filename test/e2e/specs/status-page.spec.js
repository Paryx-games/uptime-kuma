import { expect, test } from "@playwright/test";
import { login, restoreSqliteSnapshot, screenshot } from "../util-test";

test.describe("Status Page", () => {
    test.beforeEach(async ({ page }) => {
        await restoreSqliteSnapshot(page);
    });

    test("create and edit", async ({ page }, testInfo) => {
        test.setTimeout(60000); // Keep the timeout increase for stability

        // Monitor
        const monitorName = "Monitor for Status Page";
        const tagName = "Client";
        const tagValue = "Acme Inc";
        const tagName2 = "Project"; // Add second tag name
        const tagValue2 = "Phoenix"; // Add second tag value
        const monitorUrl = "https://www.example.com/status";
        const monitorCustomUrl = "https://www.example.com";

        // Status Page
        const footerText = "This is footer text.";
        const refreshInterval = 30;
        const theme = "dark";
        const googleAnalyticsId = "G-123";
        const umamiAnalyticsScriptUrl = "https://umami.example.com/script.js";
        const umamiAnalyticsWebsiteId = "606487e2-bc25-45f9-9132-fa8b065aad46";
        const plausibleAnalyticsScriptUrl = "https://plausible.example.com/js/script.js";
        const plausibleAnalyticsDomainsUrls = "one.com,two.com";
        const matomoUrl = "https://matomoto.example.com";
        const matomoSiteId = "123456789";
        const customCss = "body { background: rgb(0, 128, 128) !important; }";
        const descriptionText = "This is an example status page.";
        const incidentTitle = "Example Outage Incident";
        const incidentContent = "Sample incident message.";
        const groupName = "Example Group 1";

        // Set up a monitor that can be added to the Status Page
        await page.goto("./add");
        await login(page);
        await expect(page.getByTestId("monitor-type-select")).toBeVisible();
        await page.getByTestId("monitor-type-select").selectOption("http");
        await page.getByTestId("friendly-name-input").fill(monitorName);
        await page.getByTestId("url-input").fill(monitorUrl);

        // Modified tag section to add multiple tags
        await page.getByTestId("add-tag-button").click();
        await page.getByTestId("tag-name-input").fill(tagName);
        await page.getByTestId("tag-value-input").fill(tagValue);
        await page.getByTestId("tag-color-select").click(); // Vue-Multiselect component
        await page.getByTestId("tag-color-select").getByRole("option", { name: "Orange" }).click();

        // Add another tag instead of submitting directly
        await page.getByRole("button", { name: "Add Another Tag" }).click();

        // Add second tag
        await page.getByTestId("tag-name-input").fill(tagName2);
        await page.getByTestId("tag-value-input").fill(tagValue2);
        await page.getByTestId("tag-color-select").click();
        await page.getByTestId("tag-color-select").getByRole("option", { name: "Blue" }).click();

        // Submit both tags
        await page.getByTestId("add-tags-final-button").click();

        await page.getByTestId("save-button").click();
        await page.waitForURL("/dashboard/*"); // wait for the monitor to be created

        // Create a new status page
        await page.goto("./add-status-page");
        await screenshot(testInfo, page);

        await page.getByTestId("name-input").fill("Example");
        await page.getByTestId("slug-input").fill("example");
        await page.getByTestId("submit-button").click();
        await page.waitForURL("/status/example?edit"); // wait for the page to be created

        await expect(page.getByTestId("design-select")).toHaveValue("modern");
        await expect(page.locator(".carbon-status-page")).toBeVisible();
        for (const testId of [
            "show-tags-checkbox",
            "show-powered-by-checkbox",
            "show-certificate-expiry-checkbox",
            "show-only-last-heartbeat-checkbox",
        ]) {
            expect(
                await page.getByTestId(testId).evaluate((element) => {
                    return element.closest(".form-check").classList.contains("form-switch");
                })
            ).toBe(false);
        }

        // Fill in some details
        await page.getByTestId("description-input").fill(descriptionText);
        await page.getByTestId("footer-text-input").fill(footerText);
        await page.getByTestId("refresh-interval-input").fill(String(refreshInterval));
        await page.getByTestId("theme-select").selectOption(theme);
        await page.getByTestId("show-tags-checkbox").uncheck();
        await page.getByTestId("show-powered-by-checkbox").uncheck();
        await page.getByTestId("show-certificate-expiry-checkbox").uncheck();
        await page.getByTestId("analytics-type-select").selectOption("google");
        await page.getByTestId("analytics-id-input").fill(googleAnalyticsId);
        await page.getByTestId("custom-css-input").getByTestId("textarea").fill(customCss); // Prism

        // Add a group
        await page.getByTestId("add-group-button").click();
        await page.getByTestId("group-name").isEditable();
        await page.getByTestId("group-name").fill(groupName);

        // Add the monitor
        await page.getByTestId("monitor-select").click(); // Vue-Multiselect component
        await page.getByTestId("monitor-select").getByRole("option", { name: monitorName }).click();
        await expect(page.getByTestId("monitor")).toHaveCount(1);
        await expect(page.getByTestId("monitor-name")).toContainText(monitorName);
        await expect(page.getByTestId("monitor-name")).not.toHaveAttribute("href");

        // Set public url on
        await page.getByTestId("monitor-settings").click();
        await page.getByTestId("show-clickable-link").check();
        await page.getByTestId("custom-url-input").fill(monitorCustomUrl);
        await page.getByTestId("monitor-settings-close").click();

        // Save the changes
        await screenshot(testInfo, page);
        const modernSaveNavigation = page.waitForNavigation();
        await page.getByTestId("save-button").click();
        await modernSaveNavigation;
        await expect(page.getByTestId("edit-sidebar")).toHaveCount(0);
        await expect(page.locator(".carbon-status-page")).toBeVisible();

        await page.getByTestId("edit-button").click();
        await page.getByTestId("create-incident-button").click();
        await page.getByTestId("incident-edit-status").selectOption("monitoring");
        await page.getByTestId("incident-title").fill(incidentTitle);
        await page.getByTestId("incident-content-editable").fill(incidentContent);
        await page.getByTestId("incident-edit").getByLabel(monitorName, { exact: true }).check();
        await page.getByTestId("post-incident-button").click();
        const incidentSaveNavigation = page.waitForNavigation();
        await page.getByTestId("save-button").click();
        await incidentSaveNavigation;

        await page.getByTestId("edit-button").click();
        await expect(page.getByTestId("monitor-settings")).toBeVisible();
        // Wait for the authenticated status-page config to arrive over Socket.IO.
        await page.waitForTimeout(500);
        await page.getByTestId("design-select").selectOption("classic");
        await expect(page.getByTestId("design-select")).toHaveValue("classic");
        await expect(page.locator(".carbon-status-page")).toHaveCount(0);
        expect(
            await page.getByTestId("show-tags-checkbox").evaluate((element) => {
                return element.closest(".form-check").classList.contains("form-switch");
            })
        ).toBe(true);
        const classicSaveNavigation = page.waitForNavigation();
        await page.getByTestId("save-button").click();
        await classicSaveNavigation;
        await expect(page.locator(".carbon-status-page")).toHaveCount(0);
        await expect(page.getByTestId("incident")).toHaveClass(/bg-primary/);
        await expect(page.getByTestId("incident-title")).toContainText(incidentTitle);

        await page.getByTestId("edit-button").click();
        await expect(page.getByTestId("monitor-settings")).toBeVisible();
        // Wait for the authenticated status-page config to arrive over Socket.IO.
        await page.waitForTimeout(500);
        await expect(page.getByTestId("design-select")).toHaveValue("classic");
        await page.getByTestId("design-select").selectOption("modern");
        await expect(page.locator(".carbon-status-page")).toBeVisible();
        expect(
            await page.getByTestId("show-tags-checkbox").evaluate((element) => {
                return element.closest(".form-check").classList.contains("form-switch");
            })
        ).toBe(false);
        const modernRestoreNavigation = page.waitForNavigation();
        await page.getByTestId("save-button").click();
        await modernRestoreNavigation;
        await expect(page.locator(".carbon-status-page")).toBeVisible();

        // Ensure changes are visible
        await expect(page.locator(".carbon-status-page")).toHaveClass(/dark/);
        await expect(page.getByTestId("incident")).toHaveCount(1);
        await expect(page.locator(".carbon-incident-meta > .carbon-incident-status")).toContainText("Monitoring");
        await expect(page.getByTestId("incident")).toContainText("We're currently experiencing issues");
        await expect(page.getByTestId("incident-products")).toContainText(monitorName);
        await expect(page.getByTestId("incident-preview-updates").locator("li")).toHaveCount(1);
        await expect(page.getByTestId("overall-status")).toContainText("Degraded Service");
        await expect(page.getByTestId("overall-status").locator(".overall-status-heading strong")).toHaveCSS(
            "font-weight",
            "400"
        );
        await expect(page.getByTestId("overall-status").locator(".overall-status-description")).toHaveCSS(
            "font-weight",
            "400"
        );
        await expect(page.getByTestId("incident-title")).toContainText(incidentTitle);
        await expect(page.getByTestId("incident-title")).toHaveCSS("font-size", "16px");
        await expect(page.getByTestId("incident-title")).toHaveCSS("font-weight", "400");
        await expect(page.getByTestId("incident-preview-updates").locator(".incident-content")).toContainText(
            incidentContent
        );
        await expect(page.getByTestId("incident-preview-updates").locator(".incident-content")).toHaveCSS(
            "font-size",
            "14px"
        );
        const incidentStatusColor = await page
            .locator(".carbon-incident-meta > .carbon-incident-status")
            .evaluate((element) => getComputedStyle(element).color);
        expect(incidentStatusColor).toBe("rgb(251, 191, 36)");
        await page.locator(".carbon-status-page").evaluate((element) => element.classList.remove("dark"));
        await expect(page.locator(".carbon-incident-meta > .carbon-incident-status")).toHaveCSS(
            "color",
            "rgb(251, 191, 36)"
        );
        await page.locator(".carbon-status-page").evaluate((element) => element.classList.add("dark"));
        expect(
            await page.getByTestId("incident-title").evaluate((element) => {
                return getComputedStyle(element).color;
            })
        ).toBe("rgb(255, 255, 255)");
        await expect(page.getByTestId("group-name")).toContainText(groupName);
        await expect(page.getByTestId("powered-by")).toHaveCount(0);

        await page.getByTestId("incident-view-updates").click();
        const incidentDetail = page.getByTestId("incident-detail");
        await expect(incidentDetail).toBeVisible();
        await expect(incidentDetail.locator("h2")).toHaveCSS("font-size", "19px");
        await expect(incidentDetail.locator("h2")).toHaveCSS("font-weight", "400");
        await expect(page.getByTestId("affected-components")).toContainText(monitorName);
        await expect(page.getByTestId("affected-components")).toContainText("1 affected component");
        await expect(page.getByTestId("incident-updates").locator("li")).toHaveCount(1);

        await page.getByTestId("edit-button").click();
        const incidentUpdateForm = page.getByTestId("incident-update-form");
        await expect(incidentUpdateForm).toBeVisible();
        await page.getByTestId("incident-update-status").selectOption("investigating");
        await page.getByTestId("incident-update-content").fill("We are investigating the reported issue.");
        await incidentUpdateForm.getByRole("button", { name: "Post update" }).click();
        await expect(page.getByTestId("incident-updates").locator("li")).toHaveCount(2);
        await expect(incidentDetail.getByTestId("incident-status").first()).toContainText("Investigating");
        await expect(incidentDetail.getByTestId("incident-status").first()).toHaveCSS("color", "rgb(245, 92, 92)");
        await page.getByRole("button", { name: "Back to status" }).click();
        await expect(page.getByTestId("incident")).toHaveClass(/is-investigating/);
        const incidentPreviewUpdates = page.getByTestId("incident-preview-updates");
        await expect(incidentPreviewUpdates.locator("li")).toHaveCount(2);
        await expect(incidentPreviewUpdates.locator(".carbon-incident-status").nth(0)).toHaveCSS(
            "color",
            "rgb(245, 92, 92)"
        );
        await expect(incidentPreviewUpdates.locator(".carbon-incident-status").nth(1)).toHaveCSS(
            "color",
            "rgb(245, 92, 92)"
        );
        await expect(page.getByTestId("incident-products").locator(".carbon-incident-product")).toHaveCSS(
            "color",
            "rgb(245, 92, 92)"
        );
        await page.getByTestId("incident-view-updates").click();
        await expect(incidentDetail).toBeVisible();

        await page.getByTestId("incident-update-status").selectOption("identified");
        await page.getByTestId("incident-update-content").fill("We have identified the cause of the issue.");
        await incidentUpdateForm.getByRole("button", { name: "Post update" }).click();
        await expect(page.getByTestId("incident-updates").locator("li")).toHaveCount(3);
        await expect(page.getByTestId("incident-updates")).toContainText("We have identified the cause of the issue.");
        await expect(incidentDetail.getByTestId("incident-status").first()).toContainText("Identified");
        await expect(incidentDetail.getByTestId("incident-status").first()).toHaveCSS("color", "rgb(251, 191, 36)");

        await page.getByTestId("incident-update-status").selectOption("monitoring");
        await page.getByTestId("incident-update-content").fill("A mitigation is in place; we are monitoring recovery.");
        await page.getByTestId("incident-update-form").getByRole("button", { name: "Post update" }).click();
        await expect(page.getByTestId("incident-updates").locator("li")).toHaveCount(4);
        await expect(page.getByTestId("incident-updates")).toContainText(
            "A mitigation is in place; we are monitoring recovery."
        );
        await page.getByRole("button", { name: "Back to status" }).click();
        await expect(incidentPreviewUpdates.locator("li")).toHaveCount(3);
        await expect(incidentPreviewUpdates).toContainText("We are investigating the reported issue.");
        await expect(incidentPreviewUpdates).toContainText("We have identified the cause of the issue.");
        await expect(incidentPreviewUpdates).toContainText("A mitigation is in place; we are monitoring recovery.");
        await expect(incidentPreviewUpdates).not.toContainText(incidentContent);
        await expect(incidentPreviewUpdates.locator(".carbon-incident-status").nth(0)).toHaveCSS(
            "color",
            "rgb(251, 191, 36)"
        );
        await expect(incidentPreviewUpdates.locator(".carbon-incident-status").nth(1)).toHaveCSS(
            "color",
            "rgb(251, 191, 36)"
        );
        await expect(incidentPreviewUpdates.locator(".carbon-incident-status").nth(2)).toHaveCSS(
            "color",
            "rgb(251, 191, 36)"
        );
        await page.getByTestId("incident-view-updates").click();
        await expect(incidentDetail).toBeVisible();

        await page.getByTestId("incident-update-status").selectOption("resolved");
        await page.getByTestId("incident-update-content").fill("All affected services are operating normally again.");
        await page.getByTestId("incident-update-form").getByRole("button", { name: "Post update" }).click();
        await expect(page.getByTestId("incident-updates").locator("li")).toHaveCount(5);
        await expect(page.getByTestId("incident-updates")).toContainText(
            "All affected services are operating normally again."
        );
        await expect(incidentDetail.getByTestId("incident-status").first()).toContainText("Resolved");
        await expect(incidentDetail.getByTestId("incident-status").first()).toHaveCSS("color", "rgb(36, 193, 154)");

        await page.getByRole("button", { name: "Back to status" }).click();
        await expect(page.getByTestId("incident")).toHaveCount(0);
        await expect(page.getByTestId("incident-history-title")).toContainText(incidentTitle);
        await page.locator(".carbon-incident-history-item .incident-actions button[title='Edit']").click();
        const incidentManageModal = page.locator(".modal.show");
        await expect(incidentManageModal.getByTestId("incident-manage-status")).toHaveValue("resolved");
        await expect(incidentManageModal.locator("#incident-style")).toHaveCount(0);
        await incidentManageModal.getByRole("button", { name: "Save" }).click();
        await expect(incidentManageModal).toBeHidden();
        await page.getByTestId("incident-history-title").click();
        await expect(page.getByTestId("incident-updates").locator("li")).toHaveCount(5);
        await page.getByRole("button", { name: "Back to status" }).click();
        const updatesSaveNavigation = page.waitForNavigation();
        await page.getByTestId("save-button").click();
        await updatesSaveNavigation;

        await expect(page.getByTestId("monitor-name")).toHaveAttribute("href", monitorCustomUrl);
        await expect(page.getByTestId("monitor-name")).toHaveCSS("font-size", "16px");
        await expect(page.locator(".carbon-status-page-uptime")).toHaveCSS("font-size", "13px");

        await page.getByTestId("edit-button").click();
        await page.getByTestId("create-incident-button").click();
        const incidentEditor = page.getByTestId("incident-edit");
        await expect(incidentEditor).toBeVisible();
        await expect(incidentEditor.getByTestId("incident-edit-status")).toHaveValue("investigating");
        for (const selector of [".alert-heading", ".form-text", ".carbon-incident-post"]) {
            expect(
                await incidentEditor.locator(selector).evaluate((element) => {
                    return getComputedStyle(element).color;
                })
            ).toBe("rgb(255, 255, 255)");
        }
        await expect(incidentEditor.locator(".incident-monitor-options .form-check-label")).toHaveCSS(
            "color",
            "rgb(255, 255, 255)"
        );
        await expect(incidentEditor.locator('[data-testid="incident-affected-monitors"] > strong')).toHaveCSS(
            "color",
            "rgb(255, 255, 255)"
        );
        await screenshot(testInfo, page);
        await incidentEditor.getByRole("button", { name: "Cancel" }).click();
        const incidentEditorSaveNavigation = page.waitForNavigation();
        await page.getByTestId("save-button").click();
        await incidentEditorSaveNavigation;

        await expect(page.getByTestId("update-countdown-text")).toContainText("00:");
        const updateCountdown = Number(
            (await page.getByTestId("update-countdown-text").textContent()).match(/(\d+):(\d+)/)[2]
        );
        expect(updateCountdown).toBeGreaterThanOrEqual(refreshInterval - 10); // can't be certain when the timer will start, so ensure it's within expected range
        expect(updateCountdown).toBeLessThanOrEqual(refreshInterval);

        await expect(page.locator("body")).toHaveClass(theme);

        // Add Google Analytics ID to head and verify
        await page.waitForFunction(
            () => {
                return document.head.innerHTML.includes("https://www.googletagmanager.com/gtag/js?id=");
            },
            { timeout: 5000 }
        );
        expect(await page.locator("head").innerHTML()).toContain(googleAnalyticsId);

        const backgroundColor = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
        expect(backgroundColor).toEqual("rgb(0, 128, 128)");

        await screenshot(testInfo, page);
        expect(await page.locator("head").innerHTML()).toContain(googleAnalyticsId);

        // Flip the "Show Tags" and "Show Powered By" checkboxes:
        await page.getByTestId("edit-button").click();
        await expect(page.getByTestId("edit-sidebar")).toHaveCount(1);
        await page.getByTestId("show-tags-checkbox").setChecked(true);
        await page.getByTestId("show-powered-by-checkbox").setChecked(true);

        await screenshot(testInfo, page);

        // Fill in umami analytics after editing
        await page.getByTestId("analytics-type-select").selectOption("umami");
        await page.getByTestId("analytics-script-url-input").fill(umamiAnalyticsScriptUrl);
        await page.getByTestId("analytics-id-input").fill(umamiAnalyticsWebsiteId);
        const umamiSaveNavigation = page.waitForNavigation();
        await page.getByTestId("save-button").click();
        await umamiSaveNavigation;

        await expect(page.getByTestId("edit-sidebar")).toHaveCount(0);
        const poweredBy = page.getByTestId("powered-by");
        const poweredByLink = poweredBy.getByRole("link", { name: "Uptime Kuma" });
        await expect(poweredBy).toContainText("Powered by");
        expect(await poweredBy.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(143, 143, 149)");
        expect(await poweredByLink.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(255, 255, 255)");
        await poweredByLink.hover();
        await expect(poweredByLink).toHaveCSS("color", "rgb(161, 161, 166)");

        // Modified tag verification to check both tags
        await expect(page.getByTestId("monitor-tag").filter({ hasText: tagValue })).toBeVisible();
        await expect(page.getByTestId("monitor-tag").filter({ hasText: tagValue2 })).toBeVisible();

        await screenshot(testInfo, page);

        expect(await page.locator("head").innerHTML()).toContain(umamiAnalyticsScriptUrl);
        expect(await page.locator("head").innerHTML()).toContain(umamiAnalyticsWebsiteId);

        await page.getByTestId("edit-button").click();
        // Fill in plausible analytics after editing
        await page.getByTestId("analytics-type-select").selectOption("plausible");
        await page.getByTestId("analytics-script-url-input").fill(plausibleAnalyticsScriptUrl);
        await page.getByTestId("analytics-id-input").fill(plausibleAnalyticsDomainsUrls);
        const plausibleSaveNavigation = page.waitForNavigation();
        await page.getByTestId("save-button").click();
        await plausibleSaveNavigation;
        await screenshot(testInfo, page);
        await page.waitForFunction(
            (scriptUrl) => {
                return document.head.innerHTML.includes(scriptUrl);
            },
            plausibleAnalyticsScriptUrl,
            { timeout: 5000 }
        );
        expect(await page.locator("head").innerHTML()).toContain(plausibleAnalyticsScriptUrl);
        expect(await page.locator("head").innerHTML()).toContain(plausibleAnalyticsDomainsUrls);

        await page.getByTestId("edit-button").click();
        // Fill in matomo analytics after editing
        await page.getByTestId("analytics-type-select").selectOption("matomo");
        await page.getByTestId("analytics-script-url-input").fill(matomoUrl);
        await page.getByTestId("analytics-id-input").fill(matomoSiteId);
        const matomoSaveNavigation = page.waitForNavigation();
        await page.getByTestId("save-button").click();
        await matomoSaveNavigation;
        await screenshot(testInfo, page);
        await page.waitForFunction(
            (url) => {
                return document.head.innerHTML.includes(url);
            },
            matomoUrl,
            { timeout: 5000 }
        );
        expect(await page.locator("head").innerHTML()).toContain(matomoUrl);
        expect(await page.locator("head").innerHTML()).toContain(matomoSiteId);

        await expect(page.locator(".carbon-status-page .carbon-bars .heartbeat-canvas").first()).toHaveCSS(
            "height",
            "22px"
        );
        await page.goto("./settings/appearance");
        await page.locator('label[for="btncheck6"]').click();
        await page.goto("./status/example");
        await expect(page.locator(".carbon-status-page")).toBeVisible();
        await expect(page.getByTestId("monitor")).toHaveCount(1);
        await expect(page.locator(".carbon-status-page .carbon-bars")).toHaveCount(0);
    });

    // @todo Test certificate expiry
    // @todo Test domain names

    test("RSS feed escapes malicious monitor names", async ({ page }, testInfo) => {
        test.setTimeout(60000);

        // Test various XSS payloads in monitor names
        const maliciousMonitorName1 = "<script>alert(1)</script>";
        const maliciousMonitorName2 = "x</title><script>alert(document.domain)</script><title>";
        const normalMonitorName = "Production API Server";

        await page.goto("./add");
        await login(page);

        // Create first monitor with script tag payload
        await expect(page.getByTestId("monitor-type-select")).toBeVisible();
        await page.getByTestId("monitor-type-select").selectOption("http");
        await page.getByTestId("friendly-name-input").fill(maliciousMonitorName1);
        await page.getByTestId("url-input").fill("https://malicious1.example.com");
        await page.getByTestId("save-button").click();
        await page.waitForURL("/dashboard/*");

        // Create second monitor with title breakout payload
        await page.goto("./add");
        await page.getByTestId("monitor-type-select").selectOption("http");
        await page.getByTestId("friendly-name-input").fill(maliciousMonitorName2);
        await page.getByTestId("url-input").fill("https://malicious2.example.com");
        await page.getByTestId("save-button").click();
        await page.waitForURL("/dashboard/*");

        // Create third monitor with normal name
        await page.goto("./add");
        await page.getByTestId("monitor-type-select").selectOption("http");
        await page.getByTestId("friendly-name-input").fill(normalMonitorName);
        await page.getByTestId("url-input").fill("https://normal.example.com");
        await page.getByTestId("save-button").click();
        await page.waitForURL("/dashboard/*");

        // Create a status page
        await page.goto("./add-status-page");
        await page.getByTestId("name-input").fill("Security Test");
        await page.getByTestId("slug-input").fill("security-test");
        await page.getByTestId("submit-button").click();
        await page.waitForURL("/status/security-test?edit");

        // Add a group and all monitors
        await page.getByTestId("add-group-button").click();
        await page.getByTestId("group-name").fill("Test Group");

        // Add all three monitors
        await page.getByTestId("monitor-select").click();
        await page.getByTestId("monitor-select").getByRole("option", { name: maliciousMonitorName1 }).click();
        await page.getByTestId("monitor-select").click();
        await page.getByTestId("monitor-select").getByRole("option", { name: maliciousMonitorName2 }).click();
        await page.getByTestId("monitor-select").click();
        await page.getByTestId("monitor-select").getByRole("option", { name: normalMonitorName }).click();

        await page.getByTestId("save-button").click();
        await expect(page.getByTestId("edit-sidebar")).toHaveCount(0);

        // Fetch the RSS feed
        const rssResponse = await page.request.get("/status/security-test/rss");
        expect(rssResponse.status()).toBe(200);
        expect(rssResponse.headers()["content-type"]).toBe("application/rss+xml; charset=utf-8");
        expect(rssResponse.ok()).toBeTruthy();

        const rssContent = await rssResponse.text();

        // Attach RSS content for inspection
        await testInfo.attach("rss-feed.xml", {
            body: rssContent,
            contentType: "application/xml",
        });

        // Verify all payloads are escaped using CDATA
        expect(rssContent).toContain(`<title><![CDATA[${maliciousMonitorName1} is down]]></title>`);
        expect(rssContent).toContain(`<title><![CDATA[${maliciousMonitorName2} is down]]></title>`);
        expect(rssContent).toContain(`<title><![CDATA[${normalMonitorName} is down]]></title>`);

        // Verify RSS feed structure is valid
        expect(rssContent).toContain('<?xml version="1.0"');
        expect(rssContent).toContain("<rss");
        expect(rssContent).toContain("</rss>");

        // Verify RSS feed uses status page title as fallback (from issue #6217)
        expect(rssContent).toContain("<title>Security Test RSS Feed</title>");

        // Verify RSS link uses the correct domain (not localhost hardcoded)
        expect(rssContent).toMatch(/<link>https?:\/\/[^<]+\/status\/security-test<\/link>/);

        // Test custom RSS title functionality
        const customRssTitle = "Custom RSS Feed Title";
        await page.getByTestId("edit-button").click();
        await expect(page.getByTestId("edit-sidebar")).toHaveCount(1);
        await page.getByTestId("rss-title-input").fill(customRssTitle);
        await page.getByTestId("save-button").click();
        await expect(page.getByTestId("edit-sidebar")).toHaveCount(0);

        // Fetch RSS feed again - retry until custom title appears (DB write may not be committed yet)
        let rssContentCustom;
        for (let i = 0; i < 10; i++) {
            const rssResponseCustom = await page.request.get("/status/security-test/rss");
            expect(rssResponseCustom.status()).toBe(200);
            rssContentCustom = await rssResponseCustom.text();
            if (rssContentCustom.includes(`<title>${customRssTitle}</title>`)) {
                break;
            }
            await page.waitForTimeout(500);
        }

        // Verify RSS feed uses custom title
        expect(rssContentCustom).toContain(`<title>${customRssTitle}</title>`);

        await testInfo.attach("rss-feed-custom-title.xml", {
            body: rssContentCustom,
            contentType: "application/xml",
        });

        await screenshot(testInfo, page);
    });
});
