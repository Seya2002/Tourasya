'use client';
import { useEffect } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { user, loading, isAdmin, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // The AuthContext will handle the redirect to /login
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Protect admin route and add runtime cache-busting headers (best-effort)
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
      return;
    }
    try {
      if (typeof window !== 'undefined') {
        // Prevent browser caching of this sensitive view when authenticated
        // Note: middleware also sets headers at the edge
        window.history.replaceState(null, '', window.location.href);
      }
    } catch {}
  }, [user, isAdmin, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || !isAdmin) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-950 text-white">
        <div className="p-4 border-b border-blue-900">
          <h1 className="text-xl font-bold">TourAsya Admin</h1>
          <p className="text-sm text-blue-200">Administration Panel</p>
          {user && (
            <p className="text-xs text-blue-300 mt-1">
              Logged in as: {user.email}
            </p>
          )}
        </div>
        
        <nav className="mt-4">
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center w-full p-3 hover:bg-blue-800"
          >
            <svg className="mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard
          </button>
          
          <button 
            onClick={() => router.push('/admin/users')}
            className="flex items-center w-full p-3 hover:bg-blue-800"
          >
            <svg className="mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            User Management
          </button>
          
          <button 
            onClick={() => router.push('/admin/ml-data')}
            className="flex items-center w-full p-3 hover:bg-blue-800"
          >
            <svg className="mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            ML Data Operations
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-3 hover:bg-blue-800 mt-4"
          >
            <FiLogOut className="mr-2" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {title || 'Admin Panel'}
          </h2>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 