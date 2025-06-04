
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AdminPage: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [auth, setAuth] = useState<{ user: string; pass: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [expiryDays, setExpiryDays] = useState<{ [key: string]: string }>({});

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
        setAuth(null); // Clear auth so user is prompted again
        setIsLoading(false);
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }
      const data = await response.json();
      setFiles(data);
      setError(null);
      setShowAuthModal(false); // Hide modal on successful fetch
    } catch (err: any) {
      setError(err.message);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth) {
        fetchFiles(auth);
    } else {
        setShowAuthModal(true);
        setIsLoading(false);
    }
  }, [auth, fetchFiles]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuth({ user: username, pass: password });
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

  if (showAuthModal) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div className="p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Authentication</h3>
          <form onSubmit={handleAuthSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Login
            </button>
             <p className="text-xs text-gray-500 mt-2">Demo credentials: admin / password</p>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading && !auth) { // Still show auth modal if loading and no auth yet.
      return <p>Authenticating...</p>; // Or a spinner
  }


  if (isLoading) return <p className="text-center text-lg">Loading admin data...</p>;
  // Error display for general errors after authentication
  if (error && !showAuthModal) return <p className="text-center text-red-500 text-lg">Error: {error}</p>;


  return (
    <div className="container mx-auto p-4 w-full max-w-4xl bg-white shadow-xl rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">Admin Panel - Uploaded Files</h1>
      {files.length === 0 ? (
        <p className="text-center text-gray-500">No files uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map(file => (
                <tr key={file.uniqueId}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a href={`/files/${file.uniqueId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                      {file.originalName}
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatFileSize(file.size)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(file.uploadedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {file.expiresAt ? new Date(file.expiresAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-y-1 md:space-y-0 md:space-x-1">
                    <div className="flex flex-col md:flex-row items-start md:items-center space-y-1 md:space-y-0 md:space-x-1">
                        <input 
                            type="number"
                            min="1"
                            placeholder="Days"
                            value={expiryDays[file.uniqueId] || ''}
                            onChange={(e) => handleExpiryInputChange(file.uniqueId, e.target.value)}
                            className="p-1 border rounded text-xs w-20 focus:ring-indigo-500 focus:border-indigo-500"
                            aria-label={`Set expiry in days for ${file.originalName}`}
                        />
                        <button
                            onClick={() => handleSetExpiry(file.uniqueId)}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                            Set Exp
                        </button>
                        <button
                            onClick={() => handleDelete(file.uniqueId)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-400"
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
  );
};

export default AdminPage;
