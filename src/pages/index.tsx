import Link from 'next/link';
import styles from '@/styles/pages.module.css';

export default function Home() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.pageTitle}>My Notebooks</h1>
        <div className={styles.authButtons}>
          <Link href="/auth/login" className={styles.button}>
            Login
          </Link>
          <Link href="/auth/register" className={styles.button}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}