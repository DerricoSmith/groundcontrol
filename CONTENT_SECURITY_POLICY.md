# Content Security Policy

Set in `next.config.ts` and applied to every response. Asserted by `e2e/security.spec.ts`.

## Current policy

| Directive | Value | Why |
| --- | --- | --- |
| default-src | 'self' | Nothing loads from another origin by default |
| base-uri | 'self' | Stops an injected `base` tag redirecting relative URLs |
| form-action | 'self' | A form cannot post to another origin |
| frame-ancestors | 'none' | Clickjacking |
| object-src | 'none' | No plugins, ever |
| script-src | 'self' 'unsafe-inline' 'unsafe-eval' | See below |
| style-src | 'self' 'unsafe-inline' | Tailwind and inline style attributes |
| img-src | 'self' data: blob: | Own screenshots, plus generated icons and OG images |
| font-src | 'self' data: | Self-hosted through next/font |
| connect-src | 'self' | The browser makes no third-party requests. The AI provider is server side only. |
| manifest-src | 'self' | |
| upgrade-insecure-requests | | |

## The unsafe directives

`script-src` allows `'unsafe-inline'` and `'unsafe-eval'`.

**Why.** Next.js bootstraps the App Router with inline scripts, and the theme provider sets the colour scheme before paint to avoid a flash of the wrong theme. Removing `'unsafe-inline'` requires a per-request nonce threaded from middleware through the document and every inline script Next emits. `'unsafe-eval'` is required by the development build and by parts of the React runtime.

**Honest assessment.** This meaningfully weakens the policy. A cross-site scripting vulnerability would not be blocked by CSP. It is a defence in depth layer that is currently thin on the script axis, and the primary protection remains React's escaping and the absence of `dangerouslySetInnerHTML` anywhere in the codebase.

**Not claimed as strict.** It would be easy to list a CSP and imply the application is hardened against injection. It is not, and this document exists so nobody reads the header and assumes otherwise.

## Improving it

1. Add middleware generating a per-request nonce.
2. Pass it through to the document and every inline script.
3. Replace `'unsafe-inline'` with `'nonce-...'` and `'strict-dynamic'`.
4. Remove `'unsafe-eval'` if the production build tolerates it.
5. Verify every page still renders and the theme does not flash.

Worth doing before real customer data lives in the product. Not worth rushing in a hardening release, since a broken CSP that blocks the theme script is a visible regression for every visitor.

## Other headers

`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone, and geolocation, and `Strict-Transport-Security` with a two year max age, subdomains, and preload.

Authenticated route prefixes additionally carry `X-Robots-Tag: noindex, nofollow`.
