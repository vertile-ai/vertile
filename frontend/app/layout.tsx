import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Sidebar from './components/sidebar';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

// Configure dayjs
dayjs.extend(relativeTime);

export const metadata: Metadata = {
  title: 'Vertile',
  description: 'AI Workflow Engine',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        <div className="flex h-screen">
          <Sidebar />

          <div className="flex flex-col h-full w-full overflow-y-hidden">
            <div className="flex-1 overflow-y-auto bg-slate-50">{children}</div>
          </div>

          <ToastContainer />
        </div>
      </body>
    </html>
  );
}
