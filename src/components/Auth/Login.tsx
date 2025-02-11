import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '@/styles/auth.module.css';
import { Alert } from '@/components/common/Alert';

export const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid credentials');
        return;
      }

      setSuccess('Login successful! Redirecting...');
      
      // Store token
      localStorage.setItem('token', data.token);
      
      setFormData({
        email: '',
        password: '',
      });

      setTimeout(() => {
        router.push('/notebooks');
      }, 1500);

    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Sign in to your account</h2>

        {error && (
          <Alert 
            message={error} 
            type="error" 
            onClose={() => setError('')}
          />
        )}

        {success && (
          <Alert 
            message={success} 
            type="success" 
            onClose={() => setSuccess('')}
          />
        )}

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            className={styles.input}
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            className={styles.input}
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          className={`${styles.button} ${loading ? styles.loading : ''}`}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className={styles.link}>
          <Link href="/auth/register">
            Don't have an account? Sign up
          </Link>
        </div>
      </form>
    </div>
  );
};