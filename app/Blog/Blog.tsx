'use client';

import Image from 'next/image';
import ResponsiveNav from '@/components/Home/Navbar/ResponsiveNav';
import Footer from '@/components/Home/Footer/Footer';

export default function BlogPage() {
  // Sample blog data with only images
  const blogImages = [
    {
      id: 1,
      image: '/images/b1.jpeg',
      alt: 'Blog Image 1'
    },
    {
      id: 2,
      image: '/images/b2.jpeg',
      alt: 'Blog Image 2'
    },
    {
      id: 3,
      image: '/images/b3.jpeg',
      alt: 'Blog Image 3'
    },
    {
      id: 4,
      image: '/images/b4.jpeg',
      alt: 'Blog Image 4'
    },
    {
      id: 5,
      image: '/images/b5.jpeg',
      alt: 'Blog Image 5'
    },
    {
      id: 6,
      image: '/images/b6.jpeg',
      alt: 'Blog Image 6'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-blue-950">
      {/* Fixed Navigation Bar at the top */}
      <header className="fixed top-0 w-full z-50 bg-white shadow-sm">
        <ResponsiveNav />
      </header>

      {/* Main Content - pushed down by pt-24 to account for fixed nav height */}
      <main className="flex-grow max-w-6xl mx-auto px-4 w-full pt-24 pb-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-300 mb-4">TourAsya Blog</h1>
          <p className="text-xl text-white max-w-3xl mx-auto">
            Visual stories and insights about Sri Lankan tourism
          </p>
        </div>

        {/* Blog Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogImages.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-64">
                <Image
                  src={item.image}
                  fill
                  className="object-cover"
                  alt={item.alt}
                  priority={item.id <= 3} // Prioritize first 3 images
                />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer at the bottom */}
      <Footer />
    </div>
  );
}