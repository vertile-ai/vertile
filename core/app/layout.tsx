import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

// Configure dayjs
dayjs.extend(relativeTime);

export const metadata: Metadata = {
  title: 'Vertile',
  description: 'RAG Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
      </head>
      <body className={inter.className}>
        <div className="flex h-screen">
          <div className="w-12 flex-shrink-0 flex flex-col items-center justify-between">
            <Sidebar />
          </div>
          <div className="flex flex-col h-full w-full overflow-y-hidden">
            <div className="h-12 flex-shrink-0">
              <Header />
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto bg-slate-50">{children}</div>
          </div>

          <ToastContainer />
        </div>
      </body>
    </html>
  );
}
