# Login and registration frontend

Preview [Sign in](http://localhost:5173/login) and [Create account](http://localhost:5173/register). The storefront guest avatar links to Sign in. Start the site with `npm run dev --prefix client` from the repository root.

The pages share an editorial layout, existing local photography, StyleFit colors and fonts, accessible form fields, and responsive styles. Code lives in `client/src/features/auth/` with separate page, field component, validation utility, and stylesheet. No dependencies were added.

Working interactions include page switching, email validation, required fields, registration password length and confirmation, password visibility controls, recovery form preview, first-invalid-field focus, and guest navigation. Switching routes clears form state. Valid submission clears entries and displays an explicit preview result; no authentication request, email, session, or account is created. Credentials are never stored in browser storage. Supabase authentication remains deferred.

TypeScript production compilation and Oxlint passed. Chrome checks covered login, registration and recovery validation, password visibility, route transitions, storefront navigation, lack of storage/submissions, and layouts at 320, 390, 600, 768, 1024, and 1440 pixels without horizontal overflow or browser errors.

Screenshots: [Login desktop](previews/login-desktop.png), [login mobile](previews/login-mobile.png), [registration desktop](previews/register-desktop.png), [registration mobile](previews/register-mobile.png).
