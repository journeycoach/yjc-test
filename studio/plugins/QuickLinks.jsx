import React, { useState } from 'react';

export const QuickLinks = () => {
  const [copiedText, setCopiedText] = useState('');

  // Your Coaching Links
  const links = [
    { title: 'Discovery Call (Calendly)', url: 'https://calendly.com/johnpaine/coaching-call-50' },
    { title: 'Standard Coaching Session (Zoom)', url: 'https://us06web.zoom.us/j/7697121589?pwd=OUpaVStadW1GblN3OHlNem9ZY1pwdz09' },
    { title: 'Integrative Enneagram Assessment', url: 'https://integrative9.com/your-portal' },
    { title: 'Post-Session Feedback Form', url: 'https://your-form-link.com' }
  ];

  const handleCopy = (url, title) => {
    navigator.clipboard.writeText(url);
    setCopiedText(title);
    setTimeout(() => setCopiedText(''), 2000); 
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Coach's Command Center</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>Click any link below to instantly copy it to your clipboard.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {links.map((link, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #eaeaea', borderRadius: '8px', backgroundColor: '#fff' }}>
            
            <div style={{ paddingRight: '16px' }}>
              <strong style={{ display: 'block', fontSize: '16px' }}>{link.title}</strong>
              <span style={{ color: '#888', fontSize: '14px', wordBreak: 'break-all' }}>{link.url}</span>
            </div>

            <button 
              onClick={() => handleCopy(link.url, link.title)}
              style={{ padding: '8px 16px', backgroundColor: copiedText === link.title ? '#4BB543' : '#1e1e1e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', minWidth: '110px' }}
            >
              {copiedText === link.title ? 'Copied!' : 'Copy Link'}
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}