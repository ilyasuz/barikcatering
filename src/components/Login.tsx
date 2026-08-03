import { Hexagon, Lock, User, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Login.css';

import { useState } from 'react';
import { useAuth } from '../core/contexts/AuthContext';
import { hashPassword } from '../core/utils/cryptoUtils';

interface LoginProps {
  onLogin?: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const hashedPassword = await hashPassword(password);
      const finalEmail = email.includes('@') ? email : `${email}@barik.com`;
      const result = await login(finalEmail, hashedPassword);
      
      if (!result.success) {
        setError(result.error || t('login.failed', 'Giriş başarısız.'));
      } else {
        if (onLogin) onLogin();
      }
    } catch (err: any) {
      setError(t('login.error', 'Bir hata oluştu. Lütfen tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background decoration */}
      <div className="login-bg-blob blob-1"></div>
      <div className="login-bg-blob blob-2"></div>
      
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="Barik Muhasebe Logo" style={{ width: '110px', height: '110px', borderRadius: '20px', marginBottom: '16px', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }} />
          <h2>{t('login.title', 'Barik Muhasebe')}</h2>
          <p className="text-muted">{t('login.subtitle', 'Sisteme giriş yapmak için bilgilerinizi girin.')}</p>
        </div>
        
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: 'var(--error)',
            fontSize: '13px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('login.usernameOrEmail', 'Kullanıcı Adı veya E-posta')}</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                placeholder={t('login.usernamePlaceholder', 'ornek.kullanici')} 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>{t('login.passwordLabel', 'Şifre')}</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder={t('login.passwordPlaceholder', '••••••••')} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? t('login.signingIn', 'Giriş Yapılıyor...') : t('login.signInButton', 'Giriş Yap')}
          </button>
        </form>
      </div>
    </div>
  );
}
