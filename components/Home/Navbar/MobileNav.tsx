import { navlinks } from '@/constant/constant';
import Link from 'next/link';
import React from 'react';
import { CgClose } from 'react-icons/cg';

type Props = {
  showNav: boolean;
  closeNav: () => void;
};

const MobileNav = ({ closeNav, showNav }: Props) => {
  const navOpen = showNav ? 'translate-x-0' : 'translate-x-[-100%]';

  return (
    <div>
      {/* Overlay - Only shown when nav is open */}
      <div
        className={`fixed ${navOpen} inset-0 transform transition-all duration-500 z-[1000] bg-black opacity-70 w-full h-screen`}
      ></div>

      {/* Nav Links - Only shown when nav is open */}
      <div
        className={`fixed ${navOpen} justify-center flex flex-col h-full transform transition-all duration-500 delay-300 w-[80%] sm:w-[60%] bg-rose-900 space-y-6 z-[1050] text-white`}
      >
        {navlinks.map((link) => (
          <Link key={link.id} href={link.url}>
            <p className="text-white w-fit text-[20px] ml-12 border-b-[1.5px] pb-1 border-white sm:text-[30px]">
              {link.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Close Button - Only shown when nav is open */}
      {showNav && (
        <CgClose
          onClick={closeNav}
          className="fixed top-[0.7rem] right-[1.4rem] sm:w-8 sm:h-8 w-6 h-6 text-white z-[1100] cursor-pointer hover:text-rose-200 transition-colors"
        />
      )}
    </div>
  );
};

export default MobileNav;