'use client';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import { destinationData } from '@/data/data';
import React from 'react';
import Image from 'next/image';



const responsive = {
  desktop: {
    breakpoint: { max: 3000, min: 1324 },
    items: 5,
    slidesToSlide: 1 // optional, default to 1.
  },
  tablet: {
    breakpoint: { max: 1324, min: 764 },
    items: 2,
    slidesToSlide: 1 // optional, default to 1.
  },
  mobile: {
    breakpoint: { max: 764, min: 0 },
    items: 1,
    slidesToSlide: 1 // optional, default to 1.
  }
};

const DestinationSlider = () => {
  return <Carousel 
  responsive={responsive} 
  infinite={true} 
  autoPlay={true} 
  autoPlaySpeed={5000} 
  keyBoardControl={true}
  >
   {destinationData.map((data)=>{ 
    return (<div key={data.Id} className='m-3'>
        {/*image div*/}
        <div className='relative h-[400px]'>
          {/*overlay*/}
            <div className='absolute inset-0 bg-black opacity-15 rounded-lg '></div>
            {/*image*/}
             <Image 
             src={data.Image} 
             alt={data.Country} 
             width={500}
             height={500} 
             className='h-full w-full object-cover rounded-lg' 
              />
              {/*Text content*/}
        </div>
            <h1 className='text-lg font-semibold mt-4'>{data.Country}</h1>
    </div>
    );
   })}
  </Carousel>
  
};

export default DestinationSlider;