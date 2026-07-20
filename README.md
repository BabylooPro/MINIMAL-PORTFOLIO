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
- Site controller gzip : less than 2 kB (1,399 B gzip)
- Total executable JavaScript gzip: less than 2.5 kB
    - Root page: 2,120 B gzip
    - Localized pages: 1,828 B gzip
- CSS gzip: less than 5 kB (4,204 B gzip)
- HTML gzip per page: less than 5 kB
    - Root: 4,440 B gzip
    - EN: 4,217 B gzip
    - FR: 4,370 B gzip
    - DE: 4,336 B gzip
- Videos timelapse: 235 MB total (H.264 MP4)
    - images previews: 349 kB total, lazy-loaded
- External fonts: 0
- Third-party runtime requests: 0
- Client-side i18n runtime: none
