"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import RequireAuth from '@/components/Helper/RequireAuth';
import * as XLSX from 'xlsx';

interface TourData {
  id?: number;
  'Tourist country': string;
  'Month': string;
  'Duration': string;
  'Price USD': string;
  'Location': string;
  'Interest': string;
  'Activities': string;
  'Overnight_stay': string;
}

export default function MlDataPage() {
  const [data, setData] = useState<TourData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TourData>({
    'Tourist country': '',
    'Month': '',
    'Duration': '',
    'Price USD': '',
    'Location': '',
    'Interest': '',
    'Activities': '',
    'Overnight_stay': ''
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const priceRanges = ['Low', 'Medium', 'High'];
  const interests = [
    'Scenic', 'Cultural', 'Nature', 'Travel', 'Adventure', 'Wildlife',
    'Beach', 'Archaeology', 'Relaxation', 'Historical'
  ];

  // Load data from Excel file
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tour-data', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to load data');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError('Failed to load data: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Save data to Excel file
  const saveData = async (newData: TourData[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tour-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: newData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      await loadData(); // Reload data
    } catch (err) {
      setError('Failed to save data: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (field: keyof TourData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdd = () => {
    const newData = [...data, { ...formData, id: Date.now() }];
    setData(newData);
    saveData(newData);
    setFormData({
      'Tourist country': '',
      'Month': '',
      'Duration': '',
      'Price USD': '',
      'Location': '',
      'Interest': '',
      'Activities': '',
      'Overnight_stay': ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (id: number) => {
    const item = data.find(d => d.id === id);
    if (item) {
      setFormData(item);
      setEditingId(id);
      setIsEditing(true);
    }
  };

  const handleUpdate = () => {
    const newData = data.map(item =>
      item.id === editingId ? { ...formData, id: editingId } : item
    );
    setData(newData);
    saveData(newData);
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      'Tourist country': '',
      'Month': '',
      'Duration': '',
      'Price USD': '',
      'Location': '',
      'Interest': '',
      'Activities': '',
      'Overnight_stay': ''
    });
  };

  const handleDelete = (id: number) => {
    setConfirmDeleteId(id); // open modal instead of window.confirm
  };

  const confirmDelete = () => {
    if (confirmDeleteId === null) return;
    const newData = data.filter(item => item.id !== confirmDeleteId);
    setData(newData);
    saveData(newData);
    setConfirmDeleteId(null);
  };


  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      'Tourist country': '',
      'Month': '',
      'Duration': '',
      'Price USD': '',
      'Location': '',
      'Interest': '',
      'Activities': '',
      'Overnight_stay': ''
    });
  };

  if (loading) {
    return (
      <RequireAuth>
        <AdminLayout title="ML Data Operations">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-center h-32">
              <div className="text-lg">Loading...</div>
            </div>
          </div>
        </AdminLayout>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AdminLayout title="ML Data Operations">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Sri Lanka Tour Dataset Management</h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={showAddForm || isEditing}
            >
              Add New Record
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Add/Edit Form */}
          {(showAddForm || isEditing) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-md font-semibold mb-4">
                {isEditing ? 'Edit Record' : 'Add New Record'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tourist Country</label>
                  <input
                    type="text"
                    value={formData['Tourist country']}
                    onChange={(e) => handleInputChange('Tourist country', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter country name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Month</label>
                  <select
                    value={formData.Month}
                    onChange={(e) => handleInputChange('Month', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Month</option>
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Duration (days)</label>
                  <input
                    type="number"
                    value={formData.Duration}
                    onChange={(e) => handleInputChange('Duration', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter duration in days"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price Range</label>
                  <select
                    value={formData['Price USD']}
                    onChange={(e) => handleInputChange('Price USD', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Price Range</option>
                    {priceRanges.map(price => (
                      <option key={price} value={price}>{price}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.Location}
                    onChange={(e) => handleInputChange('Location', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Colombo, Sigiriya"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Interest</label>
                  <select
                    value={formData.Interest}
                    onChange={(e) => handleInputChange('Interest', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Interest</option>
                    {interests.map(interest => (
                      <option key={interest} value={interest}>{interest}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Activities</label>
                  <input
                    type="text"
                    value={formData.Activities}
                    onChange={(e) => handleInputChange('Activities', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Activity description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Overnight Stay</label>
                  <input
                    type="text"
                    value={formData['Overnight_stay']}
                    onChange={(e) => handleInputChange('Overnight_stay', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Accommodation details"
                  />
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={isEditing ? handleUpdate : handleAdd}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  disabled={!formData['Tourist country'] || !formData.Month}
                >
                  {isEditing ? 'Update' : 'Add'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Country</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Month</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Location</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Interest</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Activities</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Stay</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      No data available. Add some records to get started.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{item['Tourist country']}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.Month}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.Duration}</td>
                      <td className="border border-gray-300 px-4 py-2">{item['Price USD']}</td>
                      <td className="border border-gray-300 px-4 py-2 max-w-xs truncate" title={item.Location}>
                        {item.Location}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 max-w-xs truncate" title={item.Interest}>
                        {item.Interest}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 max-w-xs truncate" title={item.Activities}>
                        {item.Activities}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 max-w-xs truncate" title={item['Overnight_stay']}>
                        {item['Overnight_stay']}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item.id!)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                            disabled={isEditing || showAddForm}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id!)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                            disabled={isEditing || showAddForm}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Total records: {data.length}
          </div>
        </div>
        {/* Confirm Delete Modal */}
        {confirmDeleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this record? This action cannot be undone.
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