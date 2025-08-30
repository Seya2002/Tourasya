'use client';
import React, { useEffect } from 'react'
import Hero from './Hero/Hero';
import Destination from './Destination/Destination';
// Removed sections per request
import AOS from 'aos';
import 'aos/dist/aos.css';
import ResponsiveNav from './Navbar/ResponsiveNav';
import Footer from './Footer/Footer';




const Home = () => {
  useEffect(() => {
    const initAOS = async() => {
      await import('aos');
      AOS.init ({
        duration: 1000,
        easing: 'ease',
        once: true,
        anchorPlacement: 'top-bottom',
      });
    };
    initAOS();
  },[]);

  return(
   <div className="overflow-hidden">
    <ResponsiveNav/>
    <Hero />
    <Destination/>
    <Footer/>
    
    </div>
  ); 
};

export default Home;