# End-to-End (E2E) Testing Patterns

## Overview
Unit tests ensure that your gears and cogs work in isolation. E2E tests (Cypress, Playwright, Selenium) ensure that when you assemble the entire engine in the car, the car actually drives.

## 1. The Golden Rule of E2E Selectors

Never select a DOM element using a CSS class name or a generic HTML tag.

**Why?**
A frontend developer changes `<button class="btn-blue">` to `<button class="btn-red">` during a redesign. The E2E test instantly crashes because it can't find `.btn-blue`, even though the exact same button is still sitting right there. This is a "Flaky Test".

**The Fix:**
Use dedicated testing attributes (`data-testid`, `data-cy`) or ARIA roles that are explicitly immune to redesigns.

**Bad:**
```javascript
cy.get('.login-form > .btn-primary').click();
```

**Good:**
```javascript
// A designer can change the CSS entirely, and this test survives.
cy.get('[data-testid="submit-login-button"]').click();
```

## 2. The Page Object Model (POM)

If 20 different tests all click the "Login" button, and the ID of that button changes, you must update 20 files.
The Page Object Model solves this by encapsulating the UI map into a Class.

```javascript
// LoginPage.js
export class LoginPage {
    getUsernameInput() { return cy.get('[data-testid="username-input"]'); }
    getPasswordInput() { return cy.get('[data-testid="password-input"]'); }
    getSubmitButton() { return cy.get('[data-testid="submit-button"]'); }

    login(user, pass) {
        this.getUsernameInput().type(user);
        this.getPasswordInput().type(pass);
        this.getSubmitButton().click();
    }
}

// UserCheckout.test.js
const loginPage = new LoginPage();
loginPage.login("admin@test.com", "password123");
// Proceed with checkout test...
```

## 3. Database State and Isolation

E2E tests frequently fail because Test A creates a user named "Alice", and Test B crashes because it tries to create "Alice" and the database rejects the duplicate email.

### Rule: Seed and Wipe
Before the E2E suite runs, the database MUST be wiped completely clean, and re-seeded with a known baseline set of data (e.g., exactly 1 Admin User, exactly 3 Products).

### Rule: API Seeding over UI Seeding
If you are testing the Shopping Cart, do not waste 10 seconds of DOM manipulation forcing Cypress to log in via the UI first.
Make a raw HTTP `POST` to your login endpoint to grab the JWT, set the cookie programmatically, and navigate directly to the `/cart` page. This strips the execution time of an E2E suite from hours down to minutes.
