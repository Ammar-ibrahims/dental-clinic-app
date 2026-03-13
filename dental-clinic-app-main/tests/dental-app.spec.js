const { test, expect } = require('@playwright/test');

const APP_URL = 'http://16.170.201.132.nip.io';

test('Navigation Test: Should load the patients list', async ({ page }) => {
    await page.goto(APP_URL);

    // 1. Click on the "Patients" link in the nav bar
    await page.click('text=Patients');

    // 2. Verify the URL changed
    await expect(page).toHaveURL(/.*patients/);

    // 3. FIXED: Target the specific heading by its name
    // This ignores the logo and looks specifically for the "Patients" title
    const heading = page.getByRole('heading', { name: 'Patients', exact: true });
    await expect(heading).toBeVisible();
});

test('Functional Test: Should open the Add Patient form', async ({ page }) => {
    await page.goto(`${APP_URL}/patients`);

    // Click the Add Patient button
    await page.click('text=+ Add Patient');

    // Verify the form heading appears
    const formHeading = page.getByRole('heading', { name: 'Add New Patient' });
    await expect(formHeading).toBeVisible();

    // Verify the "Name" input exists using its label (Good for Accessibility!)
    await expect(page.locator('input[name="name"]')).toBeVisible();
});