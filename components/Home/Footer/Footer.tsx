import React from 'react'
import Link from 'next/link'
import { TbAirBalloon } from 'react-icons/tb'
import { navlinks } from '@/constant/constant'

const Footer = () => {
  return <div className='pt-16 pb-10 bg-black text-white'>
    <div className='w-[80%] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10 items-start'>
      {/* Brand (mirror navbar) */}
      <div className='space-y-4'>
        <div className="flex justify-start items-center space-x-2 ml-[-25px]">
          <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
            <TbAirBalloon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl text-white uppercase font-bold">Tourasya</h1>
        </div>
      </div>

      {/* Nav links arranged in two rows (3 columns) */}
      <div className='w-full'>
        <div className='grid grid-cols-3 gap-x-6 gap-y-3 justify-items-start'>
          <Link href={'/home'} className="text-white text-base font-medium hover:text-yellow-300">Home</Link>
          <Link href={'/Blog'} className="text-white text-base font-medium hover:text-yellow-300">Blog</Link>
          <Link href={'/CreatePackage'} className="text-white text-base font-medium hover:text-yellow-300">Create Package</Link>
          <Link href={'/About'} className="text-white text-base font-medium hover:text-yellow-300">About</Link>
          <Link href={'/pages'} className="text-white text-base font-medium hover:text-yellow-300">Dashboard</Link>
          <Link href={'/login'} className="text-white text-base font-medium hover:text-yellow-300">Logout</Link>
        </div>
      </div>
    </div>

    {/* Bottom minimal bar */}
    <div className='w-[80%] mx-auto mt-8 border-t border-white/10 pt-4 text-xs text-gray-400 text-center'>
      @ 2025 Tourasya
    </div>
  </div>
  
};

export default Footer;