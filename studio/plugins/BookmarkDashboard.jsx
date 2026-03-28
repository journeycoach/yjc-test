import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'

export function BookmarkDashboard() {
  const client = useClient({apiVersion: '2023-05-01'})
  const [bookmarks, setBookmarks] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    // Fetch both bookmarks and categories
    Promise.all([
      client.fetch('*[_type == "bookmark"]{..., "categoryTitle": category->title} | order(_createdAt desc)'),
      client.fetch('*[_type == "bookmarkCategory"] | order(title asc)')
    ]).then(([fetchedBookmarks, fetchedCategories]) => {
      setBookmarks(fetchedBookmarks)
      setCategories(fetchedCategories)
    })
  }, [client])

  // Grouping logic based on categories defined in the database
  const groupedBookmarks = bookmarks.reduce((acc, curr) => {
    const catTitle = curr.categoryTitle || 'Uncategorized'
    if (!acc[catTitle]) acc[catTitle] = []
    acc[catTitle].push(curr)
    return acc
  }, {})

  // Get only categories that have links, or use the full category list for consistent order
  const categoryTitles = categories.length > 0 
    ? categories.map(c => c.title).filter(title => groupedBookmarks[title])
    : Object.keys(groupedBookmarks)

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1a1a1a' }}>Quick Links</h1>
        <p style={{ color: '#666', margin: 0 }}>Click on any of your saved bookmarks to quickly open them.</p>
      </header>

      {bookmarks.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', margin: 0 }}>No dynamic bookmarks found. Add some in the Desk and assign them to a Category!</p>
        </div>
      ) : (
        categoryTitles.map(title => (
          <section key={title} style={{ marginBottom: '48px' }}>
            <h2 style={{ 
              fontSize: '14px', 
              fontWeight: '700', 
              letterSpacing: '0.05em', 
              textTransform: 'uppercase', 
              color: '#94a3b8', 
              marginBottom: '20px',
              paddingBottom: '8px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {title}
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '20px' 
            }}>
              {groupedBookmarks[title].map(b => (
                <a 
                  key={b._id} 
                  href={b.url} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'; 
                    e.currentTarget.style.transform = 'translateY(-2px)'; 
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; 
                    e.currentTarget.style.transform = 'translateY(0)'; 
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0', color: '#1a1d1e' }}>
                    {b.title}
                  </h3>
                  {b.description && (
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                      {b.description}
                    </p>
                  )}
                  <div style={{ marginTop: '16px', fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>
                    Open URL &rarr;
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
