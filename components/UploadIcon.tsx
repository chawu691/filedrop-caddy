
import React from 'react';

// Custom upload icon with gradient background
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto mb-6"
    {...props}
  >
    <defs>
      <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: "rgb(0,122,255)", stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: "rgb(90,200,250)", stopOpacity: 1}} />
      </linearGradient>
    </defs>
    {/* Rounded rectangle background with gradient */}
    <rect width="200" height="200" rx="40" ry="40" fill="url(#backgroundGradient)"/>
    {/* Upload icon */}
    <path
      d="M 100 40 L 100 135 M 70 85 L 100 40 L 130 85 M 45 145 Q 45 170 65 170 H 135 Q 155 170 155 145"
      stroke="#ffffff"
      strokeWidth="15"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default UploadIcon;
