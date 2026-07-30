import { Bell, Search, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import './Topbar.css';

import { useAuth } from '../core/contexts/AuthContext';
import { useRegion } from '../core/contexts/RegionContext';
import type { AppRegion } from '../core/contexts/RegionContext';
import { useExchangeRates } from '../core/contexts/ExchangeRatesContext';

export function Topbar() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { region, setRegion } = useRegion();
  const { rates, refreshRates, isLoading } = useExchangeRates();
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarUpdate, setAvatarUpdate] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshRates();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    const handleAvatarUpdate = () => setAvatarUpdate(prev => prev + 1);
    window.addEventListener('avatar-updated', handleAvatarUpdate);

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRegionOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
    };
  }, []);

  const handleLanguageSelect = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsLangOpen(false);
  };

  const getRegionLabel = (r: AppRegion) => {
    if (r === 'all') return t('region.all', 'Tüm Şubeler');
    if (r === 'Türkiye') return t('region.turkey', 'Türkiye 🇹🇷');
    return t('region.saudi', 'Arabistan 🇸🇦');
  };

  const handleRegionSelect = (r: AppRegion) => {
    setRegion(r);
    setIsRegionOpen(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder={t('common.search')} className="search-input" />
        <span className="search-shortcut">Ctrl+K</span>
      </div>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('dashboard.currentExchange', 'Güncel Kur:')}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-primary)' }}>₺</span> {(rates['TRY'] || 0).toFixed(2)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-primary)' }}>ر.س</span> {(rates['SAR'] || 0).toFixed(2)}
          </span>
          <button 
            onClick={handleRefresh} 
            disabled={isLoading || isRefreshing}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
            title={t('topbar.updateRates', 'Kurları Güncelle')}
          >
            <RefreshCw size={14} className={(isLoading || isRefreshing) ? 'spin-animation' : ''} style={{ transition: 'color 0.2s' }} />
          </button>
        </div>

        <div className="company-selector" ref={langDropdownRef} onClick={() => setIsLangOpen(!isLangOpen)} style={{ position: 'relative', background: 'var(--bg-tertiary)' }}>
          <div className="company-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="company-name" style={{ fontSize: '13px', fontWeight: 'bold' }}>{i18n.language.toUpperCase()}</span>
          </div>
          <ChevronDown size={14} className="text-muted" style={{ transform: isLangOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          
          {isLangOpen && (
            <div className="region-dropdown fade-in" style={{ width: '120px', left: 0, right: 'auto' }}>
              <div 
                className={`region-option ${i18n.language === 'tr' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleLanguageSelect('tr'); }}
              >
                <span>Türkçe (TR)</span>
                {i18n.language === 'tr' && <Check size={16} className="check-icon" />}
              </div>
              <div 
                className={`region-option ${i18n.language === 'en' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleLanguageSelect('en'); }}
              >
                <span>English (EN)</span>
                {i18n.language === 'en' && <Check size={16} className="check-icon" />}
              </div>
              <div 
                className={`region-option ${i18n.language === 'ar' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleLanguageSelect('ar'); }}
              >
                <span>العربية (AR)</span>
                {i18n.language === 'ar' && <Check size={16} className="check-icon" />}
              </div>
            </div>
          )}
        </div>

        <div className="company-selector" ref={dropdownRef} onClick={() => setIsRegionOpen(!isRegionOpen)} style={{ position: 'relative' }}>
          <div className="company-info">
            <span className="company-name">Barik Muhasebe</span>
            <span className="company-country">{getRegionLabel(region)}</span>
          </div>
          <ChevronDown size={16} className="text-muted" style={{ transform: isRegionOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          
          {isRegionOpen && (
            <div className="region-dropdown fade-in">
              <div 
                className={`region-option ${region === 'all' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleRegionSelect('all'); }}
              >
                <span>{t('region.all', 'Tüm Şubeler')}</span>
                {region === 'all' && <Check size={16} className="check-icon" />}
              </div>
              <div 
                className={`region-option ${region === 'Türkiye' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleRegionSelect('Türkiye'); }}
              >
                <span>{t('region.turkey', 'Türkiye 🇹🇷')}</span>
                {region === 'Türkiye' && <Check size={16} className="check-icon" />}
              </div>
              <div 
                className={`region-option ${region === 'Arabistan' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleRegionSelect('Arabistan'); }}
              >
                <span>{t('region.saudi', 'Arabistan 🇸🇦')}</span>
                {region === 'Arabistan' && <Check size={16} className="check-icon" />}
              </div>
            </div>
          )}
        </div>

        <NotificationBell />

        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || t('users.user', 'Kullanıcı')}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {user?.role === 'admin' ? t('users.roles.admin', 'Yönetici') : user?.role === 'editor' ? t('users.roles.editor', 'Veri Girişi') : t('users.roles.viewer', 'İzleyici')}
            </span>
          </div>
          <div className="avatar" style={{ overflow: 'hidden' }}>
            <img 
              src={localStorage.getItem(`barik_avatar_${user?.id}`) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || t('users.user', 'Kullanıcı'))}&background=3B82F6&color=fff`} 
              alt="User" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
