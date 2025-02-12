import { useState, useEffect } from 'react';
import { StrokeCanvas } from '../Canvas/StrokeCanvas';
import { Stroke } from '@/types/Notebook';
import styles from './NotebookEditor.module.css';
import { Alert } from '@/components/common/Alert';

interface NotebookEditorProps {
  notebookId?: string;
}

export const NotebookEditor: React.FC<NotebookEditorProps> = ({ notebookId }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    message: string;
    type: 'error' | 'success' | 'info';
  } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Reset state when notebookId changes
  useEffect(() => {
    setTitle('');
    setContent('');
    setStrokes([]);
    setError(null);
    setAlert(null);
    setIsInitialized(false);
  }, [notebookId]);

  useEffect(() => {
    if (notebookId && !isInitialized) {
      fetchNotebookData();
    }
  }, [notebookId, isInitialized]);

  const fetchNotebookData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/notebooks/${notebookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notebook');
      }

      const data = await response.json();
      if (data.success) {
        setTitle(data.notebook.title || '');
        setContent(data.notebook.content || '');
        if (data.notebook.strokes && Array.isArray(data.notebook.strokes)) {
          const formattedStrokes = data.notebook.strokes.map((stroke: Stroke) => ({
            ...stroke,
            type: stroke.type || 'draw'
          }));
          setStrokes(formattedStrokes);
        } else {
          setStrokes([]);
        }
        setIsInitialized(true);
      } else {
        throw new Error(data.message || 'Failed to fetch notebook');
      }
    } catch (error) {
      console.error('Error fetching notebook:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch notebook');
    }
  };

  const handleSave = async () => {
    if (!notebookId) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/notebooks/${notebookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          strokes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save notebook');
      }

      setAlert({
        message: 'Notebook saved successfully',
        type: 'success'
      });

      // Clear alert after 3 seconds
      setTimeout(() => {
        setAlert(null);
      }, 3000);

    } catch (error) {
      setAlert({
        message: error instanceof Error ? error.message : 'Failed to save notebook',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStrokesChange = async (newStrokes: Stroke[]) => {
    if (!notebookId) return;
    
    setStrokes(newStrokes);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/notebooks/${notebookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          strokes: newStrokes,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save strokes');
      }
    } catch (error) {
      console.error('Error saving strokes:', error);
      setError(error instanceof Error ? error.message : 'Failed to save strokes');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  return (
    <div className={styles.editor}>
      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      <div className={styles.header}>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleSave}
          className={styles.titleInput}
          placeholder="Notebook Title"
        />
        <button 
          onClick={handleSave}
          className={styles.saveButton}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.contentContainer}>
        <div className={styles.textSection}>
          <h3 className={styles.sectionTitle}>Text Notes</h3>
          <textarea
            value={content}
            onChange={handleContentChange}
            onBlur={handleSave}
            className={styles.textArea}
            placeholder="Start typing..."
          />
        </div>

        <div className={styles.drawingSection}>
          <h3 className={styles.sectionTitle}>Drawing</h3>
          <div className={styles.canvasContainer}>
            <StrokeCanvas 
              key={notebookId || 'new'}
              onStrokesChange={handleStrokesChange}
              initialStrokes={strokes}
              notebookId={notebookId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookEditor;