# Nulo Workspace Code Style Guide

This document defines the coding standards used throughout all Nulo Workspace projects.

The goal is consistency, readability, maintainability, scalability, and craftsmanship.

Code should feel intentional, structured, and immediately recognizable regardless of project type.

---

# Philosophy

Favor readability over brevity.

Favor clarity over cleverness.

Favor maintainability over shortcuts.

Code should be easy to understand months after it was written.

Avoid dense formatting, unnecessary complexity, and compressed code.

Every file should feel like it was written by the same developer.

When uncertainty exists, choose the solution that improves long-term maintainability.

---

# Naming Conventions

## Classes and IDs

Always use camelCase.

Correct:

```css
.heroSection

.heroContent

.mobileMenu

.contactForm
```

Incorrect:

```css
.hero-section

.hero_section

HeroSection
```

---

## Variables

Use descriptive camelCase names.

Correct:

```javascript
const heroSection = document.querySelector('.heroSection');

const selectedGuestCount = 4;
```

Avoid vague names.

Incorrect:

```javascript
const data = {};

const item = {};
```

unless context makes the purpose obvious.

---

## Functions

Use descriptive action-oriented names.

Correct:

```javascript
openRSVPModal()

closeMobileMenu()

submitContactForm()

initializeGallery()
```

Avoid generic names.

Incorrect:

```javascript
run()

start()

handle()

doThing()
```

---

# HTML Standards

## Section Banners

Major sections begin with large comment banners.

Example:

```html
<!-- ============================================================
     HERO SECTION
============================================================ -->
```

Use banners for major page sections and systems.

Examples:

* Header
* Navigation
* Hero
* About
* Services
* Gallery
* Forms
* Footer
* Modals
* Components

---

## Element Spacing

Use generous whitespace.

Correct:

```html
<section class="heroSection">

    <div class="heroContainer">

        <h1>
            Emily & Cam
        </h1>

        <p>
            A Decade of Memories, A Lifetime To Go
        </p>

    </div>

</section>
```

Avoid dense markup.

---

## Attribute Formatting

Short elements may remain on one line.

Long elements should stack attributes vertically.

Correct:

```html
<img
    class="heroImage"
    src="images/heroImage.jpg"
    alt="Emily and Cam"
>
```

---

## Blank Lines

Insert blank lines between nested elements when appropriate.

Allow code to breathe.

Favor readability over compression.

---

# CSS Standards

## Opening Braces

Opening braces always live on their own line.

Correct:

```css
.heroSection
{

}
```

---

## Property Spacing

Use whitespace generously.

Correct:

```css
.heroSection
{

    position: relative;

    width: 100%;

    height: 100vh;

    overflow: hidden;

}
```

Avoid dense property blocks.

---

## Selector Formatting

Never compress selectors into single-line declarations.

Correct:

```css
.button
{

    color: white;

}
```

Incorrect:

```css
.button { color: white; }
```

---

## Multi-Selector Groups

Format selector groups vertically.

Correct:

```css
.one,
.two,
.three
{

    property: value;

}
```

---

## Major Section Banners

Use:

```css
/* ============================================================
   HERO SECTION
============================================================ */
```

Examples:

* Variables
* Reset
* Typography
* Navigation
* Hero
* Sections
* Components
* Forms
* Footer
* Animations
* Media Queries

---

## Subsection Comments

Use:

```css
/* ── Typography ── */

/* ── Buttons ── */

/* ── Layout ── */
```

---

## Media Queries

Expand all media queries.

Correct:

```css
@media (min-width: 768px)
{

    .heroSection
    {

        padding: 4rem;

    }

}
```

---

## Keyframes

Expand keyframes fully.

Correct:

```css
@keyframes fadeUp
{

    from
    {

        opacity: 0;

    }

    to
    {

        opacity: 1;

    }

}
```

---

## Organization

Group related selectors together.

Maintain visual rhythm throughout the file.

Avoid dense walls of code.

---

# JavaScript Standards

## File Structure

Major systems should be separated using section banners.

Example:

```javascript
/* ============================================================
   MOBILE MENU
============================================================ */
```

Examples:

* Mobile Menu
* Modals
* Forms
* Animations
* API Requests
* Dashboard Widgets
* Event Handlers

---

## Function Organization

Group related functions together.

Keep related functionality within the same section.

Maintain logical file flow.

Example:

1. Constants
2. Selectors
3. State
4. Utility Functions
5. Core Functions
6. Event Listeners
7. Initialization

---

## Formatting

Use whitespace generously.

Correct:

```javascript
function openModal()
{

    modal.classList.add('isActive');

}
```

Avoid compressed formatting.

---

## Conditionals

Always use braces.

Correct:

```javascript
if (menuOpen)
{

    closeMenu();

}
```

Incorrect:

```javascript
if (menuOpen) closeMenu();
```

---

## Event Listeners

Keep listeners organized near the bottom of the file when practical.

Example:

```javascript
menuButton.addEventListener(
    'click',
    openMenu
);
```

---

## Maintainability

Favor readable logic.

Avoid unnecessary nesting.

Avoid clever shortcuts that reduce readability.

Write code another developer can understand immediately.

---

## Production Readiness

Remove:

* Unused variables
* Unused functions
* Temporary debugging code
* Obsolete logic

Do not leave unfinished development code in production files.

---

# File Structure

HTML:

```text
index.html
about.html
services.html
contact.html
```

CSS:

```text
css/styleIndex.css
css/stylePages.css
```

JavaScript:

```text
js/indexJS.js
js/siteJS.js
```

Assets:

```text
images/
logos/
```

Documentation:

```text
docs/
```

---

# General Rules

Preserve consistency across the project.

Follow established project patterns.

Favor reusable systems over one-off solutions.

Avoid unnecessary dependencies.

Write code intended for production use.

Prioritize maintainability, readability, and scalability.

---

# Quality Check

Before completing work, ask:

* Is the code readable?
* Is the code consistent?
* Does it match existing project patterns?
* Is it maintainable?
* Is it production-ready?
* Does it feel handcrafted rather than generated?

If not, improve the implementation before completion.

---

# Reference Standard

Existing project standards take priority.

When uncertainty exists:

* Match surrounding code.
* Match existing project architecture.
* Match established formatting patterns.

Every file should look like it belongs to the same ecosystem.

The codebase should communicate consistency, professionalism, and craftsmanship.
