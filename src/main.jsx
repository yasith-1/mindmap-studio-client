import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ShareView from './components/ShareView.jsx';
import './styles.css';

// Tiny path-based routing: /s/<token> opens the public share viewer; anything
// else is the full editor app. (Keeps the app router-free.)
function Root() {
  const match = window.location.pathname.match(/^\/s\/([^/]+)\/?$/);
  return match ? <ShareView token={decodeURIComponent(match[1])} /> : <App />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
