import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import styles from './NotebookList.module.css';
import { Alert } from '@/components/common/Alert';


interface User {
  _id: string;
  name: string;
  email: string;
}

interface Notebook {
  _id: string;
  title: string;
  content: string;
  createdBy: string;
  user: User;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
}

export const NotebookList: React.FC = () => {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [filteredNotebooks, setFilteredNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showOnlyMyNotebooks, setShowOnlyMyNotebooks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [alert, setAlert] = useState<{
    message: string;
    type: 'error' | 'success' | 'info';
  } | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotebooks();
    }
  }, [currentUser]);

  useEffect(() => {
    filterNotebooks();
  }, [notebooks, showOnlyMyNotebooks, searchQuery]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
      } else {
        throw new Error(data.message || 'Failed to fetch user');
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError('Failed to authenticate user');
      router.push('/auth/login');
    }
  };

  const fetchNotebooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notebooks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        const notebooksWithOwnership = data.notebooks.map((notebook: Notebook) => ({
          ...notebook,
          isOwner: notebook.createdBy === currentUser?.email || 
                   notebook.user?._id === currentUser?._id
        }));
        setNotebooks(notebooksWithOwnership);
      } else {
        throw new Error(data.message || 'Failed to fetch notebooks');
      }
    } catch (err) {
      console.error('Error fetching notebooks:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadNotebook = async (notebook: Notebook, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    
    try {
      // First, navigate to the notebook page to get the canvas content
      const notebookWindow = window.open(`/notebooks/${notebook._id}`, '_blank');
      
      if (!notebookWindow) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }
  
    
      await new Promise<void>((resolve) => {
        notebookWindow.onload = () => {
          setTimeout(async () => {
            try {
              const pdf = new jsPDF('p', 'mm', 'a4');
              const pageWidth = pdf.internal.pageSize.getWidth();
              const pageHeight = pdf.internal.pageSize.getHeight();
              
              
              pdf.setFontSize(24);
              pdf.text(notebook.title, 20, 20);
              
              
              if (notebook.content) {
                pdf.setFontSize(12);
                const splitText = pdf.splitTextToSize(notebook.content, pageWidth - 40);
                pdf.text(splitText, 20, 40);
              }
              
             
              const canvas = notebookWindow.document.querySelector('canvas') as HTMLCanvasElement;
              if (canvas) {
                
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                
                if (tempCtx) {
                  
                  tempCtx.fillStyle = 'white';
                  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                  
                  
                  tempCtx.drawImage(canvas, 0, 0);
                  
                  
                  pdf.addPage();
                  const canvasImage = tempCanvas.toDataURL('image/png', 1.0);
                  pdf.addImage(
                    canvasImage, 
                    'PNG', 
                    20, 
                    20, 
                    pageWidth - 40, 
                    (pageWidth - 40) * (canvas.height / canvas.width), 
                    '', 
                    'FAST'
                  );
                }
              }
              
              
              pdf.save(`${notebook.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
              
              
              notebookWindow.close();
              resolve();
            } catch (error) {
              console.error('Error processing canvas:', error);
              notebookWindow.close();
              throw error;
            }
          }, 1000); 
        };
      });
    } catch (err) {
      console.error('Error downloading notebook:', err);
      setError(err instanceof Error ? err.message : 'Failed to download notebook');
    } finally {
      setIsDownloading(false);
    }
  };

  const filterNotebooks = () => {
    let filtered = [...notebooks];
    
    if (showOnlyMyNotebooks) {
      filtered = filtered.filter(notebook => notebook.isOwner);
    }

    if (searchQuery) {
      filtered = filtered.filter(notebook => 
        notebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notebook.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredNotebooks(filtered);
  };

  const handleDeleteNotebook = async (notebookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this notebook?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/notebooks/${notebookId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete notebook');
        }

        if (data.success) {
          setNotebooks(notebooks.filter(notebook => notebook._id !== notebookId));
          setAlert({
            message: 'Notebook deleted successfully',
            type: 'success'
          });
        }
      } catch (err) {
        setAlert({
          message: err instanceof Error ? err.message : 'Failed to delete notebook',
          type: 'error'
        });
      }
    }
  };

  const handleCreateNotebook = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notebooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Untitled Notebook',
          createdBy: currentUser?.email,
          user: currentUser?._id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        router.push(`/notebooks/${data.notebook._id}`);
      } else {
        throw new Error(data.message || 'Failed to create notebook');
      }
    } catch (err) {
      console.error('Error creating notebook:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      <div className={styles.header}>
        {currentUser && (
          <div className={styles.userInfo}>
            Welcome, {currentUser.name || currentUser.email}
          </div>
        )}
        <button 
          onClick={handleCreateNotebook} 
          className={styles.addButton}
          title="Create new notebook"
        >
          + New Notebook
        </button>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search notebooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>
        
        <div className={styles.filterOptions}>
          <button
            className={`${styles.filterButton} ${showOnlyMyNotebooks ? styles.active : ''}`}
            onClick={() => setShowOnlyMyNotebooks(!showOnlyMyNotebooks)}
          >
            {showOnlyMyNotebooks ? '📓 My Notebooks' : '📚 All Notebooks'}
          </button>
        </div>
      </div>

      {filteredNotebooks.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            {searchQuery 
              ? 'No notebooks found matching your search.'
              : showOnlyMyNotebooks 
                ? 'You haven\'t created any notebooks yet.'
                : 'No notebooks available.'}
          </p>
        </div>
      ) : (
        <div className={styles.notebookList}>
          {filteredNotebooks.map((notebook) => (
            <div
              key={notebook._id}
              className={styles.notebookCard}
              data-notebook-id={notebook._id}
              onClick={() => router.push(`/notebooks/${notebook._id}`)}
            >
              <div className={styles.notebookHeader}>
                <h3 className={styles.notebookTitle}>{notebook.title}</h3>
                <div className={styles.buttonGroup}>
                  <button 
                    onClick={(e) => handleDownloadNotebook(notebook, e)}
                    className={`${styles.downloadButton} ${isDownloading ? styles.downloading : ''}`}
                    title="Download notebook as PDF"
                    disabled={isDownloading}
                  >
                    {isDownloading ? '⏳' : '📥'}
                  </button>
                  {notebook.isOwner && (
                    <button 
                      onClick={(e) => handleDeleteNotebook(notebook._id, e)}
                      className={styles.deleteButton}
                      title="Delete notebook"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.notebookMeta}>
                <div className={styles.createdBy}>
                  Created by: {notebook.user?.email || notebook.createdBy || 'Anonymous'}
                </div>
                <div className={styles.dateInfo}>
                  <div>Created: {new Date(notebook.createdAt).toLocaleDateString()}</div>
                  <div>Updated: {new Date(notebook.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
              {notebook.isOwner && (
                <div className={styles.ownerBadge}>
                  Owner
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};