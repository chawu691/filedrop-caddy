
import React from 'react';

// Heroicons: cloud-arrow-up
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-16 h-16 mx-auto text-blue-500 mb-3" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3.75 3.75M12 9.75 8.25 11.25V9.75L12 3m0 0 3.75 3.75M12 3v3.75m0 0L8.25 9.75M12 12.75v3.75m0-10.5A5.25 5.25 0 0 0 6.75 7.5 5.25 5.25 0 0 0 1.5 12.75m18 0A5.25 5.25 0 0 0 17.25 7.5a5.25 5.25 0 0 0-5.25-5.25m0 0A5.25 5.25 0 0 0 6.75 7.5m0 0a4.5 4.5 0 0 0 4.5 4.5m4.5-4.5a4.5 4.5 0 0 1 4.5 4.5" />
  </svg>
);

export default UploadIcon;
