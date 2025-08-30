'use client';
import React from 'react';
import Image from 'next/image';
import {Swiper,SwiperSlide} from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-cards';
import {EffectCards} from 'swiper/modules';
import { reviewsData } from '@/data/data';
import { FaStar } from 'react-icons/fa';

const ReviewSlider = () => {
  return  <div>
    <Swiper effect={'cards'} grabCursor={true} modules={[EffectCards]} className='md:w-[450px] md:h-[300px]' >
{reviewsData.map((data)=>{
    return(
        <SwiperSlide
         key={data.Id} 
         className='bg-white rounded-3xl block'
         >
            <div className='w-[80%] mx-auto mt-16'>
                <p className='text-xs sm:text-sm md:text-base font-semibold'>
                    {data.Review}
                    </p>
                    {/*icons*/}
                    <div className='flex items-center mt-4'>
                     <FaStar className='md:w-6 md:h-6 w-3 h-3 text-yellow-600'/>
                      <FaStar className='md:w-6 md:h-6 w-3 h-3 text-yellow-600'/>
                       <FaStar className='md:w-6 md:h-6 w-3 h-3 text-yellow-600'/>
                        <FaStar className='md:w-6 md:h-6 w-3 h-3 text-yellow-600'/>
                         <FaStar className='md:w-6 md:h-6 w-3 h-3 text-yellow-600'/>
                    </div>
                    {/*user profile*/}
                    <div className='mt-10'>
                        <div className='flex items-center space-x-4'>
                            <Image
                            src={data.Image}
                            width={60}
                            height={60}
                            alt="client"
                            className="rounded-full"
                            />
                            <div>
                                <p className='text-sm sm:text-lg font-semibold'>{data.Name}</p>
                                <p className='text-gray-600 text-xs sm:text-base'>Travel Agent</p>
                            </div>
                        </div>
                    </div>
            </div>

        </SwiperSlide>

    )
})}
    </Swiper>
  </div>

};

export default ReviewSlider;