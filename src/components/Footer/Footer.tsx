import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full p-4 bg-gray-100 text-center text-gray-500 mt-8">
      <small>&copy; {new Date().getFullYear()} My Next App. All rights reserved.</small>
    </footer>
  );
}
