import { expect, test } from "@playwright/test"

test("mail shell renders consistently", async ({ page }) => {
  await page.goto("/iframe.html?id=mail-appshell--default&viewMode=story")
  await page.waitForLoadState("networkidle")

  await expect(page).toHaveScreenshot("app-shell.png", { fullPage: true })
})
