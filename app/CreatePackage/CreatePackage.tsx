'use client';

import { useState } from 'react';
import { FiPlus, FiDownload, FiCheck, FiArrowLeft, FiStar } from 'react-icons/fi';
import ResponsiveNav from '@/components/Home/Navbar/ResponsiveNav';
import Footer from '@/components/Home/Footer/Footer';
import axios from 'axios';
import { doc, setDoc, collection, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import jsPDF from "jspdf";

interface FormData {
  touristCountry: string;
  duration: number;
  month: string;
  budget: 'low' | 'medium' | 'high';
  interests: string[];
  overnightStay?: string;
}

interface Recommendation {
  recommendedPlaces: string[];
  itinerary: { day: number; activities: string[] }[];
  estimatedCost: number;
}

// Interface for ML model response
interface MLRecommendation {
  index: number;
  score: number;
  country: string;
  month: string;
  duration: number;
  budget: string;
  location: string;
  interests: string;
  activities: string;
  overnight_stay: string;
  explanation: string;
  duration_score: number;
  budget_score: number;
  interest_score: number;
  overnight_score: number;
}

export default function CreatePackagePage() {
  const [formData, setFormData] = useState<FormData>({
    touristCountry: '',
    duration: 7,
    month: 'June',
    budget: 'medium',
    interests: [],
    overnightStay: ''
  });

  const [recommendations, setRecommendations] = useState<Recommendation | null>(null);
  const [mlRecommendations, setMlRecommendations] = useState<MLRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [packageCreated, setPackageCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [ratingSaved, setRatingSaved] = useState<boolean>(false);

  const saveToFirebase = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to save a package.");
        return;
      }

      // users/{uid}/packages/{auto-id}
      const packagesRef = collection(db, "users", user.uid, "packages");
      const newPackageRef = doc(packagesRef);

      await setDoc(newPackageRef, {
        formData,
        recommendations,
        mlRecommendations,
        createdAt: new Date().toISOString(),
      });

      console.log("Package saved ✅", newPackageRef.id);
      return newPackageRef.id;
    } catch (error) {
      console.error("Error saving package:", error);
    }
  };

  // Helper function to generate itinerary from ML recommendations
  const generateItinerary = (recommendations: MLRecommendation[], duration: number) => {
    const itinerary = [];
    const recsPerDay = Math.max(1, Math.ceil(recommendations.length / duration));

    for (let day = 1; day <= duration; day++) {
      const startIdx = (day - 1) * recsPerDay;
      const endIdx = Math.min(startIdx + recsPerDay, recommendations.length);

      const dayRecs = recommendations.slice(startIdx, endIdx);
      const activities = [];

      dayRecs.forEach(rec => {
        if (rec.location && rec.location.trim()) {
          activities.push(`Explore ${rec.location}`);
        }
        if (rec.activities && rec.activities.trim()) {
          const activity = rec.activities.length > 80
            ? rec.activities.substring(0, 80) + '...'
            : rec.activities;
          activities.push(activity);
        }
      });

      // Fallback activities if none found
      if (activities.length === 0) {
        activities.push(`Day ${day}: Explore local attractions and cultural sites`);
        if (formData.interests.length > 0) {
          activities.push(`Experience ${formData.interests.join(', ')} activities`);
        }
      }

      itinerary.push({
        day,
        activities: activities.slice(0, 3) // Limit to 3 activities per day
      });
    }

    return itinerary;
  };

  // Helper function to calculate estimated cost
  const calculateEstimatedCost = (budget: string, duration: number): number => {
    const baseCostPerDay = {
      low: 50,
      medium: 120,
      high: 250
    };

    return (baseCostPerDay[budget as keyof typeof baseCostPerDay] || 120) * duration;
  };

  // Load dataset (call this once)
  const loadDataset = async () => {
    try {
      await axios.post('http://localhost:8000/load-dataset', null, {
        params: { file_path: 'SRI_LANKA_TOUR_DATASET.xlsx' },
        headers: { 'Content-Type': 'application/json' },
        withCredentials: false,
        timeout: 30000 // 30 second timeout
      });
      setDatasetLoaded(true);
      console.log('✅ Dataset loaded successfully');
      return true;
    } catch (error) {
      console.log('⚠️ Dataset load error (might already be loaded):', error);
      // Assume it's already loaded and continue
      setDatasetLoaded(true);
      return true;
    }
  };


  // PDF for download with TOURASYA branding
  const downloadPDF = async () => {
    if (!recommendations) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Convert logo image to base64
    let logoBase64 = '';
    try {
      const response = await fetch('tlogo.png'); 
      const blob = await response.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Could not load logo image:', error);
    }

    // Helper function to add header on each page
    const addHeader = () => {
      // Background header
      doc.setFillColor(220, 38, 127); // Rose color (rose-500)
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Add logo image if available
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 8, 5, 15, 15); // x, y, width, height
        } catch (error) {
          console.warn('Could not add logo to PDF:', error);
          // Fallback to text
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('TOURASYA', 15, 16);
        }
      } else {
        // Fallback to text logo
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('TOURASYA', 15, 16);
      }
      
      // TOURASYA text next to logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('TOURASYA', 30, 16);
      
      // Subtitle
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('AI-Powered Travel Recommendations', 120, 16);
    };

    // Add header to first page
    addHeader();

    // Main title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("Travel Package Itinerary", 15, 40);

    // Package details section
    doc.setFillColor(248, 250, 252); // Light gray background
    doc.rect(15, 50, pageWidth - 30, 45, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); // Blue color
    doc.text("Package Details", 20, 62);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    let yPos = 72;
    doc.text(`Destination: ${formData.touristCountry}`, 20, yPos);
    yPos += 6;
    doc.text(`Duration: ${formData.duration} days`, 20, yPos);
    yPos += 6;
    doc.text(`Travel Month: ${formData.month}`, 20, yPos);
    yPos += 6;
    doc.text(`Budget Level: ${formData.budget.toUpperCase()} ($${Math.round((recommendations?.estimatedCost || 0) / formData.duration)}/day)`, 20, yPos);
    yPos += 6;
    doc.text("Interests: " + formData.interests.join(", "), 20, yPos);

    yPos = 105;

    // Recommended Places section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 127); // Rose color
    doc.text("Recommended Destinations", 15, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Create a grid layout for places
    const places = recommendations?.recommendedPlaces || [];
    for (let i = 0; i < places.length; i += 2) {
      if (yPos > 270) {
        doc.addPage();
        addHeader();
        yPos = 35;
      }
      
      // Left column
      doc.setFillColor(220, 38, 127);
      doc.circle(20, yPos - 1, 1.5, 'F');
      doc.text(places[i], 25, yPos);
      
      // Right column (if exists)
      if (places[i + 1]) {
        doc.setFillColor(220, 38, 127);
        doc.circle(110, yPos - 1, 1.5, 'F');
        doc.text(places[i + 1], 115, yPos);
      }
      
      yPos += 8;
    }

    yPos += 10;

    // Daily Itinerary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 127);
    doc.text("Daily Itinerary", 15, yPos);
    yPos += 10;
    
    recommendations?.itinerary.forEach((day) => {
      if (yPos > 250) {
        doc.addPage();
        addHeader();
        yPos = 35;
      }
      
      // Day header with colored background
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 12, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 127);
      doc.text(`Day ${day.day}`, 20, yPos + 2);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      day.activities.forEach(activity => {
        if (yPos > 270) {
          doc.addPage();
          addHeader();
          yPos = 35;
        }
        
        // Bullet point
        doc.setFillColor(220, 38, 127);
        doc.circle(22, yPos - 1, 1, 'F');
        
        // Wrap long text
        const lines = doc.splitTextToSize(activity, pageWidth - 45);
        doc.text(lines, 27, yPos);
        yPos += (lines.length * 5) + 2;
      });
      yPos += 6;
    });

    // Cost breakdown section
    if (yPos > 220) {
      doc.addPage();
      addHeader();
      yPos = 40;
    }
    
    doc.setFillColor(34, 197, 94); // Green background
    doc.rect(15, yPos, pageWidth - 30, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Cost Breakdown", 20, yPos + 12);
    
    doc.setFontSize(16);
    doc.text(`Total Cost: ${recommendations?.estimatedCost}`, 20, yPos + 22);
    
    // Footer
    yPos = pageHeight - 15;
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated by TOURASYA AI • ${new Date().toLocaleDateString()}`, 15, yPos);

    doc.save(`TOURASYA_${formData.touristCountry}_${formData.month}_Package.pdf`);
  };

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const interestOptions = [
    'Scenic', 'Cultural', 'Nature', 'Travel', 'Adventure', 'Wildlife',
    'Beach', 'Archaeology', 'Relaxation', 'Historical'
  ];

  const overnightOptions = [
    'Hotel', 'Resort', 'Homestay', 'Hostel', 'Camping', 'Luxury Hotel', 'Budget Hotel'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      if (prev.interests.includes(interest)) {
        return { ...prev, interests: prev.interests.filter(item => item !== interest) };
      } else {
        return { ...prev, interests: [...prev.interests, interest] };
      }
    });
  };

  const getRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Ensure dataset is loaded
      if (!datasetLoaded) {
        console.log('📊 Loading dataset...');
        const loaded = await loadDataset();
        if (!loaded) {
          setError('Failed to load dataset. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // 2. Validate form data
      if (!formData.touristCountry.trim()) {
        setError('Please enter a tourist country.');
        setIsLoading(false);
        return;
      }

      if (formData.interests.length === 0) {
        setError('Please select at least one interest.');
        setIsLoading(false);
        return;
      }

      // 3. Format the request data correctly for FastAPI
      const requestData = {
        preferences: {
          country: formData.touristCountry.toLowerCase().trim(),
          duration: formData.duration,
          month: formData.month.toLowerCase().trim(),
          budget_level: formData.budget.toLowerCase().trim(),
          interests: formData.interests.map(interest => interest.toLowerCase().trim()),
          overnight_stay: (formData.overnightStay || '').toLowerCase().trim()
        },
        top_k: 10,
        diverse: true
      };

      console.log('🚀 Sending recommendation request:', requestData);

      const response = await axios.post('http://localhost:8000/recommend', requestData, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: false,
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ Received ML recommendations:', response.data);

      // 4. Process the ML model response
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const mlRecs: MLRecommendation[] = response.data;
        setMlRecommendations(mlRecs);

        // 5. Transform to frontend format
        const transformedRecommendations: Recommendation = {
          recommendedPlaces: mlRecs
            .filter(rec => rec.location && rec.location.trim())
            .slice(0, 8)
            .map(rec => rec.location)
            .filter((place, index, arr) => arr.indexOf(place) === index), // Remove duplicates
          itinerary: generateItinerary(mlRecs, formData.duration),
          estimatedCost: calculateEstimatedCost(formData.budget, formData.duration)
        };

        setRecommendations(transformedRecommendations);
        console.log('🎯 Transformed recommendations:', transformedRecommendations);
      } else {
        setError('No recommendations found for your preferences. Try different criteria or check if the country name is correct.');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error getting recommendations:', error);
      setIsLoading(false);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          setError('❌ Cannot connect to recommendation server. Please ensure the FastAPI server is running at http://localhost:8000');
        } else if (error.response?.status === 422) {
          setError(`Validation Error: ${error.response.data?.detail || 'Invalid input data. Please check your entries.'}`);
        } else if (error.response?.status === 400) {
          setError('Dataset not loaded on server. Trying to reload...');
          setDatasetLoaded(false);
        } else if (error.response?.status === 500) {
          setError(`Server Error: ${error.response.data?.detail || 'Internal server error. Please try again.'}`);
        } else {
          setError(`Request failed: ${error.response?.data?.detail || error.message}`);
        }
      } else {
        setError('❌ Network error. Make sure the FastAPI server is running at http://localhost:8000');
      }
    }
  };

  const createPackage = async () => {
    setIsLoading(true);
    try {
      const packageId = await saveToFirebase();
      if (packageId) {
        setPackageId(packageId);
      }
      setTimeout(() => {
        setPackageCreated(true);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating package:', error);
      setIsLoading(false);
      setError('Failed to save package. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      touristCountry: '',
      duration: 7,
      month: 'June',
      budget: 'medium',
      interests: [],
      overnightStay: ''
    });
    setRecommendations(null);
    setMlRecommendations([]);
    setPackageCreated(false);
    setError(null);
    setPackageId(null);
    setRating(0);
    setRatingSaved(false);
  };

  const saveRating = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !packageId || rating === 0) return;
      const packageRef = doc(db, 'users', user.uid, 'packages', packageId);
      await updateDoc(packageRef, {
        rating,
        ratedAt: new Date().toISOString()
      });
      setRatingSaved(true);
    } catch (err) {
      console.error('Error saving rating:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-950">
      <header className="fixed top-0 w-full z-50 bg-white shadow-sm">
        <ResponsiveNav />
      </header>

      <main className="flex-grow max-w-4xl mx-auto px-4 w-full pt-20 pb-12">
        {!packageCreated ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-blue-300">Create New Travel Package</h1>
            </div>

            {!recommendations ? (
              <form onSubmit={getRecommendations} className="bg-white rounded-lg shadow-md p-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tourist Country *
                    </label>
                    <input
                      type="text"
                      name="touristCountry"
                      value={formData.touristCountry}
                      onChange={handleChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Sri Lanka, Japan, France"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      min="1"
                      max="30"
                      value={formData.duration}
                      onChange={handleChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month *
                    </label>
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handleChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {monthOptions.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Level *
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low ($50/day)</option>
                      <option value="medium">Medium ($120/day)</option>
                      <option value="high">High ($250/day)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Overnight Stay (Optional)
                    </label>
                    <select
                      name="overnightStay"
                      value={formData.overnightStay || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No preference</option>
                      {overnightOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tourist Interests * (Select at least one)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${formData.interests.includes(interest)
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                  {formData.interests.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {formData.interests.join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 disabled:bg-rose-300 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Getting Recommendations...
                      </>
                    ) : (
                      <>
                        <FiPlus className="mr-2" />
                        Get AI Recommendations
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Recommendation</h2>
                  <button
                    onClick={() => setRecommendations(null)}
                    className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-1 rounded border"
                  >
                    <FiArrowLeft className="mr-1" />
                    Back to Form
                  </button>
                </div>

                {mlRecommendations.length > 0 && (
                  <div className="mb-6 p-4 bg-rose-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-rose-800">ML Model Results</h3>
                    <p className="text-sm text-rose-600 mb-3">
                      Found {mlRecommendations.length} recommendations based on your preferences
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {mlRecommendations.slice(0, 4).map((rec, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border">
                          <strong>{rec.location}</strong>
                          <br />
                          <span className="text-gray-600">{rec.explanation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Recommended Destinations:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {recommendations?.recommendedPlaces.map((place, idx) => (
                      <div key={idx} className="bg-rose-500 text-white px-3 py-2 rounded-lg text-sm font-medium text-center">
                        {place}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Daily Itinerary:</h3>
                  <div className="space-y-4">
                    {recommendations?.itinerary.map(day => (
                      <div key={day.day} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-lg text-gray-800 mb-2 flex items-center">
                          <span className="bg-rose-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                            {day.day}
                          </span>
                          Day {day.day}
                        </h4>
                        <ul className="list-disc pl-11 space-y-1">
                          {day.activities.map((activity, i) => (
                            <li key={i} className="text-gray-600">{activity}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800">Cost Breakdown:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">${recommendations?.estimatedCost}</div>
                      <div className="text-sm text-gray-600">Total Cost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{formData.duration}</div>
                      <div className="text-sm text-gray-600">Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        ${Math.round((recommendations?.estimatedCost || 0) / formData.duration)}
                      </div>
                      <div className="text-sm text-gray-600">Per Day</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 capitalize">{formData.budget}</div>
                      <div className="text-sm text-gray-600">Budget Level</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPackage}
                    disabled={isLoading}
                    className="flex items-center bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:bg-green-300 font-medium"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Package...
                      </>
                    ) : (
                      <>
                        <FiCheck className="mr-2" />
                        Create Package
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="bg-green-100 text-green-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FiCheck className="text-3xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Package Created Successfully!</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Your AI-powered travel package for <strong>{formData.touristCountry}</strong> has been saved to your dashboard.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Package Summary:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>Destination:</strong> {formData.touristCountry}</div>
                <div><strong>Duration:</strong> {formData.duration} days</div>
                <div><strong>Month:</strong> {formData.month}</div>
                <div><strong>Budget:</strong> {formData.budget}</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={resetForm}
                className="flex items-center bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 font-medium"
              >
                <FiPlus className="mr-2" />
                Create Another Package
              </button>
              <button
                onClick={() => {
                  downloadPDF();
                }}
                className="flex items-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
              >
                <FiDownload className="mr-2" />
                Download PDF
              </button>
            </div>

            {/* Rating section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Rate this package</h3>
              <div className="flex items-center justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`p-2 rounded-full ${n <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                    aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                  >
                    <FiStar className="w-6 h-6" />
                  </button>
                ))}
              </div>
              <button
                onClick={saveRating}
                disabled={rating === 0 || ratingSaved}
                className={`px-5 py-2 rounded-lg text-white font-medium ${rating === 0 || ratingSaved ? 'bg-gray-300 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600'}`}
              >
                {ratingSaved ? 'Rating Saved' : 'Submit Rating'}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}