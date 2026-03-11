// Global Sanity Client Initialization
const sanityClient = window.SanityClient.createClient({
  projectId: '9973sk2c',
  dataset: 'production',
  useCdn: true, // Use the edge CDN for fast cached responses
  apiVersion: '2024-03-10', // Use today's date for stable API versioning
});
