"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiSave,
  FiX,
  FiCheck,
  FiSlash,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { createSecondaryAuth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/Admin/AdminLayout';
import RequireAuth from '@/components/Helper/RequireAuth';

interface Alert {
  type: 'success' | 'error';
  message: string;
}

interface UserForm {
  email: string;
  password: string;
  username: string;
  phone: string;
  role: 'user' | 'admin';
}

interface User {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  role: 'user' | 'admin';
  status?: string;
  isSuperAdmin?: boolean;
  createdAt?: unknown;
  uid?: string;
}

export default function UserManagement() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserForm>({
    email: '',
    password: '',
    username: '',
    phone: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      showAlert('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin, fetchUsers]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      username: '',
      phone: '',
      role: 'user'
    });
    setShowPassword(false);
    setIsAdding(false);
    setIsEditing(false);
    setEditingUserId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      showAlert('error', 'Email and password are required');
      return;
    }

    if (!isAdmin) {
      showAlert('error', 'Only admins can create users');
      return;
    }

    try {
      setLoading(true);

      if (isEditing && editingUserId) {
        // Update existing user
        const updateData: Partial<User> = {
          email: formData.email,
          username: formData.username,
          phone: formData.phone,
          role: formData.role,
          status: 'active'
        };

        await updateDoc(doc(db, 'users', editingUserId), updateData);
        showAlert('success', 'User updated successfully!');
      } else {
        // Create new user using a secondary auth so admin session remains intact
        const { auth: secondaryAuth, cleanup } = createSecondaryAuth();
        try {
          const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth,
            formData.email,
            formData.password
          );

          const userData = {
            uid: userCredential.user.uid,
            email: formData.email,
            username: formData.username,
            phone: formData.phone,
            role: formData.role,
            status: 'active',
            createdAt: serverTimestamp()
          };

          await setDoc(doc(db, 'users', userCredential.user.uid), userData);
          showAlert('success', `User ${formData.email} created successfully!`);
        } finally {
          // Ensure we always cleanup the secondary app/auth
          await cleanup();
        }
      }

      resetForm();
      fetchUsers(); // Refresh the user list
    } catch (error: unknown) {
      console.error("Error handling user:", error);

      let errorMessage = 'Failed to handle user';

      if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        const code = typeof err.code === 'string' ? err.code : undefined;
        const message = typeof err.message === 'string' ? err.message : undefined;

        if (code === 'auth/email-already-in-use') {
          errorMessage = 'User with this email already exists';
        } else if (code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        } else if (code === 'auth/weak-password') {
          errorMessage = 'Password is too weak (minimum 6 characters)';
        } else if (message) {
          errorMessage = message;
        }

        // Friendly message if Firestore rules block admin
        if (message && message.includes('Missing or insufficient permissions')) {
          errorMessage = 'Permission denied. Ensure your admin account has a document in the "adminUsers" collection with your UID as the doc ID.';
        }
      }

      showAlert('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (user: User) => {
    setFormData({
      email: user.email,
      password: '', // Don't show password when editing
      username: user.username || '',
      phone: user.phone || '',
      role: user.role
    });
    setEditingUserId(user.id);
    setIsEditing(true);
    setIsAdding(true);
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus
      });

      // Update local state
      setUsers(users.map(user =>
        user.id === userId
          ? { ...user, status: newStatus }
          : user
      ));

      showAlert('success', `User status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      showAlert('error', 'Failed to update user status');
    }
  };

  const deleteUser = async (userId: string) => {
    setConfirmDeleteId(userId); // open modal instead of native confirm
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteDoc(doc(db, 'users', confirmDeleteId));
      setUsers(users.filter(user => user.id !== confirmDeleteId));
      showAlert('success', 'User deleted successfully');
    } catch (error) {
      console.error("Error deleting user:", error);
      showAlert('error', 'Failed to delete user');
    } finally {
      setConfirmDeleteId(null);
    }
  };


  return (
    <RequireAuth>
      <AdminLayout title="User Management">
        {/* Alert Notification */}
        {alert && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${alert.type === 'success'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
            {alert.type === 'success' ? (
              <FiCheckCircle className="mr-2 text-lg" />
            ) : (
              <FiAlertCircle className="mr-2 text-lg" />
            )}
            <span>{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
              <p className="text-gray-600 mt-1">Register new users for the system</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                <FiUserPlus className="mr-2" />
                Register New User
              </button>
            </div>
          </div>

          {/* Add/Edit User Form */}
          {isAdding && (
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {isEditing ? 'Edit User' : 'Register New User'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                      required
                      placeholder="user@example.com"
                      disabled={isEditing} // Email cannot be changed when editing
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="input-field"
                      placeholder="john_doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
                      className="input-field"
                      required
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {!isEditing && (
                    <div className="md:col-span-2">
                      <label className="block text sm font-medium text-gray-700 mb-1">Password*</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="input-field pr-10"
                          required
                          minLength={6}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 focus:outline-none"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.664-2.13A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.664 2.13A9.956 9.956 0 0112 21c-2.21 0-4.267-.72-5.925-1.95M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        {isEditing ? 'Update User' : 'Save User'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Loading users...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No users found. Create your first user above.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              {user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.username || user.email.split('@')[0]}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                            {user.role}{user.isSuperAdmin ? ' (Super)' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition"
                            onClick={() => startEditUser(user)}
                            title="Edit user"
                          >
                            <FiEdit className="h-5 w-5" />
                          </button>
                          {user.role === 'user' && (
                            <button
                              onClick={() => toggleUserStatus(user.id, user.status || 'active')}
                              className={`p-1 rounded-full hover:bg-gray-50 transition ${user.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                                }`}
                              title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                            >
                              {user.status === 'active' ? <FiSlash className="h-5 w-5" /> : <FiCheck className="h-5 w-5" />}
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition"
                            title="Delete user"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Confirm Delete Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FiAlertCircle className="text-red-500 mr-2" /> Confirm Deletion
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end mt-4 space-x-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </AdminLayout>
    </RequireAuth>
  );
}