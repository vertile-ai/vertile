'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Circuitry,
  ListBullets,
} from '@phosphor-icons/react';
import AppIcon from '@/src/components/reusable/AppIcon.component';
import Tooltip from '@/src/components/reusable/Tooltip.component';

// Define paths object similar to the one in src/utils/paths
const paths = {
  home: '/',
  workflows: '/workflows',
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname() || '/';

  // Check current route using pathname
  const isWorkflow = pathname === '/';
  const isWorkflowsList = pathname === '/workflows';

  const [uploadHover, setUploadHover] = useState<boolean>(false);

  const handleNavigate = (path: string) => {
    switch (path) {
      case '/':
        router.push('/');
        break;
      case '/workflows':
        router.push('/workflows');
        break;
      default:
        router.push('/');
        break;
    }
  };

  return (
    <div className="flex flex-col items-center h-full pt-2 pb-4 px-3 bg-white border-r border-gray-200">
      <Link
        href={paths.home}
        className="flex shrink-0 w-[40px] items-center justify-center"
        aria-label="Home"
      >
        <AppIcon />
      </Link>

      <div className="overflow-hidden mt-5 flex-grow flex justify-between items-center flex-col">
        <div className="flex flex-col gap-y-3">
          <Tooltip
            selector="workflow"
            content="Workflow Editor"
            position="right"
            className="z-[99]"
          >
            <button
              onClick={() => {
                handleNavigate('/');
              }}
              className="flex flex-grow h-[44px] gap-x-2 py-[5px] px-2.5 mb-2 rounded-[8px] text-gray-700 justify-center items-center hover:bg-gray-100 transition-all duration-300"
            >
              <Circuitry
                color={isWorkflow ? '#587DCA' : '#737b85'}
                size={30}
                weight="fill"
              />
            </button>
          </Tooltip>
          
          <Tooltip
            selector="workflows-list"
            content="My Workflows"
            position="right"
            className="z-[99]"
          >
            <button
              onClick={() => {
                handleNavigate('/workflows');
              }}
              className="flex flex-grow h-[44px] gap-x-2 py-[5px] px-2.5 mb-2 rounded-[8px] text-gray-700 justify-center items-center hover:bg-gray-100 transition-all duration-300"
            >
              <ListBullets
                color={isWorkflowsList ? '#587DCA' : '#737b85'}
                size={30}
                weight="fill"
              />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
