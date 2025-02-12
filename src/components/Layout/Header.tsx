import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

type EmptyObject = Record<string, never>;

export type HeaderProps = EmptyObject;


export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white">
              Notebook App
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/notebooks" 
              className="text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
            >
              Notebooks
            </Link>
            <ThemeToggle />
            <Link 
              href="/auth/login" 
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};