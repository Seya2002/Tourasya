"use client";
import { navlinks } from '@/constant/constant';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { HiBars3BottomRight } from 'react-icons/hi2';
import { TbAirBalloon } from 'react-icons/tb';
import { useRouter } from 'next/navigation'; // Updated import for Next.js 13+
import { useAuth } from '@/context/AuthContext';
import LogoutButton from '@/components/Helper/LogoutButton';

type Props = {
  openNav: () => void;
};

const Nav = ({ openNav }: Props) => {
  const [navBg, setNavBg] = useState(false);
  const router = useRouter();
  const { user } = useAuth(); // Get user authentication state

  useEffect(() => {
    const handler = () => {
      if (window.scrollY >= 90) setNavBg(true);
      else setNavBg(false);
    };

    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleCreatePackage = () => {
    router.push('/CreatePackage');
  };

  return (
    <div
      className={`transition-all duration-200 h-[12vh] z-[1000] fixed w-full ${
        navBg ? 'bg-blue-950 shadow-md' : ''
      }`}
    >
      <div className="flex items-center h-full justify-between w-[90%] xl:w-[80%] mx-auto">
        {/* Logo */}
        <div className="flex justify-start items-center space-x-2 ml-[-25px]">
          <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
            <TbAirBalloon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl text-white uppercase font-bold">Tourasya</h1>
        </div>

        {/* Nav Links */}
        <div className="hidden lg:flex items-center space-x-10">
          {navlinks.map((link) => (
            <Link href={link.url} key={link.id}>
              <p className="relative text-white text-base font-medium w-fit block 
                after:block after:content-[''] after:absolute after:h-[3px] after:bg-yellow-300 
                after:w-full after:scale-x-0 hover:after:scale-x-100 
                after:transition after:duration-300 after:origin-right">
                {link.label}
              </p>
            </Link>
          ))}
        </div>

        {/* Buttons and Burger Menu */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleCreatePackage}
            className="md:px-12 md:py-2.5 px-8 py-2 text-black text-base font-bold bg-white hover:bg-gray-200 transition-all duration-200 rounded-lg"
          >
            Create Package          
          </button>
          
          {/* Show Logout Button only when user is authenticated */}
          {user && (
            <LogoutButton 
              size="md" 
              className="md:px-12 md:py-2.5 px-8 py-2 text-black text-base font-bold bg-rose-500 hover:bg-gray-200 transition-all duration-200 rounded-lg border border-gray-300 shadow-sm"
              showIcon={false}
            >
              Logout
            </LogoutButton>
          )}
          
          <HiBars3BottomRight onClick={openNav} className="w-8 h-8 cursor-pointer text-white lg:hidden" />
        </div>
      </div>
    </div>
  );
};

export default Nav;