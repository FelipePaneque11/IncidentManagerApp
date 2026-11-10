//typescript test file

//test defines a test
//expect checks if something happened as expected
import { test, expect } from "@playwright/test"

test("a user can register an manager an incident", async function({ page}) {
    //unique names prevent clashes with existing sample data
    const suffix = Date.now()
    const username = "e2e_" + suffix
    const password = "BrowserTestPassword123!"
    const title = "E2E payment outage " + suffix
    const updatedTitle = "E2E resolved paymentt outage " + suffix
    const description = "Customer cant complete payments during this automated browser check,."

    await page.goto("/")

    //Register through the interface
    await page.getByRole("button", {
        name: "Create Account", 
        exact: true,
    }).click()

    await page.getByLabel("Username").fill(username)
    await page.getByLabel("Password").fill(password)

    await page.getByRole("button", {
        name: "Create account",
        exact: true,
    }).click()

    await expect(page.getByRole("status")).toContainText("created")

    //login with the new account
    await page.getByLabel("Username").fill(username)
    await page.getByLabel("Password").fill(password)

    await page.getByRole("button", {
        name: "Log in",
        exact: true,
    }).click()

    await expect(page.getByRole("button", {
        name: "Log out",
        exact: true,
    })).toBeVisible()

    // Reloading should preserve the login session.
    await page.reload()

    await expect(page.getByRole("button", {
        name: "Log out",
        exact: true,
    })).toBeVisible()

    // Create an incident.
    await page.getByRole("button", {
        name: /^new incident$/i,
    }).click()

    await page.getByLabel("Title", { exact: true }).fill(title)
    await page.getByLabel("Description", { exact: true }).fill(description)

    // Scope this lookup to the form because filters also have a Priority label.
    const form = page.locator("form")
    const priority = form.getByLabel(/priority/i)

    await expect(priority).toBeVisible()
    await priority.selectOption({value: "high"})

    await page.getByRole("button", {
        name: /^Create Incident$/i,
    }).click()

    const incidentButton = page.getByRole("button", {
        name: title,
        exact: true,
    })

    await expect(incidentButton).toBeVisible()

    // Open its details and check the full description.
    await incidentButton.click()

    const details = page.locator(".incident-details")
    await expect(details.getByText(description, {
        exact: true,
    })).toBeVisible()

    // Edit the title and status.
    await details.getByRole("button", {
        name: "Edit Incident",
        exact: true,
    }).click()

    await page.getByLabel("Title", { exact: true }).fill(updatedTitle)
    await form.getByLabel(/status/i).selectOption({value: "resolved"})

    await page.getByRole("button", {
        name: "Save changes",
        exact: true,
    }).click()

    const updatedButton = page.getByRole("button", {
        name: updatedTitle,
        exact: true,
    })

    await expect(updatedButton).toBeVisible()

    const updatedRow = page.getByRole("row").filter({
        has: updatedButton,
    })

    await expect(updatedRow).toContainText("Resolved")

    // Assign the incident to the account created by this test.
    await updatedButton.click()
    const assignee = form.getByLabel(/assignee/i)

    await expect(assignee).toBeVisible()
    await assignee.selectOption({label: username})

    await page.getByRole("button", {
        name: "Save assignee",
        exact: true,
    }).click()

    await expect(updatedRow).toContainText(username)

    // First check that cancelling deletion keeps the incident.
    page.once('dialog', async function (dialog) {
        await dialog.dismiss()
    })

    await details.getByRole("button", {
        name: "Delete incident",
        exact: true,
    }).click()

    await expect(details).toBeVisible()
    await expect(updatedButton).toBeVisible()

    // Now confirm deletion.
    page.once('dialog', async function (dialog) {
        await dialog.accept()
    })

    await details.getByRole("button", {
        name: "Delete incident",
        exact: true,
    }).click()

    await expect(page.getByRole("status")).toContainText("deleted successfully")
    await expect(updatedButton).toHaveCount(0)

    // Log out and verify that a reload keeps us logged out.
    await page.getByRole("button", {
        name: "Log out",
        exact: true,
    }).click()

    await expect(page.getByRole("button", {
        name: "Log in",
        exact: true,
    })).toBeVisible()

    await page.reload()

    await expect(page.getByRole("button", {
        name: "Log in",
        exact: true,
    })).toBeVisible()
})