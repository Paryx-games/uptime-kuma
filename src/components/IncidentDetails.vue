<template>
    <section class="carbon-incident-details" data-testid="incident-detail">
        <button type="button" class="carbon-incident-back" @click="$emit('back')">
            <font-awesome-icon icon="angle-down" rotation="90" aria-hidden="true" />
            {{ $t("Back to status") }}
        </button>

        <article class="carbon-incident-detail-card" :class="`is-${incident.status || 'investigating'}`">
            <header class="carbon-incident-detail-header">
                <IncidentStatus :incident="incident" />
                <h2>{{ incident.title }}</h2>
            </header>
            <div class="carbon-incident-detail-summary">
                <div class="carbon-incident-detail-state">
                    <IncidentStatus :incident="incident" />
                    <span aria-hidden="true">·</span>
                    <span>{{ incidentImpact }}</span>
                </div>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-if="latestUpdate" class="incident-content" v-html="getIncidentHTML(latestUpdate.content)"></div>
                <div class="carbon-incident-detail-meta">
                    <time v-if="latestUpdate" :datetime="latestUpdate.createdDate">{{ datetime(latestUpdate.createdDate) }}</time>
                    <a href="#incident-updates">{{ $t("View all updates") }}</a>
                </div>
            </div>
        </article>

        <section class="carbon-incident-components" data-testid="affected-components">
            <header>
                <h3>{{ $t("Affected components") }}</h3>
                <span>{{ affectedComponentsLabel }}</span>
            </header>
            <div v-if="affectedMonitors.length === 0" class="carbon-incident-empty">
                {{ $t("No affected components") }}
            </div>
            <div v-else class="carbon-incident-component-list">
                <div v-for="monitor in affectedMonitors" :key="monitor.id" class="carbon-incident-component">
                    <div class="carbon-incident-component-heading">
                        <Uptime :monitor="monitor" type="24" :pill="true" />
                        <span>{{ monitor.name }}</span>
                    </div>
                    <HeartbeatBar
                        v-if="$root.userHeartbeatBar !== 'none'"
                        :monitor-id="monitor.id"
                        size="small"
                    />
                </div>
            </div>
        </section>

        <section id="incident-updates" class="carbon-incident-updates" data-testid="incident-updates">
            <header>
                <h3>{{ $t("Updates") }}</h3>
            </header>
            <div v-if="updates.length === 0" class="carbon-incident-empty">
                {{ $t("No incident updates yet") }}
            </div>
            <ol v-else class="carbon-incident-timeline">
                <li v-for="update in updates" :key="update.id" :class="`is-${update.status}`">
                    <IncidentStatus :incident="{ active: update.status !== 'resolved', status: update.status }" />
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <div class="incident-content" v-html="getIncidentHTML(update.content)"></div>
                    <time :datetime="update.createdDate">{{ datetime(update.createdDate) }}</time>
                </li>
            </ol>
        </section>

        <section v-if="editMode" class="carbon-incident-update-panel">
            <h3>{{ $t("Post an update") }}</h3>
            <IncidentUpdateForm
                :key="latestUpdate ? latestUpdate.id : incident.id"
                :incident="incident"
                :processing="processing"
                @submit-update="$emit('post-update', $event)"
            />
        </section>
    </section>
</template>

<script>
import { marked } from "marked";
import DOMPurify from "dompurify";
import datetimeMixin from "../mixins/datetime";
import HeartbeatBar from "./HeartbeatBar.vue";
import IncidentStatus from "./IncidentStatus.vue";
import IncidentUpdateForm from "./IncidentUpdateForm.vue";
import Uptime from "./Uptime.vue";

export default {
    name: "IncidentDetails",
    components: {
        HeartbeatBar,
        IncidentStatus,
        IncidentUpdateForm,
        Uptime,
    },
    mixins: [datetimeMixin],
    props: {
        incident: {
            type: Object,
            required: true,
        },
        publicMonitorList: {
            type: Object,
            required: true,
        },
        editMode: {
            type: Boolean,
            default: false,
        },
        processing: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["back", "post-update"],
    computed: {
        updates() {
            return this.incident.updates || [];
        },
        latestUpdate() {
            return this.updates[this.updates.length - 1] || null;
        },
        affectedMonitors() {
            return (this.incident.affectedMonitorIDs || [])
                .map((monitorID) => this.publicMonitorList[monitorID])
                .filter(Boolean);
        },
        affectedComponentsLabel() {
            const count = this.affectedMonitors.length;
            const key = count === 1 ? "affectedComponentCount" : "affectedComponentsCount";
            return this.$t(key, { count });
        },
        incidentImpact() {
            if (this.affectedMonitors.length === 0) {
                return this.$t("Service disruption");
            }
            if (this.affectedMonitors.length >= Object.keys(this.publicMonitorList).length) {
                return this.$t("Major outage");
            }
            return this.$t("Partial outage");
        },
    },
    methods: {
        /**
         * Render sanitized Markdown.
         * @param {string} content Markdown content
         * @returns {string} Sanitized HTML
         */
        getIncidentHTML(content) {
            return content ? DOMPurify.sanitize(marked(content)) : "";
        },
    },
};
</script>
