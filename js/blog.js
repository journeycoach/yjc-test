document.addEventListener('DOMContentLoaded', () => {
    const blogListView = document.getElementById('blog-list-view');
    const singlePostView = document.getElementById('single-post-view');
    const blogGrid = document.getElementById('blog-grid');
    const backBtn = document.getElementById('back-to-blog');

    // DOM Elements for Single Post
    const postTitle = document.getElementById('post-title');
    const postDate = document.getElementById('post-date');
    const postAuthor = document.getElementById('post-author');
    const postContent = document.getElementById('post-content');

    let allPosts = [];

    // --- Utility: Convert a post title into a stable URL slug ---
    function toSlug(title) {
        return (title || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumerics with hyphens
            .replace(/^-+|-+$/g, '');     // strip leading/trailing hyphens
    }

    // --- Utility: Find a post by slug ---
    function findPostBySlug(slug) {
        return allPosts.findIndex(p => toSlug(p.title) === slug);
    }

    // Check if we are loading a specific post from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const slugFromUrl = urlParams.get('post');

    // Fetch posts
    fetch('/data/posts.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not load posts.');
            }
            return response.json();
        })
        .then(data => {
            allPosts = data.posts || [];

            // Sort newest first
            allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (slugFromUrl) {
                const index = findPostBySlug(slugFromUrl);
                if (index !== -1) {
                    renderSinglePost(index);
                } else {
                    renderList(); // Slug not found, fall back to list
                }
            } else {
                renderList();
            }
        })
        .catch(error => {
            console.error('Error fetching blog posts:', error);
            if (blogGrid) {
                blogGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No posts available yet. Check back soon!</p>';
            }
        });

    function renderList() {
        if (!blogListView || !singlePostView || !blogGrid) return;

        blogListView.style.display = 'block';
        singlePostView.style.display = 'none';

        // Remove URL parameter for a clean URL
        window.history.replaceState({}, document.title, window.location.pathname);

        blogGrid.innerHTML = '';

        if (allPosts.length === 0) {
            blogGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No posts available yet. Check back soon!</p>';
            return;
        }

        allPosts.forEach((post, index) => {
            const card = document.createElement('div');
            card.className = 'blog-card fade-in-up';
            card.style.animationDelay = `${index * 0.1}s`;

            const dateObj = new Date(post.date);
            const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

            // Use textContent for user-provided text to prevent XSS
            const dateSpan = document.createElement('span');
            dateSpan.className = 'blog-date';
            dateSpan.textContent = formattedDate;

            const titleEl = document.createElement('h3');
            titleEl.textContent = post.title;

            const summaryEl = document.createElement('p');
            // Use summary if available, otherwise generate a plain-text excerpt from body
            const summaryText = post.summary || (post.body ? post.body.replace(/[#*`_\[\]]/g, '').substring(0, 120) + '...' : '');
            summaryEl.textContent = summaryText;

            const readMore = document.createElement('span');
            readMore.className = 'read-more';
            readMore.textContent = 'Read Article →';

            card.appendChild(dateSpan);
            card.appendChild(titleEl);
            card.appendChild(summaryEl);
            card.appendChild(readMore);

            card.addEventListener('click', () => navigateToPost(index));
            blogGrid.appendChild(card);
        });

        // Trigger reveal animations
        setTimeout(() => {
            document.querySelectorAll('.blog-card').forEach(el => el.classList.add('is-visible'));
        }, 100);
    }

    function renderSinglePost(index) {
        if (!blogListView || !singlePostView) return;

        const post = allPosts[index];
        blogListView.style.display = 'none';
        singlePostView.style.display = 'block';

        const dateObj = new Date(post.date);
        postDate.textContent = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        postTitle.textContent = post.title;
        postAuthor.textContent = post.author || 'Your Journey Coach';

        // Use marked.js to parse the Markdown body into HTML (safer than innerHTML with raw input)
        if (typeof marked !== 'undefined') {
            postContent.innerHTML = marked.parse(post.body || '');
        } else {
            postContent.textContent = post.body || '';
            console.warn('Marked.js not loaded. Displaying raw text.');
        }

        // Update the URL to a human-readable slug
        const slug = toSlug(post.title);
        const newUrl = window.location.pathname + '?post=' + slug;
        window.history.pushState({ slug }, '', newUrl);

        backBtn.onclick = (e) => {
            e.preventDefault();
            renderList();
        };

        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function navigateToPost(index) {
        renderSinglePost(index);
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('post');

        if (slug) {
            const index = findPostBySlug(slug);
            if (index !== -1) {
                renderSinglePost(index);
                return;
            }
        }
        renderList();
    });

});
