# Performance budget

This portfolio is statically pre-rendered. React is used during the build only and is not shipped to the browser.

## Initial page load

| Metric                               | Current | Budget    | Status  |
| ------------------------------------ | ------- | --------- | ------- |
| React shipped to browser             | 0 B     | ≤ 0 B     | ✅ PASS |
| Client-side hydration                | None    | None      | ✅ PASS |
| Theme bootstrap gzip                 | 355 B   | ≤ 1,000 B | ✅ PASS |
| Locale redirect gzip                 | 293 B   | ≤ 500 B   | ✅ PASS |
| Site controller gzip                 | 3,878 B | ≤ 3,900 B | ✅ PASS |
| Root executable JavaScript gzip      | 4,526 B | ≤ 4,600 B | ✅ PASS |
| Localized executable JavaScript gzip | 4,233 B | ≤ 4,300 B | ✅ PASS |
| CSS gzip                             | 7,457 B | ≤ 7,700 B | ✅ PASS |

## HTML

| Route | Current | Budget     | Status  |
| ----- | ------- | ---------- | ------- |
| /     | 8,365 B | ≤ 10,000 B | ✅ PASS |
| /en/  | 8,982 B | ≤ 10,000 B | ✅ PASS |
| /fr/  | 9,286 B | ≤ 10,000 B | ✅ PASS |
| /de/  | 9,253 B | ≤ 10,000 B | ✅ PASS |

## Secondary HTML

| Route        | Current | Budget     | Status  |
| ------------ | ------- | ---------- | ------- |
| /404.html    | 4,044 B | ≤ 10,000 B | ✅ PASS |
| /de/404.html | 4,093 B | ≤ 10,000 B | ✅ PASS |
| /de/legal/   | 4,904 B | ≤ 10,000 B | ✅ PASS |
| /de/privacy/ | 5,688 B | ≤ 10,000 B | ✅ PASS |
| /en/404.html | 4,044 B | ≤ 10,000 B | ✅ PASS |
| /en/legal/   | 4,774 B | ≤ 10,000 B | ✅ PASS |
| /en/privacy/ | 5,378 B | ≤ 10,000 B | ✅ PASS |
| /fr/404.html | 4,124 B | ≤ 10,000 B | ✅ PASS |
| /fr/legal/   | 4,933 B | ≤ 10,000 B | ✅ PASS |
| /fr/privacy/ | 5,746 B | ≤ 10,000 B | ✅ PASS |

The HTML budget applies independently to every generated page, including legal and 404 pages.

## Architecture

| Metric                       | Current | Budget | Status  |
| ---------------------------- | ------- | ------ | ------- |
| Client-side i18n runtime     | None    | None   | ✅ PASS |
| Third-party runtime requests | 0       | 0      | ✅ PASS |
| External fonts               | 0       | 0      | ✅ PASS |

## Media during navigation

| Metric              | Current           | Budget     | Status  |
| ------------------- | ----------------- | ---------- | ------- |
| Preview image count | 6                 | 6          | ✅ PASS |
| Preview images      | 101.7 kB          | ≤ 120.0 kB | ✅ PASS |
| Largest preview     | 3.avif (23,300 B) | ≤ 25.0 kB  | ✅ PASS |
| Social image        | 115.7 kB          | ≤ 250.0 kB | ✅ PASS |

The active poster may load immediately. Side previews use `loading="lazy"`, but the browser decides when to fetch them. Timelapse renditions are served from the media origin and are not measured here.

### Preview files

| File   | Current | Budget    | Status  |
| ------ | ------- | --------- | ------- |
| 1.avif | 12.6 kB | ≤ 25.0 kB | ✅ PASS |
| 2.avif | 12.3 kB | ≤ 25.0 kB | ✅ PASS |
| 3.avif | 23.3 kB | ≤ 25.0 kB | ✅ PASS |
| 4.avif | 17.3 kB | ≤ 25.0 kB | ✅ PASS |
| 5.avif | 14.1 kB | ≤ 25.0 kB | ✅ PASS |
| 6.avif | 22.1 kB | ≤ 25.0 kB | ✅ PASS |

Production budget passed.
