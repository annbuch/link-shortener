import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPage.module.css';
import { Button } from '../Button/Button';
import { IconLink } from '../Icons/Icons';

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Ошибка авторизации';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>
            <IconLink width={24} height={24} />
          </span>
          <h1 className={styles.title}>Click.me</h1>
          <p className={styles.subtitle}>Сервис сокращения ссылок</p>
        </div>

        <div className={styles.tabs}>
          <button className={mode === 'login' ? styles.tabActive : styles.tab} onClick={() => setMode('login')}>Вход</button>
          <button className={mode === 'register' ? styles.tabActive : styles.tab} onClick={() => setMode('register')}>Регистрация</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className={styles.field}>
              <span className={styles.label}>Имя</span>
              <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" />
            </label>
          )}
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="mail@example.com" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Пароль</span>
            <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Минимум 6 символов" />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>
      </div>
    </div>
  );
}
