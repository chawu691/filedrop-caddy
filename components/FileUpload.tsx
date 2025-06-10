
import React, { useRef, useState, useCallback, useEffect } from 'react';
import UploadIcon from './UploadIcon.tsx';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  isUploading: boolean;
  uploadProgress: number;
  uploadedFileLink: string | null;
  error: string | null;
  onReset: () => void;
  maxFileSizeMB: number;
  fileInputRef?: React.RefObject<HTMLInputElement>; // Optional, for external reset
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFile,
  isUploading,
  uploadProgress,
  uploadedFileLink,
  error,
  onReset,
  maxFileSizeMB,
  fileInputRef: externalFileInputRef
}) => {
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = externalFileInputRef || internalFileInputRef;

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading || uploadedFileLink || error) return;
    setIsDragging(true);
  }, [isUploading, uploadedFileLink, error]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading || uploadedFileLink || error) {
        e.dataTransfer.dropEffect = 'none';
    } else {
        e.dataTransfer.dropEffect = 'copy';
    }
  }, [isUploading, uploadedFileLink, error]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading || uploadedFileLink || error) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onFileSelect, isUploading, uploadedFileLink, error]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (isUploading || uploadedFileLink || error) return;
    fileInputRef.current?.click();
  };

  const copyToClipboard = useCallback((linkType: 'direct' | 'download' = 'direct') => {
    if (uploadedFileLink) {
      // Create different URL types based on the linkType parameter
      let urlToCopy: string;
      if (linkType === 'download') {
        urlToCopy = window.location.origin + uploadedFileLink + '?download=true';
      } else {
        urlToCopy = window.location.origin + uploadedFileLink;
      }

      navigator.clipboard.writeText(urlToCopy).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }).catch(err => console.error('Failed to copy: ', err));
    }
  }, [uploadedFileLink]);

  useEffect(() => {
    setLinkCopied(false);
  }, [uploadedFileLink]);

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-semibold text-lg mb-4">Upload Error</p>
        <p className="text-red-500 mb-6">{error}</p>
        <button
          onClick={onReset}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
          aria-label="Try again after error"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (uploadedFileLink) {
    const directUrl = window.location.origin + uploadedFileLink;
    const downloadUrl = window.location.origin + uploadedFileLink + '?download=true';

    return (
      <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-xl font-semibold text-green-700 mb-3">File Uploaded Successfully!</h2>

        {/* Direct Link Section */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">🔗 Direct Link (for embedding in web pages):</p>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <input
                type="text"
                value={directUrl}
                readOnly
                className="w-full flex-grow p-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Direct file link"
            />
            <button
                onClick={() => copyToClipboard('direct')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 whitespace-nowrap"
                aria-label={linkCopied ? 'Link copied to clipboard' : 'Copy direct link to clipboard'}
            >
                {linkCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Download Link Section */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">⬇️ Download Link (forces file download):</p>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <input
                type="text"
                value={downloadUrl}
                readOnly
                className="w-full flex-grow p-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Download file link"
            />
            <button
                onClick={() => copyToClipboard('download')}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 whitespace-nowrap"
                aria-label="Copy download link to clipboard"
            >
                Copy
            </button>
          </div>
        </div>

        {/* Preview/Test Link */}
        <div className="mb-4">
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
          >
            🔍 Preview File
          </a>
        </div>

        <button
          onClick={onReset}
          className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
          aria-label="Upload another file"
        >
          Upload Another File
        </button>
      </div>
    );
  }

  if (isUploading && selectedFile) {
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Uploading...</h2>
        <p className="text-sm text-gray-600 truncate w-full max-w-xs mx-auto" title={selectedFile.name}>{selectedFile.name}</p>
        <p className="text-xs text-gray-500 mb-4">{formatFileSize(selectedFile.size)}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 my-4" aria-label="Upload progress bar container">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-150 ease-out"
            style={{ width: `${uploadProgress}%` }}
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Upload progress: ${uploadProgress}%`}
          ></div>
        </div>
        <p className="text-lg font-semibold text-blue-600">{uploadProgress}%</p>
      </div>
    );
  }

  return (
    <div
      className={`p-6 sm:p-10 border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out 
        ${isDragging ? 'border-blue-600 bg-blue-100 scale-105' : 'border-blue-400 bg-blue-50 hover:bg-blue-100 hover:border-blue-500'}
        ${(isUploading || uploadedFileLink || error) ? 'cursor-default' : 'cursor-pointer'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={triggerFileInput}
      role="button"
      tabIndex={0}
      aria-label="File upload area"
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileInput(); }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        disabled={isUploading || !!uploadedFileLink || !!error}
      />
      <UploadIcon />
      <p className="text-gray-700 font-medium text-sm sm:text-base mb-1">
        Drag & drop files here or click to select
      </p>
      <p className="text-xs text-gray-500 mb-6">
        Supports any file up to {maxFileSizeMB}MB
      </p>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); triggerFileInput();}}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-8 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 text-sm sm:text-base"
        disabled={isUploading || !!uploadedFileLink || !!error}
        aria-label="Select file to upload"
      >
        Select File
      </button>
    </div>
  );
};

export default FileUpload;
