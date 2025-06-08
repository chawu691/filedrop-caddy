
import React, { useState, useCallback, useEffect } from 'react';
import FileUpload from './components/FileUpload.tsx';
import AdminPage from './components/AdminPage.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFileLink, setUploadedFileLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'upload' | 'admin'>('upload');
  const [maxFileSizeMB, setMaxFileSizeMB] = useState<number>(20);

  const fileInputRef = React.useRef<HTMLInputElement>(null); // To be passed to FileUpload if needed for reset

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('upload');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch max file size configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          setMaxFileSizeMB(config.maxFileSizeMB);
        }
      } catch (err) {
        console.error('Failed to fetch config:', err);
      }
    };
    fetchConfig();
  }, []);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadedFileLink(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    resetState();

    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxFileSizeBytes) {
      setError(`File is too large. Max size is ${maxFileSizeMB}MB.`);
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    // Simulate progress for immediate feedback, backend handles actual upload
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress < 90) { // Stop before 100 to wait for backend confirmation
        setUploadProgress(progress);
      } else {
        clearInterval(progressInterval);
      }
    }, 150);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Add onUploadProgress listener if desired, though fetch doesn't directly support it well.
        // For true progress, XMLHttpRequest or a library like Axios would be better.
        // For now, we'll complete the simulated progress after fetch completes.
      });

      clearInterval(progressInterval); // Clear simulation

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      setUploadProgress(100); // Mark as complete
      setIsUploading(false);
      setUploadedFileLink(result.fileUrl); // Use the URL from backend
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setError(err.message || 'An unknown error occurred during upload.');
      setUploadProgress(0);
    }
  }, [resetState, maxFileSizeMB]);


  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        {currentView === 'upload' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 pt-10 sm:pt-16">
            <main className="bg-white shadow-2xl rounded-xl p-6 sm:p-10 w-full max-w-4xl text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-red-500 mb-8">
                Universal File Drop
              </h1>
              <FileUpload
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                uploadedFileLink={uploadedFileLink}
                error={error}
                onReset={resetState}
                maxFileSizeMB={maxFileSizeMB}
                fileInputRef={fileInputRef}
              />
            </main>
          </div>
        ) : (
          <AdminPage />
        )}
        <footer className="text-center text-xs text-gray-600 mt-auto py-4">
          <p>
            Community Project | Free to Use | Educational Purpose |
            <a href="#upload" onClick={() => setCurrentView('upload')} className="text-blue-600 hover:underline px-1">Upload</a> |
            <a href="#admin" onClick={() => setCurrentView('admin')} className="text-blue-600 hover:underline px-1">Admin Panel</a>
          </p>
          {currentView === 'upload' && <p>Files are uploaded to a server. Please be mindful of what you upload.</p>}
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
