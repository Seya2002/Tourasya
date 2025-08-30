import React from 'react';
import { FaCalendarWeek, FaMap } from 'react-icons/fa';

const SearchBox = () => {
  return (
    <div className='bg-white rounded-lg p-4 sm:p-6 w-full max-w-6xl mx-auto'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Country Input */}
        <div className='flex items-center gap-4'>
          <FaMap className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0' />
          <div className='w-full'>
            <p className='text-sm sm:text-base md:text-lg font-medium mb-1'>Country</p>
            <input 
              type='text' 
              placeholder='Where are you coming from' 
              className='w-full outline-none border-none placeholder:text-gray-600 text-sm sm:text-base '
            />
          </div>
        </div>

        {/* Start Date */}
        <div className='flex items-center gap-4'>
          <FaCalendarWeek className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0' />
          <div className='w-full'>
            <p className='text-sm sm:text-base md:text-lg font-medium mb-1'>Start Date</p>
            <input 
              type='date' 
              className='w-full outline-none border-none text-sm sm:text-base '
            />
          </div>
        </div>

        {/* End Date */}
        <div className='flex items-center gap-4'>
          <FaCalendarWeek className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0' />
          <div className='w-full'>
            <p className='text-sm sm:text-base md:text-lg font-medium mb-1'>End Date</p>
            <input 
              type='date' 
              className='w-full outline-none border-none text-sm sm:text-base'
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBox;
