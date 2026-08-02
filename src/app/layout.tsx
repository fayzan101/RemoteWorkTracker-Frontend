
import '../styles/globals.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ReactQueryProvider } from './react-query-provider';
import { ThemeProvider } from '@/context/ThemeContext';

const metadata = {
  title: 'Work Pulse AI',
  description: 'Remote work tracking, analytics, and workforce operations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/images/BrandLogo.svg" />
        <script src="/theme-init.js" />
      </head>
      <body>
        <ThemeProvider>
          <ReactQueryProvider>
            <main>{children}</main>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
