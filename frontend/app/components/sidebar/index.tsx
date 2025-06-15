'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Circuitry, CaretLeft, CaretRight } from '@phosphor-icons/react';
import AppIcon from '@/app/components/AppIcon';
import SidebarNavItem from './nav-item';

// Breakpoint for tablet and below
const TABLET_BREAKPOINT = 768;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check current route using pathname
  const isComposing = pathname.startsWith('/workflows/');

  // Handle responsive behavior
  useEffect(() => {
    // Check if we're on a mobile/tablet device on initial load
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= TABLET_BREAKPOINT);
    };

    // Run on initial load
    checkScreenSize();

    // Collapse sidebar when on mobile
    if (window.innerWidth <= TABLET_BREAKPOINT) {
      setExpanded(false);
    }

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleNavigate = (path: string) => {
    switch (path) {
      case '/workflows':
        router.push('/workflows');
        break;
      default:
        router.push('/');
        break;
    }
  };

  const toggleSidebar = () => {
    if (!isMobile) {
      setExpanded(!expanded);
    }
  };

  return (
    <div
      className={`flex flex-col z-100 items-center relative
         h-full p-2 bg-white border-r border-gray-200 transition-all duration-300 
        ${expanded ? 'w-[200px]' : 'w-[56px]'}`}
    >
      <div className="flex items-center mb-4 w-full">
        <AppIcon />
        {expanded && (
          <span className="ml-2 font-semibold text-lg text-gray-800">
            Vertile
          </span>
        )}
      </div>

      <div className="overflow-hidden flex-grow flex justify-between items-center flex-col w-full">
        <div className="flex flex-col gap-y-3 w-full">
          <SidebarNavItem
            icon={
              <Circuitry
                color={isComposing ? '#764cd4' : '#737b85'}
                size={28}
                weight={isComposing ? 'fill' : 'regular'}
              />
            }
            label="Workflows"
            isActive={isComposing}
            expanded={expanded}
            onClick={() => handleNavigate('/workflows')}
          />
        </div>

        {/* Middle expand/collapse button */}
        {!isMobile && (
          <div className="absolute -right-[15px] top-1/2 transform -translate-y-1/2 z-[10000]">
            <button
              onClick={toggleSidebar}
              className="flex justify-center items-center w-[30px] h-[30px] bg-white border border-gray-200 rounded-full
               hover:bg-gray-100 transition-all duration-300"
              aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {expanded ? (
                <CaretLeft size={14} color="#737b85" weight="bold" />
              ) : (
                <CaretRight size={14} color="#737b85" weight="bold" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
