<template>
    <span class="carbon-incident-status" :class="`is-${colorStatus || status}`" data-testid="incident-status">
        <font-awesome-icon :icon="icon" aria-hidden="true" />
        <span>{{ $t(label) }}</span>
    </span>
</template>

<script>
const statusInfo = {
    investigating: {
        label: "Investigating",
        icon: "search",
    },
    identified: {
        label: "Identified",
        icon: "exclamation-triangle",
    },
    monitoring: {
        label: "Monitoring",
        icon: "stream",
    },
    resolved: {
        label: "Resolved",
        icon: "check-circle",
    },
};

export default {
    name: "IncidentStatus",
    props: {
        incident: {
            type: Object,
            required: true,
        },
        colorStatus: {
            type: String,
            default: null,
        },
    },
    computed: {
        status() {
            if (statusInfo[this.incident.status]) {
                return this.incident.status;
            }

            return this.incident.active ? "investigating" : "resolved";
        },
        label() {
            return statusInfo[this.status].label;
        },
        icon() {
            return statusInfo[this.status].icon;
        },
    },
};
</script>
