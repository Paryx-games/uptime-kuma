<template>
    <form class="carbon-incident-update-form" data-testid="incident-update-form" @submit.prevent="submit">
        <div class="mb-3">
            <label for="incident-update-status" class="form-label">{{ $t("Status") }}</label>
            <select id="incident-update-status" v-model="status" class="form-select" data-testid="incident-update-status">
                <option value="investigating">{{ $t("Investigating") }}</option>
                <option value="identified">{{ $t("Identified") }}</option>
                <option value="monitoring">{{ $t("Monitoring") }}</option>
                <option value="resolved">{{ $t("Resolved") }}</option>
            </select>
        </div>

        <div class="mb-3">
            <label for="incident-update-content" class="form-label">{{ $t("Update") }}</label>
            <textarea
                id="incident-update-content"
                v-model="content"
                class="form-control"
                rows="4"
                required
                data-testid="incident-update-content"
            ></textarea>
            <div class="form-text">{{ $t("markdownSupported") }}</div>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="processing">
            <span v-if="processing" class="spinner-border spinner-border-sm me-1" role="status"></span>
            {{ $t("Post update") }}
        </button>
    </form>
</template>

<script>
export default {
    name: "IncidentUpdateForm",
    props: {
        incident: {
            type: Object,
            required: true,
        },
        processing: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["submit-update"],
    data() {
        return {
            status: this.incident.status || "investigating",
            content: "",
        };
    },
    methods: {
        submit() {
            if (!this.content.trim()) {
                return;
            }

            this.$emit("submit-update", {
                status: this.status,
                content: this.content,
            });
        },
    },
};
</script>
