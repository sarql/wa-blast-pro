import React from 'react';

const Layout = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      minHeight: '100vh',
      paddingLeft: '280px' // Space for fixed sidebar
    }}>
      <main style={{
        flex: 1,
        padding: '40px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
