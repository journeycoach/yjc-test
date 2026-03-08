// nav.js — Dynamically renders the navbar from data/nav.json
// This runs immediately (not waiting for DOMContentLoaded) so the nav
// is injected as early as possible to avoid a flash of empty content.

(function () {
    // Determine the root path so fetch works from sub-pages too
    // We always serve from the root on Netlify, so absolute path works everywhere.
    fetch('/data/nav.json')
        .then(res => res.json())
        .then(config => {
            const logoEl = document.getElementById('nav-logo');
            const navListEl = document.getElementById('nav-links-list');

            if (!logoEl || !navListEl) return;

            // Update brand name
            logoEl.textContent = config.brand_name || 'Your Journey Coach';

            // Determine current page for active state
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';

            // Build nav links
            let linksHTML = '';
            (config.nav_links || []).forEach(link => {
                if (!link.visible) return;

                // Check if this link points to the current page
                const isActive = (link.url === currentPage) ||
                    (link.url.startsWith('#') && currentPage === 'index.html');

                const activeStyle = isActive
                    ? ' style="color: var(--color-accent-gold);"'
                    : '';

                linksHTML += `<li><a href="${link.url}"${activeStyle}>${link.label}</a></li>`;
            });

            // Add CTA button if visible
            const cta = config.cta_button;
            if (cta && cta.visible) {
                linksHTML += `<li><a href="${cta.url}" class="btn-primary">${cta.label}</a></li>`;
            }

            navListEl.innerHTML = linksHTML;
        })
        .catch(err => {
            console.warn('nav.js: Could not load nav config, using fallback.', err);
            // Fallback: keep whatever static HTML is there (none in our case, so no-op)
        });
})();
