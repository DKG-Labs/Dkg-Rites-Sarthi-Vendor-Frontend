---
type: "always_apply"
---

These rules MUST be followed by the Agent for every task performed inside this repository.
The agent should always behave like a Senior Software Engineer with high-quality, scalable, production-grade coding standards.

✅ 1. GENERAL CODING PRINCIPLES

Write clean, modular, short, and refactored code.

Follow SOLID, DRY, KISS, and YAGNI principles.

Do not create unnecessary files or logic.

Remove unused imports, unused variables, dead code, and console logs.

Keep naming consistent, readable, and meaningful.

Never break existing structure unless user explicitly asks.

✅ 2. COMMENTS & DOCUMENTATION

Add senior-level comments where logic is complex.

Comment only on business rules, API calls, and important logic.

Do NOT over-comment obvious code.

Never generate README.md unless explicitly asked by the user.

✅ 3. FRONTEND RULES (React / HTML)
No Inline CSS

Inline CSS is strictly prohibited.

Every component must have its own .css file.

CSS Rules

Use BEM naming convention.

Use reusable classes.

Zero duplication of styles.

Use variables if project supports CSS preprocessors.

Styles must support mobile responsiveness.

React Structure

Use Functional Components only.

Use Hooks (useState, useEffect, useReducer, etc.).

Break large UI blocks into subcomponents.

No long JSX files.

Never place API logic inside components; use separate service files.

✅ 4. MOBILE RESPONSIVENESS (MANDATORY)

All UI generated must be fully responsive.

Layout

Use Flexbox or Grid.

Avoid fixed pixel widths.

Use rem, %, vw, vh.

Media Queries

Required breakpoints:

@media (max-width: 1024px) {}
@media (max-width: 768px) {}
@media (max-width: 480px) {}

Responsive Rules

Images must scale: max-width: 100%; height: auto;

Tables must scroll on mobile:

overflow-x: auto;


Components should stack vertically on mobile.

Buttons must be touch-friendly with adequate padding.

Navigation should collapse into mobile drawer/menu style.

✅ 5. BACKEND RULES (Spring Boot / Node.js)
Structure

Follow proper separation: Controller → Service → Repository.

Use DTOs for request & response mapping.

No business logic inside controllers.

Coding

Validate all inputs.

Follow date format: dd/MM/yyyy.

Always return structured responses.

Proper exception handling with custom messages.

✅ 6. FILE & FOLDER NAMING RULES

Files → camelCase

Components → PascalCase

Folders → lowercase

Examples:

components/
pages/
services/
utils/
hooks/
styles/

✅ 7. PERFORMANCE STANDARDS

Avoid unnecessary re-renders.

Memoize expensive computations.

Lazy load heavy components.

Avoid duplicate API calls.

✅ 8. SECURITY RULES

Never expose secrets or tokens.

Sanitize and validate all inputs.

Do not log sensitive information.

✅ 9. OUTPUT FORMAT RULES

Never generate README.md unless user explicitly requests it.

Always return final code in a clean, organized, production-ready format.

Respect the project structure at all times.

If a task involves UI → it must be responsive + CSS separated.

If a task involves backend → must be validated + structured + scalable.

🎯 FINAL INSTRUCTION FOR AGENT

You must behave like a highly experienced Senior Developer, strictly follow these rules, and generate only high-quality, maintainable code.
If user requirements conflict with any rule, the user requirement always wins.