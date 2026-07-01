# Nulo Workspace Agent Instructions

## Purpose

You are working within the Nulo Workspace ecosystem.

Your objective is to deliver production-ready solutions while respecting the existing project architecture, standards, and requirements.

Before making any modifications, read:

* codeStyle.md

All coding, formatting, naming, structure, design, and project standards are defined there.

---

## Understand Before Modifying

Before making changes:

1. Review the relevant files and existing implementation.
2. Understand how the current system works.
3. Identify the requested objective.
4. Develop an implementation plan appropriate for the task.

Do not make assumptions about project requirements.

If requirements are unclear, ask for clarification.

---

## Respect Existing Architecture

Existing project architecture is intentional.

Before introducing new solutions:

* Understand the current approach.
* Evaluate how the existing system is designed.
* Extend existing systems when appropriate.
* Avoid replacing working architecture without a clear reason.

Do not migrate technologies, frameworks, databases, hosting solutions, authentication systems, deployment methods, or folder structures unless explicitly instructed.

Favor solutions that align with the existing project direction.

---

## Scope Discipline

Focus on the requested task.

Avoid unrelated changes, including:

* Unrequested redesigns
* Unrelated refactors
* Reorganizing project structure
* Rewriting functioning systems without cause

Improvements are welcome when they directly support the requested objective, but avoid expanding scope unnecessarily.

---

## Naming & Project Consistency

Preserve existing:

* Classes
* IDs
* Variables
* Functions
* Components
* File names
* Folder names
* Data attributes

unless explicitly instructed otherwise.

Maintain consistency with established project patterns.

---

## Engineering Standards

Write maintainable, production-ready code.

Favor:

* Readability
* Scalability
* Simplicity
* Performance
* Maintainability

Avoid:

* Duplicate logic
* Unnecessary complexity
* Temporary workarounds when a proper solution is reasonable
* Unused code
* Redundant dependencies

Use sound engineering judgment.

---

## Frontend Standards

Maintain:

* Responsive layouts
* Accessibility best practices
* Existing user experience patterns
* Cross-device usability

When modifying UI:

* Consider mobile
* Consider tablet
* Consider desktop

Preserve visual consistency across the project.

---

## Backend & System Standards

When applicable:

* Preserve data integrity.
* Preserve existing workflows.
* Consider downstream effects on APIs, databases, automations, integrations, and authentication systems.
* Maintain compatibility with existing infrastructure.

Think through the full system impact before implementing changes.

---

## Communication

For significant changes:

* Identify affected files.
* Explain why they are affected.
* Explain major implementation decisions.
* Highlight architectural, backend, database, API, automation, or deployment impacts when relevant.

Communicate clearly and concisely.

---

## Verification

Before considering work complete:

* Verify the requested objective was achieved.
* Verify existing functionality remains intact.
* Verify changes align with codeStyle.md.
* Verify no unnecessary changes were introduced.
* Verify the implementation is production-ready.

---

## Guiding Principle

Respect the project.

Understand before changing.

Stay focused on the objective.

Use professional engineering judgment.

Deliver the best solution for the requested task while maintaining consistency with the existing system and project standards.
