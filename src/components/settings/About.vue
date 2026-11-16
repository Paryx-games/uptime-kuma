<template>
    <div class="carbon-about">
        <svg
            class="logo"
            aria-hidden="true"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M3 12h4l3-7 4 14 3-7h4" />
        </svg>
        <div class="name">Uptime Kuma</div>
        <div class="carbon-muted">{{ $t("versionIs", { version: $root.info.version }) }}</div>
        <div class="carbon-muted">{{ $t("frontendVersionIs", { version: $root.frontendVersion }) }}</div>

        <div v-if="!$root.isFrontendBackendVersionMatched" class="alert alert-warning mt-4" role="alert">
            {{ $t("Frontend Version do not match backend version!") }}
        </div>

        <a
            class="carbon-quiet d-inline-block mt-3"
            href="https://github.com/louislam/uptime-kuma/releases"
            target="_blank"
            rel="noopener"
        >
            {{ $t("Check Update On GitHub") }}
        </a>

        <div class="mt-3">
            <div class="form-check">
                <input
                    id="checkUpdate"
                    v-model="settings.checkUpdate"
                    class="form-check-input"
                    type="checkbox"
                    @change="saveSettings()"
                />
                <label class="form-check-label" for="checkUpdate">{{ $t("Show update if available") }}</label>
            </div>
            <div class="form-check">
                <input
                    id="checkBeta"
                    v-model="settings.checkBeta"
                    class="form-check-input"
                    type="checkbox"
                    :disabled="!settings.checkUpdate"
                    @change="saveSettings()"
                />
                <label class="form-check-label" for="checkBeta">{{ $t("Also check beta release") }}</label>
            </div>
        </div>

        <p class="carbon-muted mt-4">
            {{ $t("Font Twemoji by Twitter licensed under") }}
            <a class="carbon-quiet" href="https://creativecommons.org/licenses/by/4.0/">CC-BY 4.0</a>
        </p>
    </div>
</template>

<script>
export default {
    computed: {
        settings() {
            return this.$parent.$parent.settings;
        },
        saveSettings() {
            return this.$parent.$parent.saveSettings;
        },
        settingsLoaded() {
            return this.$parent.$parent.settingsLoaded;
        },
    },

    watch: {},
};
</script>

<style lang="scss" scoped>
.carbon-about {
    padding: 20px 0;

    .logo {
        color: var(--c-muted);
    }

    .name {
        margin-top: 12px;
        font-size: 16px;
        font-weight: 500;
    }
}
</style>
