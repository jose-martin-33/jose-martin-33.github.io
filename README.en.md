# José Martín's portfolio

[Español](README.md) · **English**

Static site, no build step, for GitHub Pages: [jose-martin-33.github.io](https://jose-martin-33.github.io).

Conversational AI and content operations specialist: Spanish Alexa (es-ES, es-MX, es-US), data, automation and digital content operations.

```
index.html     structure and SEO (meta tags, Open Graph, Twitter Card, JSON-LD)
styles.css     palette, light/dark mode, responsive layout
script.js      language switch, filters, modals, map, counters, contact form
locales.js     all copy in Spanish and English
assets/        favicon.svg, og-image.png, foto.webp
.nojekyll      stops GitHub from processing the site with Jekyll
```

## Features

- Bilingual ES/EN with a language switch that remembers the choice
- Dark mode by default, optional light mode
- Filterable project cards that open a case-study modal
- Interactive SVG map linking tools, projects and results (list view on mobile)
- Contact form via Formspree, with client-side validation and a privacy policy
- Accessible: keyboard navigation, ARIA, reduced-motion support

## Editing

All text lives in `locales.js`, in two blocks: `es` and `en`. Change the text between
quotes and save; no HTML changes needed.
