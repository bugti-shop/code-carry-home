# Flowist red rebrand and logo rollout

## Goal
Replace Flowist’s existing blue brand identity with `#db252d`, use the uploaded Flowist logo everywhere, and make Android/iOS splash screens white.

## Changes
- Update the global primary, darker pressed-state, focus, selection, and supporting brand tokens so standard buttons, active controls, cards, folders, sections, onboarding, calendars, and dashboards inherit the new red consistently.
- Replace remaining direct blue brand values across the landing page and app. Preserve colors that communicate a different meaning, such as success green, warning amber, destructive states, and intentionally user-selected multicolor palettes; replace their existing default-blue choice with the new red.
- Replace all in-app logo imports, landing/header branding, paywall/checkout/onboarding/share-card branding, browser favicon, Apple touch icon, installable-web icons, notification icons, and social/manifest logo references with versions derived from the uploaded logo.
- Create native-ready Android and iOS icon/splash source assets from the uploaded logo, with safe padding and a white splash background. Update Capacitor splash configuration and setup documentation to use `#FFFFFF` without changing Capacitor 5.
- Update web theme metadata and manifest colors to `#db252d`.

## Technical details
- Convert `#db252d` to the project’s HSL token format for the global design system, with accessible darker red pressed/border variants.
- Generate square icon sizes from the uploaded 768×768 logo without stretching it. Keep a real 64×64 favicon in `public/` and optimized app assets for runtime use.
- Since native `android/` and `ios/` platform folders are not currently in this project checkout, prepare canonical `resources/` icon and splash files so `npx cap sync` / native asset generation applies them on the Mac, and document the exact native regeneration command.
- Verify no old primary-blue brand values or old logo imports remain, then check the preview build and key landing/app screens.

## Validation
- Confirm the project builds successfully.
- Check desktop and mobile landing views plus the main app/onboarding surfaces.
- Confirm generated icons are square, readable, and splash canvases are white.
