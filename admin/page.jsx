import React, { useState } from 'react';

export default function CommandCenter() {
  const [copiedText, setCopiedText] = useState('');

  // Your Coaching Links
  const links = [
    { title: 'Discovery Call (Calendly)', url: 'https://calendly.com/your-link/discovery' },
    { title: 'Standard Coaching Session (Zoom)', url: 'https://zoom.us/j/your-room-id' },
    { title: 'Integrative Enneagram Assessment', url: 'https://integrative9.com/your-portal' },
    { title: 'Post-Session Feedback Form', url: 'https://your-form-link.com' }
  ];

  const handleCopy = (url, title) => {
    navigator.clipboard.writeText(url);
    setCopiedText(title);
    setTimeout(() => setCopiedText(''), 2000); 
  };

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        
        {/* Visual indicator for the Test Site */}
        <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: '12px', fontWeight: 'bold', marginBottom: '16px' }}>
          TEST ENVIRONMENT
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#111' }}>
          Coach's Command Center (Test)
        </h1>
        <p style={{ color: '#4b5563', marginBottom: '32px' }}>
          Your private hub. Click to copy links to your clipboard.
        </p>

        <div style={{ display: 'grid', gap: '16px' }}>
          {links.map((link, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px', 
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              
              <div>
                <strong style={{ display: 'block', fontSize: '16px', color: '#111' }}>{link.title}</strong>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>{link.url}</span>
              </div>

              <button 
                onClick={() => handleCopy(link.url, link.title)}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: copiedText === link.title ? '#10b981' : '#000', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                {copiedText === link.title ? 'Copied!' : 'Copy Link'}
              </button>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
