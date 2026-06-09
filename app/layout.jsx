import './globals.css';
import { AuthProvider } from '../src/context/AuthContext.jsx';

export const metadata = {
  title: 'Syncronz | Collaborative Task Management',
  description: 'Real-time collaborative task management with Firebase',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Syncro" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.deferredPrompt = e;
                  window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
                });

                window.addEventListener('appinstalled', function() {
                  localStorage.setItem('pwa-installed', 'true');
                  window.dispatchEvent(new CustomEvent('pwa-installed-success'));
                });

                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(reg) {
                        console.log('Service worker registered successfully');
                      })
                      .catch(function(err) {
                        console.error('Service worker registration failed:', err);
                      });
                  });
                }
              }
            `
          }}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
