document.addEventListener('DOMContentLoaded', () => {
    const toolsContainer = document.getElementById('tools-container');
    if (!toolsContainer) return;

    sanityClient.fetch('*[_type == "tool"]{..., "fileUrl": file.asset->url}')
        .then(resources => {
            if (!resources || resources.length === 0) {
                toolsContainer.innerHTML = '<p style="text-align: center; margin-top: 4rem;">No resources available yet. Check back soon!</p>';
                return;
            }

            // Filter out hidden resources
            const visibleResources = resources.filter(res => !res.is_hidden);

            if (visibleResources.length === 0) {
                toolsContainer.innerHTML = '<p style="text-align: center; margin-top: 4rem;">No resources available yet. Check back soon!</p>';
                return;
            }

            // Group resources by category
            const categories = {};
            visibleResources.forEach(res => {
                const cat = res.category || 'General';
                if (!categories[cat]) {
                    categories[cat] = [];
                }
                categories[cat].push(res);
            });

            toolsContainer.innerHTML = ''; // Clear loading text

            // Render each category section
            for (const [categoryName, tools] of Object.entries(categories)) {

                const section = document.createElement('div');
                section.className = 'category-section fade-in-up';
                if ((categoryName || '').toLowerCase() === 'books') {
                    section.classList.add('books-section');
                }

                section.innerHTML = `
                    <h2 class="category-title">${categoryName}</h2>
                    <div class="tools-grid"></div>
                `;

                const grid = section.querySelector('.tools-grid');

                tools.forEach(tool => {
                    const isFile = tool.type === 'file';
                    const linkUrl = isFile ? tool.file_url : tool.external_url;
                    const isBooksCategory = (categoryName || '').toLowerCase() === 'books';
                    const renderImageOnly = isBooksCategory && !!tool.image_url;
                    const renderTextAboveImage = !renderImageOnly && tool.type === 'link' && !!tool.image_url;

                    // Do not render empty cards if URL is broken
                    if (!linkUrl) return;

                    const card = document.createElement('a');
                    card.className = `tool-card${renderImageOnly ? ' image-only' : ''}${renderTextAboveImage ? ' link-with-image' : ''}`;
                    card.href = linkUrl;
                    card.target = "_blank";
                    card.rel = "noopener noreferrer";
                    card.setAttribute('aria-label', tool.title);
                    card.title = tool.title;

                    if (renderImageOnly) {
                        card.innerHTML = `
                            <img class="tool-card-image" src="${tool.image_url}" alt="${tool.title}" loading="lazy">
                        `;
                    } else {
                        const badgeClass = isFile ? 'pdf' : 'link';
                        const badgeText = isFile ? 'Download Resource' : 'External Link';
                        const imageMarkup = tool.image_url ? `<img class="tool-card-image" src="${tool.image_url}" alt="${tool.title}" loading="lazy">` : '';
                        const badgeMarkup = isFile
                            ? `<span class="tool-type-badge ${badgeClass}">${badgeText}</span>`
                            : '';
                        const bodyMarkup = `
                            <div class="tool-card-body">
                                ${badgeMarkup}
                                <h3>${tool.title}</h3>
                                ${tool.description ? `<p>${tool.description}</p>` : ''}
                            </div>
                        `;

                        card.innerHTML = renderTextAboveImage
                            ? `${bodyMarkup}${imageMarkup}`
                            : `${imageMarkup}${bodyMarkup}`;
                    }

                    grid.appendChild(card);
                });

                // Only append the section if it has valid cards
                if (grid.children.length > 0) {
                    toolsContainer.appendChild(section);
                }
            }

            // Trigger reveal animations
            setTimeout(() => {
                document.querySelectorAll('.category-section').forEach(el => el.classList.add('is-visible'));
            }, 100);

        })
        .catch(err => {
            console.error('Error fetching tools:', err);
            toolsContainer.innerHTML = '<p style="text-align: center; margin-top: 4rem;">Unable to load resources at this time.</p>';
        });
});
