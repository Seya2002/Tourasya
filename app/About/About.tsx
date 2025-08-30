'use client';

import Image from 'next/image';
import ResponsiveNav from '@/components/Home/Navbar/ResponsiveNav';
import Footer from '@/components/Home/Footer/Footer';
import { FaMapMarkerAlt, FaLightbulb, FaChartLine, FaShieldAlt } from 'react-icons/fa';

// Define FeatureCard component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

// Define TechLogo component
function TechLogo({ name, image }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-full shadow-md w-20 h-20 flex items-center justify-center">
        <Image 
          src={image}
          width={40}
          height={40}
          alt={name}
        />
      </div>
      <span className="mt-2 font-medium">{name}</span>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-blue-950">
      {/* Fixed Navigation at the top */}
      <div className="fixed top-0 w-full z-50 bg-white shadow-sm">
        <ResponsiveNav />
      </div>

      {/* Main Content - pushed down by pt-24 (6rem) to account for fixed nav height */}
      <main className="flex-grow max-w-6xl mx-auto px-4 w-full pt-24">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-300 mb-4">About Our Travel Recommendation System</h1>
          <p className="text-xl text-white max-w-3xl mx-auto">
            Empowering Sri Lankan tourism agencies with intelligent, data-driven travel recommendations
          </p>
        </div>

        {/* Overview Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <Image
                src="/images/a.jpg"
                width={600}
                height={400}
                alt="Sri Lanka Tourism"
                className="rounded-lg"
                priority
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                Sri Lanka is renowned worldwide for its breathtaking locations, cultural diversity, 
                and historical sites. With increasing tourist interest, travel agencies need 
                efficient tools to provide personalized recommendations.
              </p>
              <p className="text-gray-600">
                Our system leverages machine learning to analyze tourist preferences and suggest 
                optimal travel packages, saving time for agencies while enhancing tourist 
                satisfaction.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-blue-300 mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={<FaMapMarkerAlt className="text-blue-500 text-3xl" />}
              title="Smart Recommendations"
              description="Machine learning suggests ideal destinations based on tourist preferences, season, and duration"
            />
            <FeatureCard 
              icon={<FaLightbulb className="text-green-500 text-3xl" />}
              title="Time Savings"
              description="Reduces manual research time for travel agents by up to 70%"
            />
            <FeatureCard 
              icon={<FaChartLine className="text-purple-500 text-3xl" />}
              title="Performance Analytics"
              description="Track recommendation success rates and tourist satisfaction metrics"
            />
            <FeatureCard 
              icon={<FaShieldAlt className="text-orange-500 text-3xl" />}
              title="Secure Platform"
              description="Role-based access control protects sensitive tourist information"
            />
          </div>
        </div>

        {/* Technology Stack removed as requested */}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}