# Performance budget

This portfolio is statically pre-rendered. React is used during the build only and is not shipped to the browser.

## Initial page load

| Metric | Current | Budget | Status |
|---|---|---|---|
| React shipped to browser | 0 B | ≤ 0 B | ✅ PASS |
| Client-side hydration | None | None | ✅ PASS |
| Theme bootstrap gzip | 429 B | ≤ 1,000 B | ✅ PASS |
| Locale redirect gzip | 302 B | ≤ 500 B | ✅ PASS |
| Site controller gzip | 3,635 B | ≤ 3,900 B | ✅ PASS |
| Root executable JavaScript gzip | 4,366 B | ≤ 4,600 B | ✅ PASS |
| Localized executable JavaScript gzip | 4,064 B | ≤ 4,300 B | ✅ PASS |
| CSS gzip | 7,264 B | ≤ 7,700 B | ✅ PASS |

## HTML

| Route | Current | Budget | Status |
|---|---|---|---|
| / | 8,675 B | ≤ 10,000 B | ✅ PASS |
| /en/ | 9,207 B | ≤ 10,000 B | ✅ PASS |
| /fr/ | 9,534 B | ≤ 10,000 B | ✅ PASS |
| /de/ | 9,482 B | ≤ 10,000 B | ✅ PASS |

## Secondary HTML

| Route | Current | Budget | Status |
|---|---|---|---|
| /404.html | 4,053 B | ≤ 10,000 B | ✅ PASS |
| /de/404.html | 4,103 B | ≤ 10,000 B | ✅ PASS |
| /de/legal/ | 4,915 B | ≤ 10,000 B | ✅ PASS |
| /de/privacy/ | 5,697 B | ≤ 10,000 B | ✅ PASS |
| /en/404.html | 4,053 B | ≤ 10,000 B | ✅ PASS |
| /en/legal/ | 4,786 B | ≤ 10,000 B | ✅ PASS |
| /en/privacy/ | 5,386 B | ≤ 10,000 B | ✅ PASS |
| /fr/404.html | 4,136 B | ≤ 10,000 B | ✅ PASS |
| /fr/legal/ | 4,945 B | ≤ 10,000 B | ✅ PASS |
| /fr/privacy/ | 5,757 B | ≤ 10,000 B | ✅ PASS |

The HTML budget applies independently to every generated page, including legal and 404 pages.

## Architecture

| Metric | Current | Budget | Status |
|---|---|---|---|
| Client-side i18n runtime | None | None | ✅ PASS |
| Third-party runtime requests | 0 | 0 | ✅ PASS |
| External fonts | 0 | 0 | ✅ PASS |

## Media during navigation

| Metric | Current | Budget | Status |
|---|---|---|---|
| Timelapse video count | 6 | 6 | ✅ PASS |
| Timelapse videos | 234.8 MB | ≤ 250.0 MB | ✅ PASS |
| Largest video | 4.mp4 (62.4 MB) | ≤ 70.0 MB | ✅ PASS |
| Preview image count | 6 | 6 | ✅ PASS |
| Preview images | 103.9 kB | ≤ 120.0 kB | ✅ PASS |
| Largest preview | 6.jpg (20,302 B) | ≤ 25.0 kB | ✅ PASS |
| Social image | 115.7 kB | ≤ 250.0 kB | ✅ PASS |

The active poster may load immediately. Side previews use `loading="lazy"`, but the browser decides when to fetch them. The active video uses `preload="metadata"`, so it may start a media request before playback; that request can be partial, but a `Range` request is not guaranteed.

### Preview files

| File | Current | Budget | Status |
|---|---|---|---|
| 1.jpg | 15.4 kB | ≤ 25.0 kB | ✅ PASS |
| 2.jpg | 14.8 kB | ≤ 25.0 kB | ✅ PASS |
| 3.jpg | 18.6 kB | ≤ 25.0 kB | ✅ PASS |
| 4.jpg | 18.3 kB | ≤ 25.0 kB | ✅ PASS |
| 5.jpg | 16.5 kB | ≤ 25.0 kB | ✅ PASS |
| 6.jpg | 20.3 kB | ≤ 25.0 kB | ✅ PASS |

### Video files

| File | Current | Budget | Status |
|---|---|---|---|
| 1.mp4 | 16.9 MB | ≤ 70.0 MB | ✅ PASS |
| 2.mp4 | 54.7 MB | ≤ 70.0 MB | ✅ PASS |
| 3.mp4 | 46.5 MB | ≤ 70.0 MB | ✅ PASS |
| 4.mp4 | 62.4 MB | ≤ 70.0 MB | ✅ PASS |
| 5.mp4 | 35.8 MB | ≤ 70.0 MB | ✅ PASS |
| 6.mp4 | 18.4 MB | ≤ 70.0 MB | ✅ PASS |

Production budget passed.
