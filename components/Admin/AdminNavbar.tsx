'use client';
import { useState } from 'react';
import { FiUsers, FiPieChart, FiDatabase, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface AdminNavbarProps {
  title?: string;
}

const AdminNavbar = ({ title }: AdminNavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, user, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      // The AuthContext will handle the redirect to /login
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: FiPieChart },
    { name: 'User Management', href: '/admin/users', icon: FiUsers },
    { name: 'ML Data Operations', href: '/admin/ml-data', icon: FiDatabase },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-950 text-white transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:translate-x-0`}>
        <div className="p-4 border-b border-blue-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">TourAsya Admin</h1>
              <p className="text-sm text-blue-200">Administration Panel</p>
              {user && (
                <p className="text-xs text-blue-300 mt-1">
                  Logged in as: {userData?.username || user.email}
                </p>
              )}
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-blue-200 hover:text-white"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        <nav className="mt-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center w-full p-3 text-left transition-colors ${
                  isActiveRoute(item.href) 
                    ? 'bg-blue-800 text-white' 
                    : 'hover:bg-blue-800 text-blue-200 hover:text-white'
                }`}
              >
                <Icon className="mr-2" /> {item.name}
              </button>
            );
          })}
          
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-3 hover:bg-blue-800 mt-4 text-blue-200 hover:text-white transition-colors"
          >
            <FiLogOut className="mr-2" /> Logout
          </button>
        </nav>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="bg-blue-950 text-white p-2 rounded-md"
        >
          <FiMenu size={20} />
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {title || navigationItems.find(item => isActiveRoute(item.href))?.name || 'Admin Panel'}
          </h2>
        </header>
        
        <main className="p-6">
          {/* Content will be rendered by the parent component */}
        </main>
      </div>
    </div>
  );
};

export default AdminNavbar; 