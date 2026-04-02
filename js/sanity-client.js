// Maps old Sanity queries to new API endpoints — drop-in replacement for sanity-client.js
const sanityClient = {
  fetch: function(query) {
    if (query.includes('"testimonial"')) {
      return fetch('/api/content/testimonials').then(r => r.json()).then(d => d.data || []);
    }
    if (query.includes('"navigation"')) {
      return fetch('/api/content/navigation').then(r => r.json()).then(d => d.data || null);
    }
    if (query.includes('"tool"')) {
      return fetch('/api/content/tools').then(r => r.json()).then(d => d.data || []);
    }
    if (query.includes('"post"')) {
      return fetch('/api/content/posts').then(r => r.json()).then(d => d.data || []);
    }
    if (query.includes('"bookmark"')) {
      return fetch('/api/content/bookmarks').then(r => r.json()).then(d => d.data || []);
    }
    console.warn('sanityClient: unrecognized query', query);
    return Promise.resolve([]);
  }
};
