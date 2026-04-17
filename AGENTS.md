# Papelcool Agent Notes

## Design order

For any task that changes UI, layout, styling, HTML, CSS, or visual frontend behavior in Papelcool:

1. Apply the `papelcool-design-filter` skill first.
2. Inside that filter, review `uncodixfy` first and follow it strictly.
3. Only after that, continue with the base frontend/design guidance.

If there is a conflict, prefer:

1. Existing Papelcool visual language and product constraints
2. `uncodixfy`
3. Base frontend/design defaults
