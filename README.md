# Build M Sat Celt Certificate Portal

A frontend-only certificate lookup and PDF download page for the Microsoft Student Ambassadors workshop, **Build and Deploy with GitHub Copilot**, facilitated by Alhemdrew on October 17, 2026.

## Run locally

Open `index.html` in a modern browser. All application assets and the pinned PDF library are local; the two display fonts are loaded from Google Fonts, with a sans-serif fallback if offline.

## GitHub Pages

This project uses relative paths for the stylesheet, scripts, and certificate image, so it supports both local file viewing and a repository subpath. The workflow in `.github/workflows/pages.yml` deploys the site when changes are pushed to `main`. In the repository settings, set **Pages > Build and deployment > Source** to **GitHub Actions**.

## Browser-only limitations

The participant allowlist is in `app.js`. Name matching is case-insensitive and ignores leading, trailing, and repeated spaces. The correction and download flags are stored in `localStorage`, keyed by the normalized attendance name. This is a convenience restriction for a browser, not a secure identity check or globally enforced one-time allowance. Clearing browser storage, switching browsers or devices, or modifying the client-side code can bypass it. A name-only registry cannot distinguish two participants with the same name.

## Certificate asset and PDF

`assets/certificate-template.png` is the supplied design and is embedded unchanged as the PDF background. The participant name is added in the blank recipient area. jsPDF 2.5.2 is vendored at `assets/vendor/jspdf.umd.min.js` so PDF generation does not depend on a runtime CDN; its MIT license is included alongside it. The PDF is landscape and uses the supplied image's aspect ratio to avoid stretching or cropping the certificate.