'use client';

import { useState, useEffect } from 'react';
import { FiEdit, FiDownload, FiUser, FiMail, FiBriefcase, FiPhone, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import ResponsiveNav from '@/components/Home/Navbar/ResponsiveNav';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Home/Footer/Footer';
import jsPDF from "jspdf";
import { db, auth, storage } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, updateDoc, serverTimestamp, deleteDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface PackageFormData {
  touristCountry: string;
  duration: number;
  month: string;
  budget: 'low' | 'medium' | 'high';
  interests: string[];
  overnightStay?: string;
}

interface PackageRecommendations {
  recommendedPlaces: string[];
  itinerary: { day: number; activities: string[] }[];
  estimatedCost: number;
}

interface TravelPackage {
  id: string;
  formData: PackageFormData;
  recommendations: PackageRecommendations;
  createdAt: string;
  status?: string;
}

export default function DashboardProfilePage() {
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();
  const [editingPackage, setEditingPackage] = useState<TravelPackage | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    username: "",
    email: "",
    agency: "",
    phone: "",
    createdAt: null,
    photoURL: "",
  });
  const [uploading, setUploading] = useState(false);

  // Package editing form data
  const [packageFormData, setPackageFormData] = useState<PackageFormData>({
    touristCountry: '',
    duration: 7,
    month: 'June',
    budget: 'medium',
    interests: [],
    overnightStay: ''
  });

  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleCreatePackage = () => {
    router.push('/CreatePackage');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.log("No logged-in user");
          setLoading(false);
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as any;
          setFormData({
            username: data.username || "",
            email: data.email || "",
            agency: data.agency || "",
            phone: data.phone || "",
            createdAt: data.createdAt || null,
            photoURL: data.photoURL || "",
          });
        }

        const packagesRef = collection(db, "users", user.uid, "packages");
        const snapshot = await getDocs(packagesRef);
        const pkgList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TravelPackage[];
        setPackages(pkgList);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);

      const cleanedData = {
        username: formData.username || "",
        email: formData.email || "",
        agency: formData.agency || "",
        phone: formData.phone || "",
        photoURL: formData.photoURL || "",
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, cleanedData);

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile. Try again." });
    }
  };

  // Package editing functions
  const startEditingPackage = (pkg: TravelPackage) => {
    setEditingPackage(pkg);
    setPackageFormData(pkg.formData);
  };

  const cancelEditingPackage = () => {
    setEditingPackage(null);
    setPackageFormData({
      touristCountry: '',
      duration: 7,
      month: 'June',
      budget: 'medium',
      interests: [],
      overnightStay: ''
    });
  };

  const handlePackageFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPackageFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value
    }));
  };

  const togglePackageInterest = (interest: string) => {
    setPackageFormData(prev => {
      if (prev.interests.includes(interest)) {
        return { ...prev, interests: prev.interests.filter(item => item !== interest) };
      } else {
        return { ...prev, interests: [...prev.interests, interest] };
      }
    });
  };

  const savePackageChanges = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !editingPackage) return;

      const packageRef = doc(db, "users", user.uid, "packages", editingPackage.id);
      
      const updatedPackage = {
        ...editingPackage,
        formData: packageFormData,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(packageRef, updatedPackage);

      // Update local state
      setPackages(prev => prev.map(pkg => 
        pkg.id === editingPackage.id ? updatedPackage : pkg
      ));

      setMessage({ type: "success", text: "Package updated successfully!" });
      cancelEditingPackage();
    } catch (error) {
      console.error("Error updating package:", error);
      setMessage({ type: "error", text: "Failed to update package. Try again." });
    }
  };

  // Delete package function
  const deletePackage = async (packageId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const packageRef = doc(db, "users", user.uid, "packages", packageId);
      await deleteDoc(packageRef);

      // Update local state
      setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
      setConfirmDelete(null);
      setMessage({ type: "success", text: "Package deleted successfully!" });
    } catch (error) {
      console.error("Error deleting package:", error);
      setMessage({ type: "error", text: "Failed to delete package. Try again." });
    }
  };

  // Download PDF function
  const downloadPackagePDF = (pkg: TravelPackage) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Travel Package Itinerary", 10, 20);

    doc.setFontSize(12);
    let yPos = 35;
    doc.text(`Tourist Country: ${pkg.formData.touristCountry}`, 10, yPos);
    yPos += 8;
    doc.text(`Duration: ${pkg.formData.duration} days`, 10, yPos);
    yPos += 8;
    doc.text(`Month: ${pkg.formData.month}`, 10, yPos);
    yPos += 8;
    doc.text(`Budget: ${pkg.formData.budget}`, 10, yPos);
    yPos += 8;
    doc.text("Interests: " + pkg.formData.interests.join(", "), 10, yPos);
    yPos += 15;

    doc.setFontSize(14);
    doc.text("Recommended Places:", 10, yPos);
    yPos += 8;
    doc.setFontSize(10);
    pkg.recommendations.recommendedPlaces.forEach((place, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${idx + 1}. ${place}`, 15, yPos);
      yPos += 6;
    });

    yPos += 10;
    doc.setFontSize(14);
    doc.text("Daily Itinerary:", 10, yPos);
    yPos += 8;
    doc.setFontSize(10);
    
    pkg.recommendations.itinerary.forEach((day) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`Day ${day.day}:`, 15, yPos);
      yPos += 6;
      day.activities.forEach(activity => {
        if (yPos > 270) { 
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${activity}`, 20, yPos);
        yPos += 6;
      });
      yPos += 4;
    });

    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Estimated Cost: $${pkg.recommendations.estimatedCost}`, 10, yPos);

    doc.save(`travel_package_${pkg.formData.touristCountry}_${pkg.formData.month}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-950">
      <header className="fixed top-0 w-full z-50 bg-white shadow-sm">
        <ResponsiveNav />
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 w-full pt-20 pb-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Dashboard</h1>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.text}
            <button 
              onClick={() => setMessage(null)}
              className="float-right text-lg font-bold"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section - Shortened */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4 h-fit">
            {formData && (
              <div className="text-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-3 overflow-hidden">
                  {formData.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : null}
                </div>

                {!editMode ? (
                  <>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">{formData.username}</h2>
                    <p className="text-sm text-gray-600 mb-3">{formData.agency}</p>
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center justify-center text-blue-500 hover:text-blue-600 text-sm mx-auto"
                    >
                      <FiEdit className="mr-1" />
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleSubmit} className="w-full">
                    <div className="space-y-3">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploading(true);
                              const user = auth.currentUser;
                              if (!user) return;
                              const fileRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
                              await uploadBytes(fileRef, file);
                              const url = await getDownloadURL(fileRef);
                              setFormData((prev:any) => ({ ...prev, photoURL: url }));
                            } finally {
                              setUploading(false);
                            }
                          }}
                          className="w-full text-sm"
                        />
                        {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                      </div>
                      <div>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          placeholder="Name"
                          className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email"
                          className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="agency"
                          value={formData.agency}
                          onChange={handleChange}
                          placeholder="Agency"
                          className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Phone"
                          className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {formData && !editMode && (
              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <FiUser className="mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {formData?.createdAt?.seconds
                      ? new Date(formData.createdAt.seconds * 1000).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                        })
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FiMail className="mr-2 flex-shrink-0" />
                  <span className="truncate">{formData.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FiBriefcase className="mr-2 flex-shrink-0" />
                  <span className="truncate">{formData.agency}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FiPhone className="mr-2 flex-shrink-0" />
                  <span className="truncate">{formData.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Packages Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">My Travel Packages</h2>
              {packages.length > 0 ? (
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id}>
                      {editingPackage?.id === pkg.id ? (
                        // Edit Form
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Edit Package</h3>
                            <button
                              onClick={cancelEditingPackage}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <FiX className="text-xl" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tourist Country
                              </label>
                              <input
                                type="text"
                                name="touristCountry"
                                value={packageFormData.touristCountry}
                                onChange={handlePackageFormChange}
                                className="w-full border border-gray-300 px-3 py-2 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (days)
                              </label>
                              <input
                                type="number"
                                name="duration"
                                min="1"
                                max="30"
                                value={packageFormData.duration}
                                onChange={handlePackageFormChange}
                                className="w-full border border-gray-300 px-3 py-2 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Month
                              </label>
                              <select
                                name="month"
                                value={packageFormData.month}
                                onChange={handlePackageFormChange}
                                className="w-full border border-gray-300 px-3 py-2 rounded"
                              >
                                {monthOptions.map(month => (
                                  <option key={month} value={month}>{month}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Budget Level
                              </label>
                              <select
                                name="budget"
                                value={packageFormData.budget}
                                onChange={handlePackageFormChange}
                                className="w-full border border-gray-300 px-3 py-2 rounded"
                              >
                                <option value="low">Low ($50/day)</option>
                                <option value="medium">Medium ($120/day)</option>
                                <option value="high">High ($250/day)</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Overnight Stay
                              </label>
                              <select
                                name="overnightStay"
                                value={packageFormData.overnightStay || ''}
                                onChange={handlePackageFormChange}
                                className="w-full border border-gray-300 px-3 py-2 rounded"
                              >
                                <option value="">No preference</option>
                                {overnightOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tourist Interests
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {interestOptions.map(interest => (
                                <button
                                  key={interest}
                                  type="button"
                                  onClick={() => togglePackageInterest(interest)}
                                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                    packageFormData.interests.includes(interest)
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {interest}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={cancelEditingPackage}
                              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={savePackageChanges}
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                            >
                              <FiCheck className="mr-1" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display Package
                        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                pkg.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {pkg.status || "draft"}
                            </span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => downloadPackagePDF(pkg)}
                                className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                              >
                                <FiDownload className="mr-1" />
                                Download PDF
                              </button>
                              <button 
                                onClick={() => startEditingPackage(pkg)}
                                className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                              >
                                <FiEdit className="mr-1" />
                                Edit
                              </button>
                              <button 
                                onClick={() => setConfirmDelete(pkg.id)}
                                className="text-red-500 hover:text-red-700 text-sm flex items-center"
                              >
                                <FiTrash2 className="mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-500">Tourist Country</p>
                              <p className="text-gray-800">{pkg.formData?.touristCountry}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Duration</p>
                              <p className="text-gray-800">{pkg.formData?.duration} days</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Created</p>
                              <p className="text-gray-800">{pkg.createdAt}</p>
                            </div>
                          </div>
                          <div className="mb-3">
                            <p className="text-sm text-gray-500">Recommended Places</p>
                            <p className="text-gray-800">{pkg.recommendations?.recommendedPlaces?.join(', ')}</p>
                          </div>
                        </div>
                      )}

                      {/* Delete Confirmation Modal */}
                      {confirmDelete === pkg.id && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Delete Package</h3>
                            <p className="text-gray-600 mb-6">
                              Are you sure you want to delete this travel package? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => deletePackage(pkg.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You haven't created any packages yet.</p>
                  <button onClick={handleCreatePackage} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Create Your First Package
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}