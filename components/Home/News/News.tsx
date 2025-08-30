import Sectionheading from '@/components/Helper/Sectionheading'
import React from 'react'
import NewsCard from './NewsCard'

const News = () => {
  return (
    <div className='pt-16 pb-16'>
        {/*section heading*/}
        <Sectionheading heading='Exciting Travel News For You'/>
        <div className='w-[80%] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 items-center mt-20'>
                    <div 
                    data-aos="fade-up" 
                    data-aos-anchor-placement="top-center"  
                    >
                <NewsCard 
                image='/images/a.jpg'
                title='Top 10 Places in Sri Lanka'
                date='15 July 2025'
                />
            </div>
                  
                          <div data-aos="fade-up" 
                          data-aos-anchor-placement="top-center"  
                          data-aos-delay="100">
                <NewsCard 
                image='/images/a.jpg'
                title='Top 10 Places in Sri Lanka'
                date='15 July 2025'
                />
            </div>
                   <div data-aos="fade-up" 
                          data-aos-anchor-placement="top-center"  
                          data-aos-delay="200">
                <NewsCard 
                image='/images/a.jpg'
                title='Top 10 Places in Sri Lanka'
                date='15 July 2025'
                />
            </div>
                   <div data-aos="fade-up" 
                          data-aos-anchor-placement="top-center"  
                          data-aos-delay="300">
                <NewsCard 
                image='/images/a.jpg'
                title='Top 10 Places in Sri Lanka'
                date='15 July 2025'
                />
            </div>
        </div>
        </div>
  )
}

export default News