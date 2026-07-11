---
name: auth-return-context
description: Use when adding or changing login/register CTAs, auth-gated UI, or guest-to-authenticated flows in Papelcool. Persist the user's exact context before opening auth, then return them to that same page or section after login or registration.
---

# Auth Return Context

For auth-gated UI in Papelcool:

1. Let guests see public content when appropriate.
2. Block only the authenticated action.
3. Persist the exact user context before opening auth.
4. Restore that same context after login or registration.

## Required behavior

- If auth starts from a specific UI section, return the user to that same section.
- If auth starts from preset comments, reopen that same comments panel.
- Guests may read public comments, but must not see the active composer or profile avatar until authenticated.
- Guest CTAs should stay minimal: `Inicia sesión` and `Regístrate`.

## Implementation pattern

- Persist a return context in `sessionStorage`.
- Include:
  - current URL
  - current app view
  - current preset when relevant
  - whether a panel must reopen
  - a source id when useful
- Clear the return context if auth is dismissed without completion.
- Preserve the return context across OAuth redirects.

## Papelcool helpers

- `setAuthReturnContext(...)`
- `openAuthWithReturn(mode, context)`
- `restoreAuthReturnContext()`
- `clearAuthReturnContext()`

For preset comments, store:

- `view: 'preset-preview'`
- `preset`
- `reopenComments: true`
- `source: 'preset-comments'`

## Avoid

- Do not always redirect to `home` after login/register.
- Do not show guest users an active comment composer.
- Do not drop the preset or section they came from.
