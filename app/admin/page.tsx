"use client";
import { useEffect, useState } from 'react';
import { FiUsers, FiGlobe, FiStar, FiTrendingUp, FiActivity } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/Admin/AdminLayout';
import RequireAuth from '@/components/Helper/RequireAuth';
import { collection, getDocs, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string;
  username?: string;
  role: string;
  status?: string;
  createdAt: Date | { toDate(): Date };
}

interface ActivityData {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
}

const AdminPanel = () => {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  // Protect admin route
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, isAdmin, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || !isAdmin) {
    return null; // Will redirect to login
  }

  return (
    <RequireAuth>
      <AdminLayout title="Dashboard">
        <DashboardView />
      </AdminLayout>
    </RequireAuth>
  );
};

// Component for each tab
const DashboardView = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDestinations: 0,
    totalReviews: 0
  });
  const [recentUsers, setRecentUsers] = useState<UserData[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch user statistics
        const usersCollection = collection(db, 'users');
        const adminUsersCollection = collection(db, 'adminUsers');
        
        // Get total users count
        const usersSnapshot = await getCountFromServer(usersCollection);
        const adminSnapshot = await getCountFromServer(adminUsersCollection);
        const totalUsers = usersSnapshot.data().count + adminSnapshot.data().count;
        
        // Get active users (users with status 'active' or no status field)
        const activeUsersQuery = query(usersCollection, where('status', '==', 'active'));
        const activeUsersSnapshot = await getCountFromServer(activeUsersQuery);
        const activeUsers = activeUsersSnapshot.data().count;
        
        // Get destination count from data file
        const destinationData = await import('@/data/data');
        const totalDestinations = destinationData.destinationData.length;
        
        // Get reviews count
        const totalReviews = destinationData.reviewsData.length;
        
        setStats({
          totalUsers,
          activeUsers,
          totalDestinations,
          totalReviews
        });

        // Fetch recent users
        const recentUsersQuery = query(
          usersCollection, 
          orderBy('createdAt', 'desc'), 
          limit(5)
        );
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        const recentUsersData = recentUsersSnapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          return {
            uid: doc.id,
            ...data,
            createdAt
          };
        }) as UserData[];
        
        setRecentUsers(recentUsersData);

        // Generate recent activities based on data
        const activities: ActivityData[] = [];
        
        // Add user registration activities
        recentUsersData.forEach(user => {
          const timestamp = user.createdAt instanceof Date ? user.createdAt : new Date();
          activities.push({
            id: `user-${user.uid}`,
            type: 'user_registration',
            description: 'New user registered',
            timestamp,
            userId: user.uid,
            userEmail: user.email
          });
        });

        // Add destination activities
        if (totalDestinations > 0) {
          activities.push({
            id: 'destinations',
            type: 'destinations_updated',
            description: `${totalDestinations} destinations available`,
            timestamp: new Date(),
          });
        }

        // Add review activities
        if (totalReviews > 0) {
          activities.push({
            id: 'reviews',
            type: 'reviews_updated',
            description: `${totalReviews} reviews submitted`,
            timestamp: new Date(),
          });
        }

        // Sort activities by timestamp
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setRecentActivities(activities.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full">
              <FiUsers className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full">
              <FiTrendingUp className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-medium">Active Users</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
      </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-full">
              <FiGlobe className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-medium">Destinations</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDestinations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-full">
              <FiStar className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-medium">Reviews</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiActivity className="mr-2 text-blue-600" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  {activity.type === 'user_registration' && <FiUsers className="text-blue-600" />}
                  {activity.type === 'destinations_updated' && <FiGlobe className="text-purple-600" />}
                  {activity.type === 'reviews_updated' && <FiStar className="text-yellow-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm text-gray-500">
                    {activity.userEmail && `${activity.userEmail} - `}
                    {activity.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiActivity className="mx-auto text-4xl mb-2 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Users */}
      {recentUsers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiUsers className="mr-2 text-blue-600" />
            Recent Users
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUsers.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.username || 'No username'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {user.createdAt instanceof Date ? user.createdAt.toLocaleDateString() : 'N/A'}
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;