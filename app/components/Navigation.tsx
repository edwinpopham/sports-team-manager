// Navigation component with Next.js routing
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', label: 'Dashboard', exact: true },
    { href: '/teams', label: 'Teams', exact: false },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 hover:text-blue-600"
            >
              Sports Team Manager
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            {navItems.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                className={`
                  px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive(href, exact)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}