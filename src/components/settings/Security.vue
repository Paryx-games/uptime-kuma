<template>
    <div>
        <div v-if="settingsLoaded" class="my-4">
            <!-- Change Password -->
            <template v-if="!settings.disableAuth">
                <p>
                    <button
                        v-if="!settings.disableAuth"
                        id="logout-btn"
                        class="btn btn-danger ms-4 me-2 mb-2"
                        @click="$root.logout"
                    >
                        {{ $t("logoutCurrentUser", { username: $root.username }) }}
                    </button>
                </p>

                <h5 class="my-4 settings-subheading">{{ $t("Profile Picture") }}</h5>
                <div class="mb-4 d-flex align-items-center gap-3">
                    <img v-if="$root.userImage" :src="$root.userImage" class="avatar-preview" alt="" />
                    <input ref="avatarInput" type="file" accept="image/*" class="d-none" @change="uploadAvatar" />
                    <button type="button" class="btn btn-primary" @click="$refs.avatarInput.click()">
                        {{ $t("Upload Picture") }}
                    </button>
                    <button v-if="$root.userImage" type="button" class="btn btn-danger" @click="saveAvatar(null)">
                        {{ $t("Remove Picture") }}
                    </button>
                </div>

                <h5 class="my-4 settings-subheading">{{ $t("Change Password") }}</h5>
                <form class="mb-3" @submit.prevent="savePassword">
                    <div class="mb-3">
                        <label for="current-password" class="form-label">
                            {{ $t("Current Password") }}
                        </label>
                        <input
                            id="current-password"
                            v-model="password.currentPassword"
                            type="password"
                            class="form-control"
                            autocomplete="current-password"
                            required
                        />
                    </div>

                    <div class="mb-3">
                        <label for="new-password" class="form-label">
                            {{ $t("New Password") }}
                        </label>
                        <input
                            id="new-password"
                            v-model="password.newPassword"
                            type="password"
                            class="form-control"
                            autocomplete="new-password"
                            required
                        />
                    </div>

                    <div class="mb-3">
                        <label for="repeat-new-password" class="form-label">
                            {{ $t("Repeat New Password") }}
                        </label>
                        <input
                            id="repeat-new-password"
                            v-model="password.repeatNewPassword"
                            type="password"
                            class="form-control"
                            :class="{ 'is-invalid': invalidPassword }"
                            autocomplete="new-password"
                            required
                        />
                        <div class="invalid-feedback">
                            {{ $t("passwordNotMatchMsg") }}
                        </div>
                    </div>

                    <div>
                        <button class="btn btn-primary" type="submit">
                            {{ $t("Update Password") }}
                        </button>
                    </div>
                </form>
            </template>

            <div v-if="!settings.disableAuth" class="mt-5 mb-3">
                <h5 class="my-4 settings-subheading">
                    {{ $t("Two Factor Authentication") }}
                </h5>
                <div class="mb-4">
                    <button class="btn btn-primary me-2" type="button" @click="$refs.TwoFADialog.show()">
                        {{ $t("2FA Settings") }}
                    </button>
                </div>
            </div>

            <div class="my-4">
                <!-- Advanced -->
                <h5 class="my-4 settings-subheading">{{ $t("Advanced") }}</h5>

                <div class="mb-4">
                    <button
                        v-if="settings.disableAuth"
                        id="enableAuth-btn"
                        class="btn btn-outline-primary me-2 mb-2"
                        @click="enableAuth"
                    >
                        {{ $t("Enable Auth") }}
                    </button>
                    <button
                        v-if="!settings.disableAuth"
                        id="disableAuth-btn"
                        class="btn btn-primary me-2 mb-2"
                        @click="confirmDisableAuth"
                    >
                        {{ $t("Disable Auth") }}
                    </button>
                </div>
            </div>
        </div>

        <TwoFADialog ref="TwoFADialog" />

        <Confirm
            ref="confirmDisableAuth"
            btn-style="btn-danger"
            :yes-text="$t('I understand, please disable')"
            :no-text="$t('Leave')"
            @yes="disableAuth"
        >
            <i18n-t tag="p" keypath="disableauth.message1">
                <template #disableAuth>
                    <strong>{{ $t("disable authentication") }}</strong>
                </template>
            </i18n-t>
            <i18n-t tag="p" keypath="disableauth.message2">
                <template #intendThirdPartyAuth>
                    <strong>{{ $t("where you intend to implement third-party authentication") }}</strong>
                </template>
            </i18n-t>
            <p>{{ $t("Please use this option carefully!") }}</p>

            <div class="mb-3">
                <label for="current-password2" class="form-label">
                    {{ $t("Current Password") }}
                </label>
                <input
                    id="current-password2"
                    v-model="password.currentPassword"
                    type="password"
                    class="form-control"
                    required
                />
            </div>
        </Confirm>
    </div>
