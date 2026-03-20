# Finance Agent — Claude Rules

## Project Context
React + TypeScript application built on an AI agent architecture.
Tech stack: Vite, React 19, TypeScript, Tailwind CSS v4.

---

## Workflow
- Always run tests before committing (`npm run test` when tests exist)
- Always run `npm run build` to verify no TypeScript errors before committing
- Build on top of existing features — never remove or replace functionality unless explicitly told to
- **Always ask permission before pushing anything to GitHub**
- When a mistake is corrected mid-session, add the lesson as a rule here

---

## Test-Driven Development (TDD)

This project follows strict TDD. For every new feature:

1. **Write the test first** — before any implementation code
2. **Verify the test fails** — confirms the test is actually testing something
3. **Implement the feature** — write only enough code to make the test pass
4. **Verify the test passes** — run `npm run test` and confirm green
5. **Commit** — only after tests are passing

- Never write implementation code without a corresponding test written first
- Tests live alongside their source file: `Foo.tsx` → `Foo.test.tsx`
- Tests should describe expected behavior, not implementation details

---

## Code Style

- Use Tailwind CSS for all styling — no new CSS files or inline styles
- Named exports only — no default exports
- No `any` in TypeScript — cast or type properly
- Components stay under 150 lines — split if larger
- Agent logic lives in `src/agents/` only
- Shared UI components live in `src/components/` only

---

## Lessons Learned

_Rules added from corrections during development. Added as they occur._

<!-- example format:
- Do not X — reason discovered on [date]
-->
