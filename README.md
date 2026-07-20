# MAX REMY DEV - MINIMAL PORTFOLIO

How [maxremy.dev](https://maxremy.dev/) is built :

## Stack

- TypeScript
- Vite.js
- React 19 (static pre-rendering only)
- Tailwind CSS 4
- Biome
- Node.js (static prerendering)

## Performance budget

- React shipped to the browser: 0 kB (0 B gzip)
- Client-side hydration: none
- Theme bootstrap inline gzip: less than 1 kB (429 B gzip)
- Locale redirect inline gzip: less than 0.5 kB (292 B gzip)
- Theme controller gzip: less than 2 kB (479 B gzip)
- Total executable JavaScript gzip: less than 3.5 kB (1,200 B gzip)
- CSS gzip: less than 5 kB (3,522 B gzip)
- HTML gzip per localized page: less than 6 kB
    - (EN: 3,518 B gzip)
    - (FR: 3,661 B gzip)
    - (DE: 3,614 B gzip)
- External fonts: 0
- Third-party runtime requests: 0
- Client-side i18n runtime: none