</template>

<script>
import Confirm from "../../components/Confirm.vue";
import TwoFADialog from "../../components/TwoFADialog.vue";
import { authClient } from "../../auth-client";

// Twice the largest size the picture is shown at, for sharp high-DPI screens
const AVATAR_SIZE = 256;

export default {
    components: {
        Confirm,
        TwoFADialog,
    },

    data() {
        return {
            invalidPassword: false,
            password: {
                currentPassword: "",
                newPassword: "",
                repeatNewPassword: "",
            },
        };
    },

    computed: {
        settings() {
            return this.$parent.$parent.$parent.settings;
        },
        saveSettings() {
            return this.$parent.$parent.$parent.saveSettings;
        },
        settingsLoaded() {
            return this.$parent.$parent.$parent.settingsLoaded;
        },
    },

    watch: {
        "password.repeatNewPassword"() {
            this.invalidPassword = false;
        },
    },

    methods: {
        /**
         * Crop the chosen image to a square, shrink it and save it as the profile picture
         * @param {Event} event Change event of the file input
         * @returns {void}
         */
        uploadAvatar(event) {
            const file = event.target.files[0];
            event.target.value = "";
            if (!file) {
                return;
            }

            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = AVATAR_SIZE;
                canvas.height = AVATAR_SIZE;
                const side = Math.min(image.width, image.height);
                const left = (image.width - side) / 2;
                const top = (image.height - side) / 2;
                canvas.getContext("2d").drawImage(image, left, top, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
                URL.revokeObjectURL(image.src);
                this.saveAvatar(canvas.toDataURL("image/png"));
            };
            image.onerror = () => {
                URL.revokeObjectURL(image.src);
                this.$root.toastError(this.$t("Only PNG, JPEG, GIF or WebP images can be used"));
            };
            image.src = URL.createObjectURL(file);
        },

        /**
         * Save or remove the profile picture
         * @param {?string} dataUrl PNG data URL, or null to remove the picture
         * @returns {void}
         */
        saveAvatar(dataUrl) {
            this.$root.getSocket().emit("setAvatar", dataUrl, (res) => {
                this.$root.toastRes(res);
            });
        },

        /**
         * Check new passwords match before saving them
         * @returns {Promise<void>}
         */
        async savePassword() {
            if (this.password.newPassword !== this.password.repeatNewPassword) {
                this.invalidPassword = true;
            } else {
                const { error } = await authClient.changePassword({
                    currentPassword: this.password.currentPassword,
                    newPassword: this.password.newPassword,
                });

                if (error) {
                    this.$root.toastRes({ ok: false, msg: error.message });
                } else {
                    this.$root.toastRes({ ok: true, msg: this.$t("successAuthChangePassword") });
                    this.password.currentPassword = "";
                    this.password.newPassword = "";
                    this.password.repeatNewPassword = "";
                }
            }
        },

        /**
         * Disable authentication for web app access
         * @returns {void}
         */
        disableAuth() {
            this.settings.disableAuth = true;

            // Need current password to disable auth
            // Set it to empty if done
            this.saveSettings(() => {
                this.password.currentPassword = "";
                this.$root.username = null;
            }, this.password.currentPassword);
        },

        /**
         * Enable authentication for web app access
         * @returns {void}
         */
        enableAuth() {
            this.settings.disableAuth = false;
            this.saveSettings();
            location.reload();
        },

        /**
         * Show confirmation dialog for disable auth
         * @returns {void}
         */
        confirmDisableAuth() {
            this.$refs.confirmDisableAuth.show();
        },
    },
};
</script>

<style lang="scss" scoped>
.avatar-preview {
    width: 48px;
    height: 48px;
    border-radius: 50rem;
    object-fit: cover;
}
</style>
