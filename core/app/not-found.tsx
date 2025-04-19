'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="max-w-lg">
        <h1 className="text-6xl font-bold text-slate-800 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">
          Page Not Found
        </h2>
        <p className="text-slate-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="relative h-64 w-full mb-8">
          <Image
            src="/images/404-illustration.svg"
            alt="404 Illustration"
            fill
            style={{ objectFit: 'contain' }}
            priority
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
