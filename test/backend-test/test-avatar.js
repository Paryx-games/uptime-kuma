const { describe, test } = require("node:test");
const assert = require("node:assert");
const { avatarFilename, decodeAvatar } = require("../../server/socket-handlers/avatar-socket-handler");

// Smallest valid PNG: 1x1 transparent pixel
const TINY_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("Avatar", () => {
    test("decodeAvatar() returns the PNG bytes", () => {
        const bytes = decodeAvatar(TINY_PNG);
        assert.strictEqual(bytes.subarray(1, 4).toString(), "PNG");
    });

    test("decodeAvatar() refuses other image types", () => {
        assert.throws(() => decodeAvatar("data:image/svg+xml;base64,PHN2Zy8+"), /Only PNG/);
    });

    test("decodeAvatar() refuses a PNG data URL that holds something else", () => {
        const notPng = "data:image/png;base64," + Buffer.from("<script>").toString("base64");
        assert.throws(() => decodeAvatar(notPng), /Only PNG/);
    });

    test("decodeAvatar() refuses a picture over the size limit", () => {
        const big = Buffer.alloc(600 * 1024);
        Buffer.from(TINY_PNG.split(",")[1], "base64").copy(big);
        assert.throws(() => decodeAvatar("data:image/png;base64," + big.toString("base64")), /too large/);
    });

    test("avatarFilename() keeps only safe characters", () => {
        assert.strictEqual(avatarFilename("abc-123_X"), "avatar-abc-123_X.png");
        assert.strictEqual(avatarFilename("../../etc/passwd"), "avatar-etcpasswd.png");
    });
});
