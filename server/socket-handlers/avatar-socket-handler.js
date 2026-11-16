const fs = require("fs");
const { R } = require("redbean-node");
const { checkLogin } = require("../util");
const Database = require("../database");

const PNG_DATA_URL_PREFIX = "data:image/png;base64,";
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// The browser resizes the picture to a small square before sending it
const MAX_AVATAR_BYTES = 512 * 1024;

/**
 * Decode an avatar sent as a PNG data URL
 * @param {string} dataUrl data:image/png;base64,... string
 * @returns {Buffer} PNG bytes
 * @throws {Error} When it is not a PNG or is too large
 */
function decodeAvatar(dataUrl) {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith(PNG_DATA_URL_PREFIX)) {
        throw new Error("Only PNG images are allowed");
    }

    const bytes = Buffer.from(dataUrl.slice(PNG_DATA_URL_PREFIX.length), "base64");

    if (!bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
        throw new Error("Only PNG images are allowed");
    }

    if (bytes.length > MAX_AVATAR_BYTES) {
        throw new Error("The image is too large");
    }

    return bytes;
}

/**
 * File name of a user's avatar in the upload directory
 * @param {string} userID User ID
 * @returns {string} File name
 */
function avatarFilename(userID) {
    return `avatar-${String(userID).replace(/[^\w-]/g, "")}.png`;
}

/**
 * Handlers for the user's profile picture
 * @param {Socket} socket Socket.io instance
 * @returns {void}
 */
function avatarSocketHandler(socket) {
    socket.on("setAvatar", async (dataUrl, callback) => {
        try {
            checkLogin(socket);

            const filePath = Database.uploadDir + avatarFilename(socket.userID);
            let image = null;

            if (dataUrl) {
                await fs.promises.writeFile(filePath, decodeAvatar(dataUrl));
                image = `/upload/${avatarFilename(socket.userID)}?t=${Date.now()}`;
            } else {
                await fs.promises.rm(filePath, { force: true });
            }

            await R.exec("UPDATE better_auth_user SET image = ? WHERE id = ?", [image, socket.userID]);
            socket.emit("avatar", image);

            callback({
                ok: true,
                msg: "Saved.",
                msgi18n: true,
            });
        } catch (e) {
            callback({
                ok: false,
                msg: e.message,
            });
        }
    });
}

module.exports = {
    avatarSocketHandler,
    avatarFilename,
    decodeAvatar,
};
