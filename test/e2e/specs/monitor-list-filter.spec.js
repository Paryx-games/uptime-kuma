import { expect, test } from "@playwright/test";
import { login, restoreSqliteSnapshot } from "../util-test";

test.describe("Monitor list filter menu", () => {
    test.beforeEach(async ({ page }) => {
        await restoreSqliteSnapshot(page);
        await page.goto("./list");
        await login(page);
    });

    test("closes with Escape after a filter is picked", async ({ page }) => {
        const toggle = page.getByRole("button", { name: "Filter", exact: true });
        const menu = page.locator(".dropdown-menu.carbon-menu");

        await toggle.click();
        await menu.getByRole("button", { name: /Down/ }).click();
        await toggle.focus();
        await page.keyboard.press("Escape");

        await expect(menu).toBeHidden();
    });

    test("closes on an outside click after a filter is picked", async ({ page }) => {
        const toggle = page.getByRole("button", { name: "Filter", exact: true });
        const menu = page.locator(".dropdown-menu.carbon-menu");

        await toggle.click();
        await menu.getByRole("button", { name: /Down/ }).click();
        await page.mouse.click(5, 5);

        await expect(menu).toBeHidden();
    });

    test("test monitor controls simulate status changes", async ({ page }) => {
        const testMonitor = page.locator(".carbon-row").filter({
            has: page.getByRole("link", { name: "Test", exact: true }),
        });
        const status = testMonitor.getByLabel("Test monitor status");

        await expect(testMonitor).toBeVisible();
        await expect(page.locator(".carbon-row").last()).toContainText("Test");
        await expect(testMonitor.getByText("Development only")).toBeVisible();
        await expect(status).toHaveValue("2");

        await status.selectOption("0");
        await expect(testMonitor.locator(".sub")).toContainText("Down");

        await status.selectOption("3");
        await expect(testMonitor.locator(".sub")).toContainText("Maintenance");

        await status.selectOption("2");
        await expect(testMonitor.locator(".sub")).toContainText("Pending");

        await status.selectOption("1");
        await expect(testMonitor.locator(".sub")).toContainText("Up");
    });
});
