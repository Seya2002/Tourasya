
import React from 'react'

const Hero = () => {
  return (
    <div className='relative w-full h-[120vh] sm:h-[100vh]'>
      {/* Overlay */}
      <div className='absolute top-0 left-0 w-full h-full bg-blue-950 opacity-70'></div>
      <video 
        src="/images/hero1.mp4" 
        autoPlay 
        muted 
        loop 
        preload='metadata' 
        className='w-full h-full object-cover' 
      />
      
      {/* Text content */}
      <div className='absolute z-[100] w-full h-full top-10 left-0 flex flex-col items-center justify-center px-4'>
        <div className='text-center max-w-4xl w-full'>
          <div data-aos="fade-up" className='mb-8'>
            <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-wider text-white font-bold uppercase mb-4'>
              Lets Enjoy The Nature
            </h1>
            
            <p className='text-lg sm:text-xl text-white font-normal mb-8'>
              Get the best destinations in Sri Lanka
            </p> 
            <p className='text-lg sm:text-xl text-white font-normal mb-8'>Stop searching, start exploring. Tell us your travel style, and we will craft the perfect itinerary, find hidden gems, and unlock the best deals.</p>
          </div> 
        </div>
      </div>
    </div>
  );
};

export default Hero;