import Sectionheading from '@/components/Helper/Sectionheading';
import React from 'react'
import DestinationSlider from './DestinationSlider';


const Destination = () => {
  return  <div className='pt-20 pb-20'>
    {/*Section Heading*/}
    <Sectionheading heading='Exploring Popular Destinations'/>
  {/*Section Content*/}
  <div className='mt-14 w-[80%] mx-auto'>
    {/*Slider*/}
   <DestinationSlider/>
  </div>
  </div>
  
};

export default Destination;