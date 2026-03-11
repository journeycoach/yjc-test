// nav.js — Dynamically renders the navbar from data/nav.json
// This runs immediately (not waiting for DOMContentLoaded) so the nav
// is injected as early as possible to avoid a flash of empty content.

(function () {
    // Use the global sanityClient initialized in js/sanity-client.js
    // We query for the single 'navigation' document
    sanityClient.fetch('*[_type == "navigation"][0]')
        .then(config => {
            if (!config) {
                console.warn('nav.js: No navigation document found in Sanity. Using fallback defaults.');
                config = {
                    brand_name: 'Your Journey Coach',
                    nav_links: [
                        { label: 'About', url: 'index.html#welcome', visible: true },
                        { label: 'Methodology', url: 'index.html#methodology', visible: true },
                        { label: 'Blog', url: 'blog.html', visible: true },
                        { label: 'Resources', url: 'tools.html', visible: true }
                    ],
                    cta_button: { label: "Let's Talk", url: "index.html#contact", visible: true }
                };
            }
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
                // We no longer blindly highlight all anchor links (#) on the homepage.
                const isActive = (link.url === currentPage) || (link.url === '/' && currentPage === 'index.html');

                let activeClass = isActive ? 'active' : '';

                // If it's the CTA button, we need to preserve its btn-primary class
                const isBtn = link.label && false; // Not needed, handled below for CTA

                linksHTML += `<li><a href="${link.url}" class="${activeClass}">${link.label}</a></li>`;
            });

            // Add CTA button if visible
            const cta = config.cta_button;
            if (cta && cta.visible) {
                linksHTML += `<li><a href="${cta.url}" class="btn-primary">${cta.label}</a></li>`;
            }

            // Add Admin link
            linksHTML += `<li><a href="/admin" class="btn-primary-outline" style="padding: 0.5rem 1rem; border: 1px solid var(--color-accent-gold); color: var(--color-accent-gold); border-radius: 4px; font-weight: 500; font-size: 0.85rem; margin-left: auto;">Admin</a></li>`;

            navListEl.innerHTML = linksHTML;
        })
        .catch(err => {
            console.warn('nav.js: Could not load nav config, using fallback.', err);
            // Fallback: keep whatever static HTML is there (none in our case, so no-op)
        });
})();
