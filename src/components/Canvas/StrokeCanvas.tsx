import React, { useRef, useState, useEffect } from 'react';
import debounce from 'lodash/debounce';
import { Point, Stroke } from '@/types/Notebook';
import styles from './Canvas.module.css';

interface StrokeCanvasProps {
  onStrokesChange?: (strokes: Stroke[]) => void;
  initialStrokes?: Stroke[];
}

export const StrokeCanvas: React.FC<StrokeCanvasProps> = ({
  onStrokesChange,
  initialStrokes = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  const [previousStrokes, setPreviousStrokes] = useState<Stroke[]>([]);

  // Autosave configuration
  const AUTOSAVE_KEY = 'canvas_autosave';

  // Initialize with initial strokes or load from autosave
  useEffect(() => {
    if (initialStrokes.length > 0) {
      setStrokes(initialStrokes);
    } else {
      const savedStrokes = localStorage.getItem(AUTOSAVE_KEY);
      if (savedStrokes) {
        try {
          const parsedStrokes = JSON.parse(savedStrokes);
          setStrokes(parsedStrokes);
        } catch (error) {
          console.error('Error loading autosaved strokes:', error);
        }
      }
    }
  }, [initialStrokes]);

  // Canvas initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
    };

    resizeCanvas();
    setContext(ctx);
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Create debounced autosave function
  const autosave = debounce((strokesToSave: Stroke[]) => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(strokesToSave));
      console.log('Canvas autosaved');
    } catch (error) {
      console.error('Error autosaving canvas:', error);
    }
  }, 1000);

  // Update autosave when strokes change
  useEffect(() => {
    if (strokes.length > 0) {
      autosave(strokes);
    } else {
      localStorage.removeItem(AUTOSAVE_KEY);
    }
  }, [strokes]);

  // Render strokes
  useEffect(() => {
    if (!context || !canvasRef.current) return;

    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    [...strokes, currentStroke].filter(Boolean).forEach(stroke => {
      if (!stroke || stroke.points.length < 2) return;

      context.beginPath();
      context.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      stroke.points.forEach(point => {
        context.lineTo(point.x, point.y);
      });

      if (stroke.type === 'erase') {
        context.globalCompositeOperation = 'destination-out';
        context.lineWidth = 20;
      } else {
        context.globalCompositeOperation = 'source-over';
        context.lineWidth = 2;
      }
      
      context.stroke();
      context.globalCompositeOperation = 'source-over';
    });
  }, [strokes, currentStroke, context]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getPoint(e);
    if (!point) return;

    setIsDrawing(true);
    setCurrentStroke({
      points: [point],
      type: mode
    });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !currentStroke) return;

    const point = getPoint(e);
    if (!point) return;

    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, point]
    });
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!currentStroke) return;

    if (currentStroke.points.length > 1) {
      const newStrokes = [...strokes, currentStroke];
      setPreviousStrokes(strokes); // Save current state for undo
      setStrokes(newStrokes);
      onStrokesChange?.(newStrokes);
    }

    setIsDrawing(false);
    setCurrentStroke(null);
  };

  const handleCancel = () => {
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  const undo = () => {
    if (strokes.length > 0) {
      setStrokes(previousStrokes);
      onStrokesChange?.(previousStrokes);
      console.log('Undo successful');
    }
  };

  const clearCanvas = () => {
    setPreviousStrokes(strokes); // Save current state for undo
    setStrokes([]);
    onStrokesChange?.([]);
    localStorage.removeItem(AUTOSAVE_KEY);
    console.log('Canvas cleared');
  };

  const toggleMode = () => {
    setMode(mode === 'draw' ? 'erase' : 'draw');
    console.log('Mode changed:', mode === 'draw' ? 'erase' : 'draw');
  };

  return (
    <div className={styles.canvasContainer}>
      <div className={styles.toolbar}>
        <button 
          onClick={toggleMode}
          className={`${styles.toolButton} ${mode === 'erase' ? styles.active : ''}`}
          title={mode === 'draw' ? 'Switch to eraser' : 'Switch to pen'}
        >
          {mode === 'draw' ? '✏️' : '🧹'}
        </button>
        <button 
          onClick={undo}
          className={styles.toolButton}
          title="Undo"
        >
          ↩️
        </button>
        <button 
          onClick={clearCanvas}
          className={styles.toolButton}
          title="Clear canvas"
        >
          🗑️
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleCancel}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleCancel}
      />
    </div>
  );
};