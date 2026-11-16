<template>
    <div class="carbon carbon-login" :class="$root.theme">
        <div class="carbon-login-form">
            <router-link to="/" class="carbon-login-brand">
                <svg
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
                Uptime
            </router-link>
            <h1>{{ $t("Page not found") }}</h1>
            <p class="carbon-muted">{{ $t("notFoundHelp") }}</p>
            <div class="d-flex gap-2 mt-3">
                <a href="/" class="btn btn-primary">{{ $t("Go to the dashboard") }}</a>
                <button type="button" class="btn btn-normal" @click="goBack()">{{ $t("Go back") }}</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    async mounted() {},
    methods: {
        /**
         * Go back 1 in browser history
         * @returns {void}
         */
        goBack() {
            history.back();
        },
    },
};
</script>
