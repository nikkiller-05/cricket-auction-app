import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SubAdminManagement = ({ userRole }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    try {
  const response = await axios.get(`${API_BASE_URL}/api/auth/sub-admins`);
      setSubAdmins(response.data.subAdmins);
    } catch (error) {
      console.error('Error fetching sub-admins:', error);
    }
  };

  const handleCreateSubAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
  await axios.post(`${API_BASE_URL}/api/auth/sub-admin`, formData);
      setFormData({ username: '', password: '', name: '' });
      setShowCreateForm(false);
      fetchSubAdmins();
    } catch (error) {
      console.error('Error creating sub-admin:', error);
      alert(error.response?.data?.error || 'Error creating sub-admin');
    } finally {
      setLoading(false);
    }
  };

  const initDeleteSubAdmin = (admin) => {
    setDeleteTarget(admin);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubAdmin = async () => {
    if (!deleteTarget) return;

    try {
  await axios.delete(`${API_BASE_URL}/api/auth/sub-admin/${deleteTarget.id}`);
      fetchSubAdmins();
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting sub-admin:', error);
      alert(error.response?.data?.error || 'Error deleting sub-admin');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-4 border-2 border-indigo-300 border-opacity-60 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900">Sub-Admin Management</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium border-2 border-indigo-500 shadow-md transition-all"
        >
          + Create Sub-Admin
        </button>
      </div>

      {/* Create Sub-Admin Form */}
      {showCreateForm && (
        <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-blue-400 border-opacity-70 hover:bg-opacity-30 transition-all duration-300">
          <h4 className="text-xl font-bold text-gray-900 mb-4">Create New Sub-Admin</h4>
          <form onSubmit={handleCreateSubAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Sub-Admin Permissions:</strong> Can only perform bidding actions (place bids, sell players, mark unsold). 
                Cannot upload files, configure settings, or reset auction.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md border-2 border-gray-400 shadow-md transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 px-4 rounded-md border-2 border-indigo-500 shadow-md transition-all"
              >
                {loading ? 'Creating...' : 'Create Sub-Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Admins List */}
      <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-green-400 border-opacity-70 hover:bg-opacity-30 transition-all duration-300">
        <div className="px-6 py-4 border-b-2 border-green-300 border-opacity-50 bg-green-50 bg-opacity-30">
          <h4 className="text-xl font-bold text-gray-900">Active Sub-Admins ({subAdmins.length})</h4>
        </div>
        
        {subAdmins.length > 0 ? (
          <div className="divide-y-2 divide-gray-300 divide-opacity-40">
            {subAdmins.map((admin) => (
              <div key={admin.id} className="px-6 py-4 flex items-center justify-between hover:bg-green-50 hover:bg-opacity-30 transition-colors duration-200">
                <div>
                  <h5 className="text-lg font-bold text-gray-900">{admin.name || admin.username}</h5>
                  <p className="text-sm text-gray-500">@{admin.username}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Sub-Admin
                    </span>
                    <span className="text-xs text-gray-400">
                      Created {new Date(admin.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right text-sm">
                    <div className="text-gray-600">Permissions:</div>
                    <div className="text-green-600 font-medium">Bidding Only</div>
                  </div>
                  
                  {userRole === 'super-admin' && (
                    <button
                      onClick={() => initDeleteSubAdmin(admin)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-2">👥</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Sub-Admins</h4>
            <p className="text-gray-500">Create sub-admins to delegate bidding responsibilities</p>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-5">Delete Sub-Admin</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{deleteTarget?.name || deleteTarget?.username}</strong>? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3 space-x-3 flex justify-center">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSubAdmin}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">🔐 Role Permissions:</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p><strong>Super Admin:</strong> Full access - can manage everything including deleting sub-admins</p>
          <p><strong>Admin:</strong> Can configure auction, upload files, manage teams, create sub-admins</p>
          <p><strong>Sub-Admin:</strong> Can only perform bidding (place bids, sell players, mark unsold)</p>
        </div>
      </div>
    </div>
  );
};

export default SubAdminManagement;
