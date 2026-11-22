<template>
    <div
        class="shadow-box alert mb-4 p-4 incident carbon-incident-editor"
        role="alert"
        :class="'bg-' + modelValue.style"
        data-testid="incident-edit"
    >
        <strong>{{ $t("Title") }}:</strong>
        <Editable
            :model-value="modelValue.title"
            tag="h4"
            :contenteditable="true"
            :noNL="true"
            class="alert-heading"
            data-testid="incident-title"
            @update:model-value="updateField('title', $event)"
        />

        <strong>{{ $t("Content") }}:</strong>
        <Editable
            :model-value="modelValue.content"
            tag="div"
            :contenteditable="true"
            class="content"
            data-testid="incident-content-editable"
            @update:model-value="updateField('content', $event)"
        />
        <div class="form-text">
            {{ $t("markdownSupported") }}
        </div>

        <div class="mt-3" data-testid="incident-affected-monitors">
            <strong>{{ $t("Affected components") }}:</strong>
            <div v-if="availableMonitors.length === 0" class="form-text">
                {{ $t("Add services to the status page to select affected components.") }}
            </div>
            <div v-else class="incident-monitor-options">
                <label v-for="monitor in availableMonitors" :key="monitor.id" class="form-check">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        :checked="(modelValue.affectedMonitorIDs || []).includes(monitor.id)"
                        :data-testid="`affected-monitor-${monitor.id}`"
                        @change="toggleAffectedMonitor(monitor.id, $event.target.checked)"
                    />
                    <span class="form-check-label">{{ monitor.name }}</span>
                </label>
            </div>
        </div>

        <div class="mt-3 carbon-incident-actions">
            <button
                class="btn btn-light me-2 carbon-incident-post"
                data-testid="post-incident-button"
                @click="$emit('post')"
            >
                <font-awesome-icon icon="bullhorn" />
                {{ $t("Post") }}
            </button>

            <button class="btn btn-light me-2" @click="$emit('cancel')">
                <font-awesome-icon icon="times" />
                {{ $t("Cancel") }}
            </button>

            <div class="dropdown d-inline-block me-2">
                <button
                    id="dropdownMenuButton1"
                    class="btn btn-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    {{ $t("Style") }}: {{ $t(modelValue.style) }}
                </button>
                <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'info')">
                            {{ $t("info") }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'warning')">
                            {{ $t("warning") }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'danger')">
                            {{ $t("danger") }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'primary')">
                            {{ $t("primary") }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'light')">
                            {{ $t("light") }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'dark')">
                            {{ $t("dark") }}
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "IncidentEditForm",
    props: {
        modelValue: {
            type: Object,
            required: true,
        },
        availableMonitors: {
            type: Array,
            default: () => [],
        },
    },
    emits: ["update:modelValue", "post", "cancel"],
    methods: {
        updateField(field, value) {
            this.$emit("update:modelValue", {
                ...this.modelValue,
                [field]: value,
            });
        },
        toggleAffectedMonitor(monitorID, selected) {
            const affectedMonitorIDs = [...(this.modelValue.affectedMonitorIDs || [])];
            const index = affectedMonitorIDs.indexOf(monitorID);

            if (selected && index === -1) {
                affectedMonitorIDs.push(monitorID);
            } else if (!selected && index !== -1) {
                affectedMonitorIDs.splice(index, 1);
            }

            this.updateField("affectedMonitorIDs", affectedMonitorIDs);
        },
    },
};
</script>

<style lang="scss" scoped>
.incident {
    .content {
        &[contenteditable="true"] {
            min-height: 60px;
        }
    }

    .incident-monitor-options {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 18px;
        margin-top: 8px;
    }

    .incident-monitor-options .form-check {
        margin: 0;
    }
}
</style>
