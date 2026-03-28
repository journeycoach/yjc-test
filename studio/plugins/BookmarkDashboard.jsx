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
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#1a1a1a' }}>Quick Links</h1>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Click on any of your saved bookmarks to quickly open them.</p>
      </header>

      {bookmarks.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>No dynamic bookmarks found. Add some in the Desk and assign them to a Category!</p>
        </div>
      ) : (
        categoryTitles.map(title => (
          <section key={title} style={{ marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              letterSpacing: '0.08em', 
              textTransform: 'uppercase', 
              color: '#94a3b8', 
              marginBottom: '16px',
              paddingBottom: '6px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              {title}
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '12px' 
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
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)'; 
                    e.currentTarget.style.transform = 'translateY(-2px)'; 
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; 
                    e.currentTarget.style.transform = 'translateY(0)'; 
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <h3 style={{ fontSize: '15.5px', fontWeight: '600', margin: '0 0 6px 0', color: '#1a1d1e', lineHeight: '1.4' }}>
                    {b.title}
                  </h3>
                  {b.description && (
                    <p style={{ 
                      fontSize: '12.5px', 
                      color: '#64748b', 
                      margin: 0, 
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {b.description}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
