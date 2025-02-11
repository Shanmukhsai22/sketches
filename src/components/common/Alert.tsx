import styles from './Alert.module.css';

interface AlertProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose?: () => void;
}

export const Alert = ({ message, type = 'error', onClose }: AlertProps) => {
  return (
    <div className={`${styles.alert} ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className={styles.closeButton}>
          ×
        </button>
      )}
    </div>
  );
};