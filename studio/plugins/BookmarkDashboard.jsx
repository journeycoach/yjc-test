import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'

export function BookmarkDashboard() {
  const client = useClient({apiVersion: '2023-05-01'})
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    client.fetch('*[_type == "bookmark"] | order(_createdAt desc)').then(setBookmarks)
  }, [client])

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1a1a1a' }}>Quick Links</h1>
        <p style={{ color: '#666', margin: 0 }}>Click on any of your saved bookmarks to quickly open them.</p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {bookmarks.length === 0 ? (
          <p style={{ color: '#888' }}>No bookmarks have been saved yet. You can add them under the &quot;Bookmarks&quot; folder in the main Desk!</p>
        ) : (
          bookmarks.map(b => (
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
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              onMouseOver={(e) => { 
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; 
                e.currentTarget.style.transform = 'translateY(-2px)'; 
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; 
                e.currentTarget.style.transform = 'translateY(0)'; 
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#2563eb' }}>
                {b.title}
              </h3>
              {b.description && (
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                  {b.description}
                </p>
              )}
            </a>
          ))
        )}
      </div>
    </div>
  )
}
