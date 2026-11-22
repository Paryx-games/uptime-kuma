<template>
    <div class="incident-group" :class="{ 'carbon-incident-group': modernDesign }" data-testid="incident-group">
        <div v-if="loading && incidents.length === 0" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">{{ $t("Loading...") }}</span>
            </div>
        </div>

        <div v-else-if="incidents.length === 0" class="text-center py-4 text-muted">
            {{ $t("No incidents recorded") }}
        </div>

        <div v-else class="incident-list" :class="{ 'carbon-incident-list': modernDesign }">
            <div
                v-for="incident in incidents"
                :key="incident.id"
                class="incident-item"
                :class="{ resolved: !incident.active, 'carbon-incident-history-item': modernDesign }"
            >
                <template v-if="modernDesign">
                    <div class="carbon-incident-history-date">
                        <strong>{{ datetimeFormat(incident.createdDate, "D") }}</strong>
                        <span>{{ datetimeFormat(incident.createdDate, "ddd") }}</span>
                    </div>
                    <div class="carbon-incident-history-stripe" :class="`is-${statusOf(incident)}`"></div>
                    <div class="carbon-incident-history-content">
                        <div class="carbon-incident-history-heading">
                            <button
                                type="button"
                                class="carbon-incident-history-title"
                                data-testid="incident-history-title"
                                @click="$emit('view-incident', incident)"
                            >
                                {{ incident.title }}
                            </button>
                            <span class="carbon-incident-history-time">
                                {{
                                    datetimeFormat(
                                        latestUpdate(incident)?.createdDate || incident.createdDate,
                                        "h:mm A"
                                    )
                                }}
                            </span>
                        </div>
                        <IncidentStatus :incident="incident" />
                        <!-- eslint-disable vue/no-v-html -->
                        <div
                            class="carbon-incident-history-summary"
                            v-html="getIncidentHTML(latestUpdate(incident)?.content || incident.content)"
                        ></div>
                        <!-- eslint-enable vue/no-v-html -->
                        <div v-if="editMode" class="incident-actions">
                            <button
                                v-if="incident.active"
                                class="btn btn-success btn-sm me-1"
                                :title="$t('Resolve')"
                                @click="$emit('resolve-incident', incident)"
                            >
                                <font-awesome-icon icon="check" />
                            </button>
                            <button
                                class="btn btn-outline-secondary btn-sm me-1"
                                :title="$t('Edit')"
                                @click="$emit('edit-incident', incident)"
                            >
                                <font-awesome-icon icon="edit" />
                            </button>
                            <button
                                class="btn btn-outline-danger btn-sm"
                                :title="$t('Delete')"
                                @click="$emit('delete-incident', incident)"
                            >
                                <font-awesome-icon icon="trash" />
                            </button>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="incident-style-indicator" :class="`bg-${incident.style}`"></div>
                    <div class="incident-body">
                        <div class="incident-header d-flex justify-content-between align-items-start">
                            <h5 class="incident-title mb-0">{{ incident.title }}</h5>
                            <div v-if="editMode" class="incident-actions">
                                <button
                                    v-if="incident.active"
                                    class="btn btn-success btn-sm me-1"
                                    :title="$t('Resolve')"
                                    @click="$emit('resolve-incident', incident)"
                                >
                                    <font-awesome-icon icon="check" />
                                </button>
                                <button
                                    class="btn btn-outline-secondary btn-sm me-1"
                                    :title="$t('Edit')"
                                    @click="$emit('edit-incident', incident)"
                                >
                                    <font-awesome-icon icon="edit" />
                                </button>
                                <button
                                    class="btn btn-outline-danger btn-sm"
                                    :title="$t('Delete')"
                                    @click="$emit('delete-incident', incident)"
                                >
                                    <font-awesome-icon icon="trash" />
                                </button>
                            </div>
                        </div>
                        <!-- eslint-disable-next-line vue/no-v-html-->
                        <div class="incident-content mt-1" v-html="getIncidentHTML(incident.content)"></div>
                        <div class="incident-meta text-muted small mt-2">
                            <div>{{ $t("createdAt", { date: datetime(incident.createdDate) }) }}</div>
                            <div v-if="incident.lastUpdatedDate">
                                {{ $t("lastUpdatedAt", { date: datetime(incident.lastUpdatedDate) }) }}
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import { marked } from "marked";
import DOMPurify from "dompurify";
import datetimeMixin from "../mixins/datetime";
import IncidentStatus from "./IncidentStatus.vue";

export default {
    name: "IncidentHistory",
    components: {
        IncidentStatus,
    },
    mixins: [datetimeMixin],
    props: {
        incidents: {
            type: Array,
            default: () => [],
        },
        editMode: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        modernDesign: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["edit-incident", "delete-incident", "resolve-incident", "view-incident"],
    methods: {
        /**
         * Get sanitized HTML for incident content
         * @param {string} content - Markdown content
         * @returns {string} Sanitized HTML
         */
        getIncidentHTML(content) {
            if (content != null) {
                return DOMPurify.sanitize(marked(content));
            }
            return "";
        },
        /**
         * Get the latest status update for an incident.
         * @param {object} incident Incident data
         * @returns {object|null} Latest update
         */
        latestUpdate(incident) {
            const updates = incident.updates || [];
            return updates[updates.length - 1] || null;
        },
        /**
         * Get the status represented by the incident.
         * @param {object} incident Incident data
         * @returns {string} Incident status
         */
        statusOf(incident) {
            return incident.status || (incident.active ? "investigating" : "resolved");
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.incident-group {
    padding: 10px;

    .incident-list {
        .incident-item {
            display: flex;
            padding: 13px 15px 10px 15px;
            border-radius: 10px;
            transition: all ease-in-out 0.15s;

            &:hover {
                background-color: $highlight-white;
            }

            &.resolved {
                opacity: 0.7;
            }

            .incident-style-indicator {
                width: 6px;
                min-height: 100%;
                border-radius: 3px;
                flex-shrink: 0;
                margin-right: 12px;
            }

            .incident-body {
                flex: 1;
                min-width: 0;
            }

            .incident-meta {
                font-size: 12px;
            }
        }
    }
}

.incident-group.carbon-incident-group {
    padding: 0;

    .incident-list.carbon-incident-list {
        .incident-item.carbon-incident-history-item {
            display: grid;
            padding: 16px 0;
            border-radius: 0;
            opacity: 1;
            transition: none;

            &:hover {
                background-color: transparent;
            }
        }
    }
}

.dark {
    .incident-group {
        .incident-list {
            .incident-item {
                &:hover {
                    background-color: $dark-bg2;
                }
            }
        }
    }
}
</style>
