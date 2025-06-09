
import React, { useState, useEffect, useCallback } from 'react';

interface UploadedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uniqueId: string;
  uploadedAt: string;
  expiresAt?: string | null;
}

interface SystemStats {
  totalFiles: number;
  totalSize: number;
  avgSize: number;
  maxSize: number;
  minSize: number;
}

interface SystemSettings {
  maxFileSizeMB: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AdminPage: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [auth, setAuth] = useState<{ user: string; pass: string; expiresAt: number } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [expiryDays, setExpiryDays] = useState<{ [key: string]: string }>({});
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'settings' | 'stats'>('files');
  const [newMaxFileSize, setNewMaxFileSize] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load auth from localStorage on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        // Check if auth is still valid (24 hours)
        if (authData.expiresAt > Date.now()) {
          setAuth(authData);
          setShowAuthModal(false);
        } else {
          localStorage.removeItem('adminAuth');
        }
      } catch (error) {
        localStorage.removeItem('adminAuth');
      }
    }
  }, []);

  // Save auth to localStorage when it changes
  useEffect(() => {
    if (auth) {
      localStorage.setItem('adminAuth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('adminAuth');
    }
  }, [auth]);

  const fetchFiles = useCallback(async (currentAuth: {user: string, pass: string} | null) => {
    if (!currentAuth) {
        setError("Authentication required.");
        setIsLoading(false);
        setShowAuthModal(true);
        return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/files', {
        headers: {
          'Authorization': 'Basic ' + btoa(`${currentAuth.user}:${currentAuth.pass}`)
        }
      });
      if (response.status === 401) {
        setShowAuthModal(true);
        setError("Authentication failed. Please try again.");
        setAuth(null);
        setIsLoading(false);
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }
      const data = await response.json();
      setFiles(data);
      setError(null);
      setShowAuthModal(false);
    } catch (err: any) {
      setError(err.message);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (currentAuth: {user: string, pass: string} | null) => {
    if (!currentAuth) return;
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': 'Basic ' + btoa(`${currentAuth.user}:${currentAuth.pass}`)
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchSettings = useCallback(async (currentAuth: {user: string, pass: string} | null) => {
    if (!currentAuth) return;
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': 'Basic ' + btoa(`${currentAuth.user}:${currentAuth.pass}`)
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setNewMaxFileSize(data.maxFileSizeMB);
      }
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  useEffect(() => {
    if (auth) {
        fetchFiles(auth);
        fetchStats(auth);
        fetchSettings(auth);
    } else {
        setShowAuthModal(true);
        setIsLoading(false);
    }
  }, [auth, fetchFiles, fetchStats, fetchSettings]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    // Set auth with 24-hour expiration
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    setAuth({ user: username, pass: password, expiresAt });
  };

  const handleDelete = async (fileId: string) => {
    if (!auth) {
        setError("Authentication required to delete.");
        setShowAuthModal(true);
        return;
    }
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      const response = await fetch(`/api/admin/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa(`${auth.user}:${auth.pass}`)
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
            setError("Authentication failed.");
            setShowAuthModal(true);
            setAuth(null);
        } else {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to delete file');
        }
        return;
      }
      setFiles(files.filter(f => f.uniqueId !== fileId));
      // Refresh statistics after deletion
      fetchStats(auth);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSetExpiry = async (fileId: string) => {
    if (!auth) {
        setError("Authentication required to set expiry.");
        setShowAuthModal(true);
        return;
    }
    const days = parseInt(expiryDays[fileId] || '0', 10);
    if (isNaN(days) || days <= 0) {
        setError("Please enter a valid number of days for expiry.");
        return;
    }
    try {
      const response = await fetch(`/api/admin/files/${fileId}/expire`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${auth.user}:${auth.pass}`)
        },
        body: JSON.stringify({ expiresInDays: days })
      });
      if (!response.ok) {
         if (response.status === 401) {
            setError("Authentication failed.");
            setShowAuthModal(true);
            setAuth(null);
        } else {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to set expiry');
        }
        return;
      }
      // Refresh files to see updated expiry
      fetchFiles(auth);
      setExpiryDays(prev => ({...prev, [fileId]: ''})); // Clear input
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExpiryInputChange = (fileId: string, value: string) => {
    setExpiryDays(prev => ({ ...prev, [fileId]: value }));
  };

  // Batch operations
  const handleSelectFile = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
    setSelectAll(newSelected.size === filteredAndSortedFiles.length);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFileIds = new Set(filteredAndSortedFiles.map(f => f.uniqueId));
      setSelectedFiles(allFileIds);
    } else {
      setSelectedFiles(new Set());
    }
    setSelectAll(checked);
  };

  const handleBatchDelete = async () => {
    if (selectedFiles.size === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedFiles.size} selected files?`)) {
      return;
    }

    if (!auth) {
      setError("Authentication required to delete files.");
      setShowAuthModal(true);
      return;
    }

    const deletePromises = Array.from(selectedFiles).map(async (fileId) => {
      try {
        const response = await fetch(`/api/admin/files/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Basic ' + btoa(`${auth.user}:${auth.pass}`)
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to delete file ${fileId}`);
        }
        return fileId;
      } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
        return null;
      }
    });

    try {
      const results = await Promise.all(deletePromises);
      const successfulDeletes = results.filter(id => id !== null);

      // Update files list
      setFiles(files.filter(f => !successfulDeletes.includes(f.uniqueId)));
      setSelectedFiles(new Set());
      setSelectAll(false);

      // Refresh statistics
      fetchStats(auth);

      if (successfulDeletes.length < selectedFiles.size) {
        setError(`Successfully deleted ${successfulDeletes.length} files, but ${selectedFiles.size - successfulDeletes.length} failed.`);
      }
    } catch (error) {
      setError('Failed to delete selected files. Please try again.');
    }
  };

  const handleUpdateSettings = async () => {
    if (!auth) return;
    const maxSize = parseInt(newMaxFileSize, 10);
    if (isNaN(maxSize) || maxSize <= 0 || maxSize > 1000) {
      setError("Max file size must be between 1 and 1000 MB.");
      return;
    }

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${auth.user}:${auth.pass}`)
        },
        body: JSON.stringify({ maxFileSizeMB: maxSize })
      });

      if (response.ok) {
        setError(null);
        fetchSettings(auth);
        alert('Settings updated successfully!');
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to update settings');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter and sort files
  const filteredAndSortedFiles = files
    .filter(file =>
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.mimeType.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (showAuthModal) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-96 max-w-md mx-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h3>
            <p className="text-gray-600">Enter your credentials to access the admin panel</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading && !auth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your file upload system</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  window.location.hash = '#upload';
                  window.location.reload();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Upload
              </button>
              <button
                onClick={() => {
                  setAuth(null);
                  setShowAuthModal(true);
                  localStorage.removeItem('adminAuth');
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && !showAuthModal && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'files', name: 'Files', icon: '📁' },
                { id: 'stats', name: 'Statistics', icon: '📊' },
                { id: 'settings', name: 'Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Statistics</h2>
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📁</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Total Files</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalFiles}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">💾</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Total Storage</p>
                      <p className="text-2xl font-bold text-green-900">{formatFileSize(stats.totalSize)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📏</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">Average Size</p>
                      <p className="text-2xl font-bold text-purple-900">{formatFileSize(stats.avgSize)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">⬆️</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-orange-600">Largest File</p>
                      <p className="text-2xl font-bold text-orange-900">{formatFileSize(stats.maxSize)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">⬇️</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-indigo-600">Smallest File</p>
                      <p className="text-2xl font-bold text-indigo-900">{formatFileSize(stats.minSize)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading statistics...</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>
            {settings ? (
              <div className="w-full">
                <div className="mb-6 max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum File Size (MB)
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={newMaxFileSize}
                      onChange={(e) => setNewMaxFileSize(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter max file size"
                    />
                    <button
                      onClick={handleUpdateSettings}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Update
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Current: {settings.maxFileSizeMB} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading settings...</p>
              </div>
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Search and Filter Controls */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  {selectedFiles.size > 0 && (
                    <button
                      onClick={handleBatchDelete}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Delete Selected ({selectedFiles.size})
                    </button>
                  )}

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="name">Sort by Name</option>
                    <option value="size">Sort by Size</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Files List */}
            {filteredAndSortedFiles.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No files have been uploaded yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedFiles.map(file => (
                      <tr key={file.uniqueId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.uniqueId)}
                            onChange={(e) => handleSelectFile(file.uniqueId, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {file.originalName.split('.').pop()?.toUpperCase() || 'FILE'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                <a
                                  href={`/api/files/${file.uniqueId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                  title={file.originalName}
                                >
                                  {file.originalName}
                                </a>
                              </div>
                              <div className="text-sm text-gray-500">{file.mimeType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(file.uploadedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            file.expiresAt
                              ? new Date(file.expiresAt) < new Date()
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {file.expiresAt
                              ? new Date(file.expiresAt) < new Date()
                                ? 'Expired'
                                : formatDate(file.expiresAt)
                              : 'Never'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="1"
                              placeholder="Days"
                              value={expiryDays[file.uniqueId] || ''}
                              onChange={(e) => handleExpiryInputChange(file.uniqueId, e.target.value)}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleSetExpiry(file.uniqueId)}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Set
                            </button>
                            <button
                              onClick={() => handleDelete(file.uniqueId)}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
