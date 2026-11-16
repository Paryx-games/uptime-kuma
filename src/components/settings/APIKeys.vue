<template>
    <div>
        <div v-if="settings.disableAuth" class="mt-5 d-flex align-items-center justify-content-center my-3">
            {{ $t("apiKeysDisabledMsg") }}
        </div>
        <div v-else class="my-3">
            <EmptyState v-if="Object.keys(keyList).length === 0" illustration="padlock" :title="$t('No API keys yet')">
                {{ $t("apiKeysEmptyHelp") }}
                <template #action>
                    <button class="btn btn-normal" type="button" @click="$refs.apiKeyDialog.show()">
                        {{ $t("Add API Key") }}
                    </button>
                </template>
            </EmptyState>
            <template v-else>
                <div v-for="(item, index) in keyList" :key="index" class="carbon-event">
                    <span class="carbon-dot" :class="item.status === 'active' ? 'up' : 'wait'" aria-hidden="true">
                        <i />
                    </span>
                    <span class="text">
                        {{ item.name }}
                        <span class="sub">
                            {{ $t("apiKey-" + item.status) }} · {{ $t("createdAt", { date: item.createdDate }) }} ·
                            {{ $t("Expires") }}: {{ item.expires || $t("Never") }}
                        </span>
                    </span>
                    <span class="when">
                        <button v-if="item.active" type="button" class="carbon-quiet" @click="disableDialog(item.id)">
                            {{ $t("Disable") }}
                        </button>
                        <button v-else type="button" class="carbon-quiet" @click="enableKey(item.id)">
                            {{ $t("Enable") }}
                        </button>
                        <button type="button" class="carbon-quiet ms-2" @click="deleteDialog(item.id)">
                            {{ $t("Delete") }}
                        </button>
                    </span>
                </div>
                <button class="btn btn-normal mt-3" type="button" @click="$refs.apiKeyDialog.show()">
                    {{ $t("Add API Key") }}
                </button>
            </template>
        </div>

        <Confirm ref="confirmPause" :yes-text="$t('Yes')" :no-text="$t('No')" @yes="disableKey">
            {{ $t("disableAPIKeyMsg") }}
        </Confirm>

        <Confirm ref="confirmDelete" btn-style="btn-danger" :yes-text="$t('Yes')" :no-text="$t('No')" @yes="deleteKey">
            {{ $t("deleteAPIKeyMsg") }}
        </Confirm>

        <APIKeyDialog ref="apiKeyDialog" />
    </div>
</template>

<script>
import APIKeyDialog from "../../components/APIKeyDialog.vue";
import Confirm from "../Confirm.vue";
import EmptyState from "../EmptyState.vue";

export default {
    components: {
        APIKeyDialog,
        Confirm,
        EmptyState,
    },
    data() {
        return {
            selectedKeyID: null,
        };
    },
    computed: {
        keyList() {
            let result = Object.values(this.$root.apiKeyList);
            return result;
        },
        settings() {
            return this.$parent.$parent.$parent.settings;
        },
    },

    methods: {
        /**
         * Show dialog to confirm deletion
         * @param {number} keyID ID of monitor that is being deleted
         * @returns {void}
         */
        deleteDialog(keyID) {
            this.selectedKeyID = keyID;
            this.$refs.confirmDelete.show();
        },

        /**
         * Delete a key
         * @returns {void}
         */
        deleteKey() {
            this.$root.deleteAPIKey(this.selectedKeyID, (res) => {
                this.$root.toastRes(res);
            });
        },

        /**
         * Show dialog to confirm pause
         * @param {number} keyID ID of key to pause
         * @returns {void}
         */
        disableDialog(keyID) {
            this.selectedKeyID = keyID;
            this.$refs.confirmPause.show();
        },

        /**
         * Pause API key
         * @returns {void}
         */
        disableKey() {
            this.$root.getSocket().emit("disableAPIKey", this.selectedKeyID, (res) => {
                this.$root.toastRes(res);
            });
        },

        /**
         * Resume API key
         * @param {number} id Key to resume
         * @returns {void}
         */
        enableKey(id) {
            this.$root.getSocket().emit("enableAPIKey", id, (res) => {
                this.$root.toastRes(res);
            });
        },
    },
};
</script>
