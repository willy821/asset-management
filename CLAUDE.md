# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static one-page marketing site for **Red Beacon Asset Management**. No build step, no package manager, no framework — open `index.html` directly in a browser.

## Running the site

```powershell
Start-Process "index.html"   # opens in default browser
```

There is no dev server, bundler, or test suite.

## Architecture

Three files, each with a clear responsibility:

| File | Role |
|------|------|
| `index.html` | All markup. Sections in order: `#home` (hero), `#why-us` (USP cards), `#testimonials` (carousel), `#contact` (form), footer. |
| `styles.css` | All styling. CSS custom properties defined in `:root`. Physical CSS properties only (no logical properties) so transitions work cross-browser. |
| `script.js` | All interactivity — navbar scroll, hamburger drawer, smooth scroll, IntersectionObserver scroll-reveal, stat counters, testimonial carousel, form validation + async submission. |

### CSS conventions
- Variables are in `:root` at the top of `styles.css`. Color, font, spacing, and shadow tokens all live there.
- Sections are delimited by `/* === SECTION NAME === */` banners.
- Use physical properties (`top`, `left`, `right`, `bottom`, `padding-left`, etc.) — **not** CSS logical properties (`inset-inline-end`, `padding-block`, etc.) because transitions on logical properties are unreliable across browsers and would break the mobile nav animation.
- Responsive breakpoints: `1024px` (tablet) and `768px` (mobile), with an additional `480px` for small phones.

### JavaScript conventions
- All code runs after DOM is ready (script tag is at end of `<body>`).
- String literals that contain apostrophes use double quotes to avoid terminating a single-quoted string.
- The `fade-up` / `in-view` pattern drives scroll-reveal: CSS starts elements at `opacity:0; transform:translateY(28px)`, JS adds `.in-view` via `IntersectionObserver`.
- Hero entrance animations (`hero-animate-1`, `hero-animate-2`) are pure CSS `@keyframes` — no JS involved.

### Form submission
- Uses [FormSubmit.co](https://formsubmit.co) for email delivery (no backend).
- The recipient address is `lunpin.hon@redbeaconam.com` — appears in both `index.html` (form `action` attribute) and `script.js` (fallback error message).
- First submission triggers a one-time confirmation email to that address before the endpoint is active.
- Submission is async (`fetch` with `Accept: application/json`); the `_next` hidden field is only a non-JS fallback.
