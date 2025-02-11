import React from 'react';
import { NotebookList } from './NotebookList';
import styles from './NotebooksPage.module.css';

export const NotebooksPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Notebooks</h1>
        </div>
        <div className={styles.mainContent}>
          <NotebookList />
        </div>
      </div>
    </div>
  );
};