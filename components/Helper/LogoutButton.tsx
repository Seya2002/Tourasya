'use client';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

const LogoutButton = ({ 
  variant = 'danger', 
  size = 'md', 
  className = '', 
  showIcon = true,
  children 
}: LogoutButtonProps) => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      console.log('Logout button clicked, starting logout process...');
      
      await logout();
      console.log('Logout successful, AuthContext will handle redirect...');
      
      // AuthContext automatically handles redirect to /login
      
    } catch (error) {
      console.error('Logout failed:', error);
      // AuthContext will handle redirect even on error
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // If custom className is provided, use it instead of variant classes
  const buttonClasses = className 
    ? `${baseClasses} ${sizeClasses[size]} ${className}`
    : `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={buttonClasses}
      type="button"
      title="Logout from your account"
    >
      {isLoggingOut ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Logging out...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {showIcon && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}
          <span>{children || 'Logout'}</span>
        </div>
      )}
    </button>
  );
};

export default LogoutButton;
