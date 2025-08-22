# Aukrug Borsfleth Restaurant Website

Aukrug Borsfleth is a static HTML website for a German restaurant built with the HTML5 UP "Phantom" template. The site features responsive design, SASS stylesheets, and is deployed via GitHub Pages.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

- Bootstrap and build the repository:
  - `sudo apt-get update && sudo apt-get install -y sass` -- installs SASS compiler. Takes 2-3 minutes. NEVER CANCEL.
  - `sass assets/sass/main.scss:assets/css/main.css` -- compiles main stylesheet. Takes 1 second.
  - `sass assets/sass/noscript.scss:assets/css/noscript.css` -- compiles noscript stylesheet. Takes 0.2 seconds.

- Run the website locally:
  - ALWAYS run the SASS compilation first to ensure stylesheets are up-to-date.
  - `python3 -m http.server 8000` -- starts local development server
  - Access website at `http://localhost:8000`
  - Server starts immediately and serves all static files correctly

- Test the website deployment:
  - GitHub Pages deployment is handled automatically via `.github/workflows/static.yml`
  - No build step required in CI - deploys entire repository as-is
  - CSS files must be pre-compiled before pushing to repository

## Validation

- ALWAYS manually validate any code changes by running the local server and testing in a browser.
- ALWAYS test these core scenarios after making changes:
  1. Homepage loads correctly at `http://localhost:8000`
  2. Navigation menu opens and links work
  3. Menu page displays restaurant menu properly (`http://localhost:8000/menu.html`)
  4. Contact page loads with map and contact information (`http://localhost:8000/kontakt.html`)
  5. PDF menu link is accessible (`http://localhost:8000/assets/menu.pdf`)
- ALWAYS recompile SASS after modifying any `.scss` files in `assets/sass/`
- You can view and test all website functionality including navigation, responsive design, and social media links.

## Common Tasks

The following are outputs from frequently run commands. Reference them instead of viewing, searching, or running bash commands to save time.

### Repository Structure
```
ls -la [repo-root]
.github/         # GitHub Actions workflows
LICENSE.txt      # Creative Commons license
README.md        # Brief project description  
README.txt       # Template credits and info
assets/          # CSS, JS, SASS, fonts, images
  css/           # Compiled stylesheets (main.css, noscript.css)
  js/            # JavaScript files (jQuery, main.js, util.js)
  sass/          # Source SASS files
  menu.pdf       # Restaurant menu PDF
datenschutz.html # Privacy policy page
elements.html    # Template demo elements
generic.html     # Generic template page
images/          # Website images and logos
impressum.html   # Legal imprint page  
index.html       # Homepage
kontakt.html     # Contact page
menu-blank.html  # Blank menu template
menu.html        # Restaurant menu page
raemlichkeiten.html # Facilities page
ueberuns.html    # About us page
```

### HTML Pages (12 total)
- **index.html** - Homepage with restaurant intro and opening hours
- **menu.html** - Restaurant menu with dishes and prices
- **kontakt.html** - Contact information with map and hours
- **raemlichkeiten.html** - Information about restaurant facilities
- **ueberuns.html** - About the restaurant team
- **impressum.html** - Legal imprint (German requirement)
- **datenschutz.html** - Privacy policy (German requirement)
- **generic.html, elements.html, menu-blank.html** - Template files

### SASS Structure
```
assets/sass/
├── main.scss           # Main stylesheet entry point
├── noscript.scss       # Styles for no-JS fallback
├── libs/               # Vendor mixins and utilities
├── base/               # Reset, typography, page basics
├── components/         # Reusable UI components  
└── layout/             # Header, footer, main layout
```

### Key Commands and Timing
- `sass assets/sass/main.scss:assets/css/main.css` -- 1 second
- `sass assets/sass/noscript.scss:assets/css/noscript.css` -- 0.2 seconds  
- `python3 -m http.server 8000` -- starts immediately
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000` -- returns "200" if server running

### Common File Locations
- **Main entry point**: `index.html`
- **Stylesheets source**: `assets/sass/main.scss`, `assets/sass/noscript.scss`
- **Compiled CSS**: `assets/css/main.css`, `assets/css/noscript.css`
- **JavaScript**: `assets/js/main.js`, `assets/js/util.js`
- **Restaurant menu**: `menu.html` and `assets/menu.pdf`
- **Contact info**: `kontakt.html`
- **Images**: `images/` directory
- **Deployment config**: `.github/workflows/static.yml`

### Template Information
Based on "Phantom" template by HTML5 UP (html5up.net) with Creative Commons Attribution 3.0 license. Uses jQuery, Font Awesome icons, and Google Fonts. Responsive design with mobile-friendly navigation menu.

## Development Workflow
1. Make changes to HTML files or SASS stylesheets
2. Run `sass assets/sass/main.scss:assets/css/main.css` if SASS was modified
3. Start local server: `python3 -m http.server 8000`
4. Test at `http://localhost:8000` - verify homepage, navigation, and changed pages
5. Test menu page specifically at `http://localhost:8000/menu.html`
6. Commit changes - CSS files are tracked in git and must be committed
7. Push to GitHub - automatic deployment via GitHub Pages

## Notes
- This is a German restaurant website with content in German
- External CDN resources (fonts, analytics) may be blocked in some environments
- Website includes social media links (Instagram, phone, maps)
- All pages share common header/footer structure
- Mobile-responsive design with collapsible navigation menu