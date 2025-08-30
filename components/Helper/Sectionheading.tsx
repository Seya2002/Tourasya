import React from 'react'

type Props ={
    heading: string;
};
const Sectionheading = ({heading}: Props) => {
  return  <div className='w-[80%] mx-auto'>
   <h1 className='text-xl sm:text-5xl text-blue-950 font-bold'>{heading} </h1>
   <p className='mt-2 text-gray-700 sm:text-base text-s font-medium'>Find Best Destinations For Your Trip</p>
    </div>
  
};

export default Sectionheading;