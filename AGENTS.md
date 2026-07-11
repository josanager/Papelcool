# Papelcool Agent Notes

## Read First

Before making any change in Papelcool, read in this order:

1. `AGENTS.md`
2. `PROJECT_CONTEXT.md`
3. the local skill that applies to the task
4. the real code files that will be changed

## Design order

For any task that changes UI, layout, styling, HTML, CSS, or visual frontend behavior in Papelcool:

1. Apply the `papelcool-design-filter` skill first.
2. Inside that filter, review `uncodixfy` first and follow it strictly.
3. Only after that, continue with the base frontend/design guidance.

If there is a conflict, prefer:

1. Existing Papelcool visual language and product constraints
2. `uncodixfy`
3. Base frontend/design defaults

## Auth return context

For any task that changes login, registration, auth-gated actions, guest CTAs, or post-auth navigation:

1. Read `.agent/skills/auth-return-context/SKILL.md` first.
2. Persist the user's exact context before opening auth.
3. After login or registration, return the user to that same page or section.
4. If auth started from preset comments, reopen that same comments panel automatically.
