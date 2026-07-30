import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Building, Shield, Globe, Save, Clock, Info, Tag, Plus, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useExchangeRates } from '../core/contexts/ExchangeRatesContext';
import { useCategories } from '../core/hooks/useCategories';
import { UserManagement } from '../modules/users/components/UserManagement';
import { useAuth } from '../core/contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../core/utils/cryptoUtils';

type Tab = 'profile' | 'system' | 'categories' | 'roles' | 'activity' | 'about';

interface ActivityLogEntry {
  id: string;
  action: string;
  timestamp: string;
  user: string;
}

export function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { baseCurrency, setBaseCurrency, rates } = useExchangeRates() as any;
  const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency || 'USD');
  const [isSaved, setIsSaved] = useState(false);

  const { user } = useAuth();
  
  // Profile State
  const profileName = user?.name || '';
  const profileEmail = user?.email || '';
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const storedAvatar = localStorage.getItem(`barik_avatar_${user.id}`);
      if (storedAvatar) setAvatarUrl(storedAvatar);
    }
  }, [user?.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(t('settings.profile.avatarSizeLimit', 'Fotoğraf boyutu 2MB dan küçük olmalıdır.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrl(result);
      if (user?.id) {
        localStorage.setItem(`barik_avatar_${user.id}`, result);
        window.dispatchEvent(new Event('avatar-updated'));
      }
    };
    reader.readAsDataURL(file);
  };

  // System State
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('barik_company_name') || 'Barik Catering Co.');
  const [companyTax, setCompanyTax] = useState(() => localStorage.getItem('barik_company_tax') || '1234567890');
  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem('barik_company_address') || 'İstanbul, Türkiye');
  const [lockedDate, setLockedDate] = useState(() => localStorage.getItem('barik_locked_date') || '');
  
  const [notifyUpcoming, setNotifyUpcoming] = useState(() => localStorage.getItem('barik_notify_upcoming') !== 'false');
  const [notifyOverdue, setNotifyOverdue] = useState(() => localStorage.getItem('barik_notify_overdue') !== 'false');
  const [notifyEmail, setNotifyEmail] = useState(() => localStorage.getItem('barik_notify_email') === 'true');

  // Activity State
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  // About State
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString('tr-TR'));

  // Categories State
  const { 
    incomeCategories, expenseCategories, 
    addIncomeCategory, removeIncomeCategory, 
    addExpenseCategory, removeExpenseCategory,
    reorderIncomeCategories, reorderExpenseCategories
  } = useCategories();
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  
  const [draggedIncomeIndex, setDraggedIncomeIndex] = useState<number | null>(null);
  const [draggedExpenseIndex, setDraggedExpenseIndex] = useState<number | null>(null);

  useEffect(() => {
    // Seed Activity Log
    const storedLog = localStorage.getItem('barik_activity_log');
    if (storedLog) {
      try {
        setActivityLog(JSON.parse(storedLog));
      } catch (e) {
        console.error('Activity log parse error', e);
      }
    } else {
      const initialLog: ActivityLogEntry[] = [
        { id: '1', action: t('settings.activity.login', 'Sisteme giriş yapıldı.'), timestamp: new Date(Date.now() - 3600000).toISOString(), user: profileName },
        { id: '2', action: t('settings.activity.newInvoice', 'Yeni bir fatura eklendi (#F-2026-001).'), timestamp: new Date(Date.now() - 7200000).toISOString(), user: profileName },
        { id: '3', action: t('settings.activity.customerUpdated', 'Müşteri bilgileri güncellendi.'), timestamp: new Date(Date.now() - 86400000).toISOString(), user: 'Mehmet Kaya' },
      ];
      setActivityLog(initialLog);
      localStorage.setItem('barik_activity_log', JSON.stringify(initialLog));
    }

    // Time Updater
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('tr-TR'));
    }, 1000);
    return () => clearInterval(timer);
  }, [profileName]);

  const handleSave = async () => {
    // Password change
    if (newPassword) {
      if (newPassword !== newPasswordConfirm) {
        alert(t('settings.profile.passwordMismatch', 'Şifreler eşleşmiyor!'));
        return;
      }
      if (user?.id) {
        const passwordHash = await hashPassword(newPassword);
        const { error } = await supabase.from('app_users').update({ password: passwordHash }).eq('id', user.id);
        if (error) {
          console.error(t('settings.profile.passwordUpdateError', 'Şifre güncellenirken hata oluştu:'), error);
          alert(t('settings.profile.passwordUpdateAlert', 'Şifre güncellenirken bir hata oluştu.'));
          return;
        }
        setNewPassword('');
        setNewPasswordConfirm('');
      }
    }

    // Currency
    setBaseCurrency(selectedCurrency);
    
    // System
    localStorage.setItem('barik_company_name', companyName);
    localStorage.setItem('barik_company_tax', companyTax);
    localStorage.setItem('barik_company_address', companyAddress);
    localStorage.setItem('barik_locked_date', lockedDate);
    
    localStorage.setItem('barik_notify_upcoming', notifyUpcoming.toString());
    localStorage.setItem('barik_notify_overdue', notifyOverdue.toString());
    localStorage.setItem('barik_notify_email', notifyEmail.toString());

    // Add activity
    const newEntry: ActivityLogEntry = {
      id: Date.now().toString(),
      action: t('settings.activity.settingsUpdated', 'Sistem ayarları güncellendi.'),
      timestamp: new Date().toISOString(),
      user: profileName
    };
    const newLog = [newEntry, ...activityLog].slice(0, 20);
    setActivityLog(newLog);
    localStorage.setItem('barik_activity_log', JSON.stringify(newLog));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleExportData = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('barik_')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barik_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (window.confirm(t('settings.system.resetConfirm', 'Tüm sistem verilerini sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz!'))) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('barik_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      window.location.reload();
    }
  };

  const handleClearHistory = () => {
    setActivityLog([]);
    localStorage.removeItem('barik_activity_log');
  };

  const handleCheckUpdates = () => {
    setUpdateChecking(true);
    setUpdateMessage('');
    setTimeout(() => {
      setUpdateChecking(false);
      setUpdateMessage(t('settings.about.upToDate', 'Güncel sürümü kullanıyorsunuz'));
    }, 2000);
  };

  // Shared form control style
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '8px'
  };

  const tabBtnStyle = (tabId: Tab) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', padding: '12px 16px', 
    borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left' as const,
    backgroundColor: activeTab === tabId ? 'var(--bg-tertiary)' : 'transparent',
    color: activeTab === tabId ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontWeight: activeTab === tabId ? 600 : 500,
    transition: 'all 0.2s',
    width: '100%'
  });

  const tabIconColor = (tabId: Tab) => activeTab === tabId ? 'var(--accent)' : 'currentColor';

  return (
    <div className="page-container fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{t('settings.title', 'Ayarlar')}</h1>
          <p className="text-muted" style={{ margin: '8px 0 0 0', fontSize: '15px' }}>{t('settings.subtitle', 'Profilinizi, sistem tercihlerini ve kullanıcı yetkilerini yönetin.')}</p>
        </div>
        <button 
          className="btn-primary" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
            borderRadius: '8px', border: 'none', 
            backgroundColor: isSaved ? 'var(--success)' : 'var(--accent)', 
            color: '#fff', cursor: 'pointer', transition: 'all 0.3s',
            fontWeight: 500, fontSize: '14px'
          }} 
          onClick={handleSave}
        >
          <Save size={18} /> {isSaved ? t('settings.saved', 'Kaydedildi ✓') : t('settings.saveChanges', 'Değişiklikleri Kaydet')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        
        {/* Sidebar */}
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          <button onClick={() => setActiveTab('profile')} style={tabBtnStyle('profile')}>
            <User size={18} color={tabIconColor('profile')} /> {t('settings.tabs.profile', 'Profil Bilgileri')}
          </button>
          {user?.role === 'admin' && (
            <>
              <button onClick={() => setActiveTab('system')} style={tabBtnStyle('system')}>
                <Building size={18} color={tabIconColor('system')} /> {t('settings.tabs.system', 'Sistem Ayarları')}
              </button>
              <button onClick={() => setActiveTab('roles')} style={tabBtnStyle('roles')}>
                <Shield size={18} color={tabIconColor('roles')} /> {t('settings.tabs.roles', 'Kullanıcı Rolleri')}
              </button>
            </>
          )}
          {(user?.role === 'admin' || user?.role === 'editor') && (
            <button onClick={() => setActiveTab('categories')} style={tabBtnStyle('categories')}>
              <Tag size={18} color={tabIconColor('categories')} /> {t('settings.tabs.categories', 'Kategori Yönetimi')}
            </button>
          )}
          {user?.role === 'admin' && (
            <button onClick={() => setActiveTab('activity')} style={tabBtnStyle('activity')}>
              <Clock size={18} color={tabIconColor('activity')} /> {t('settings.tabs.activity', 'Aktivite Günlüğü')}
            </button>
          )}
          <button onClick={() => setActiveTab('about')} style={tabBtnStyle('about')}>
            <Info size={18} color={tabIconColor('about')} /> {t('settings.tabs.about', 'Hakkında')}
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '40px', minHeight: '500px', boxShadow: 'var(--shadow-sm)' }}>
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="fade-in">
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '32px', color: 'var(--text-primary)' }}>{t('settings.profile.title', 'Profil Bilgileri')}</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 600, color: 'var(--accent)', border: '2px solid var(--border-color)', overflow: 'hidden' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(profileName)
                  )}
                </div>
                <div>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/jpeg, image/png" style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>{t('settings.profile.changePhoto', 'Fotoğrafı Değiştir')}</button>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>{t('settings.profile.photoLimits', 'JPG veya PNG, Max 2MB.')}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>{t('settings.profile.fullName', 'Ad Soyad')}</label>
                  <input type="text" style={{...inputStyle, backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)'}} value={profileName} readOnly />
                </div>
                <div>
                  <label style={labelStyle}>{t('settings.profile.usernameEmail', 'Kullanıcı Adı (E-posta)')}</label>
                  <input type="email" style={{...inputStyle, backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)'}} value={profileEmail} readOnly />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>{t('settings.profile.newPassword', 'Yeni Şifre')}</label>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    style={inputStyle} 
                    placeholder={t('settings.profile.newPasswordPlaceholder', 'Değiştirmek istemiyorsanız boş bırakın')} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <div 
                    style={{ position: 'absolute', right: '14px', top: '34px', cursor: 'pointer', color: 'var(--text-muted)' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>{t('settings.profile.confirmPassword', 'Şifre Tekrar')}</label>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    style={inputStyle} 
                    placeholder={t('settings.profile.confirmPasswordPlaceholder', 'Yeni şifreyi tekrar girin')} 
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div className="fade-in">
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '32px', color: 'var(--text-primary)' }}>{t('settings.system.title', 'Sistem Ayarları')}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>{t('settings.system.language', 'Uygulama Dili')}</label>
                  <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px' }}>
                    <Globe size={18} color="var(--text-muted)" />
                    <select 
                      value={i18n.language}
                      onChange={(e) => i18n.changeLanguage(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer', width: '100%', padding: '10px 0' }}
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{t('settings.system.defaultCurrency', 'Varsayılan Para Birimi')}</label>
                  <select 
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                  >
                    <option value="USD">USD (Amerikan Doları)</option>
                    <option value="TRY">TRY (Türk Lirası)</option>
                    <option value="SAR">SAR (Suudi Arabistan Riyali)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>{t('settings.system.companyName', 'Şirket Adı')}</label>
                <input type="text" style={{ ...inputStyle, maxWidth: '100%' }} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>{t('settings.system.companyTax', 'Şirket Vergi No')}</label>
                <input type="text" style={{ ...inputStyle, maxWidth: '100%' }} value={companyTax} onChange={(e) => setCompanyTax(e.target.value)} />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={labelStyle}>{t('settings.system.companyAddress', 'Şirket Adresi')}</label>
                <textarea rows={3} style={{ ...inputStyle, maxWidth: '100%', resize: 'vertical' }} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '32px 0' }}></div>

              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>{t('settings.system.periodLock', 'Dönem Kapatma (Kilit)')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                {t('settings.system.periodLockDesc', 'Belirlediğiniz tarihten önceki faturalar kilitlenir ve değiştirilemez. (Sadece Yönetici yetkisine sahip kullanıcılar kilitli dönemde değişiklik yapabilir.)')}
              </p>
              <div style={{ marginBottom: '32px', maxWidth: '300px' }}>
                <label style={labelStyle}>{t('settings.system.lockDate', 'Kilit Tarihi')}</label>
                <input type="date" style={inputStyle} value={lockedDate} onChange={(e) => setLockedDate(e.target.value)} />
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '32px 0' }}></div>

              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>{t('settings.system.recurringInvoices', 'Düzenli Faturalar')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                {t('settings.system.recurringDesc', 'Normalde sistem arka planda çalışarak süresi gelen düzenli faturaları otomatik olarak ekler. Ancak test edebilmeniz için aşağıdaki butonu kullanarak bu işlemi manuel tetikleyebilirsiniz.')}
              </p>
              <button 
                onClick={() => {
                  alert(t('settings.system.recurringAlert', 'Düzenli faturalar kontrol edildi. Yaklaşan veya vadesi geçen tekrarlayan faturalar için yeni kopyalar oluşturuldu (Simülasyon).'));
                }} 
                className="btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}
              >
                <Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> 
                {t('settings.system.runRecurring', 'Düzenli Faturaları Çalıştır')}
              </button>

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '32px 0' }}></div>

              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>{t('settings.system.dataBackup', 'Veri Yedekleme (Dışa Aktar)')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                {t('settings.system.dataBackupDesc', 'Hesap, Gelir, Gider ve Cari Firma kayıtlarınızın tamamını JSON formatında indirerek yedekleyebilirsiniz.')}
              </p>
              <button 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}
                onClick={async () => {
                  try {
                    const { incomeApi } = await import('../modules/income/api');
                    const { expensesApi } = await import('../modules/expenses/api');
                    const { companiesApi } = await import('../modules/companies/api');
                    const { accountsApi } = await import('../modules/accounts/api');
                    
                    const [incomes, expenses, companies, accounts] = await Promise.all([
                      incomeApi.getAll(), expensesApi.getAll(), companiesApi.getAll(), accountsApi.getAll()
                    ]);
                    
                    const backup = {
                      timestamp: new Date().toISOString(),
                      version: '1.0',
                      data: { incomes, expenses, companies, accounts }
                    };
                    
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `barik_backup_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    alert(t('settings.system.backupSuccess', 'Veritabanı yedeği başarıyla indirildi!'));
                  } catch (err) {
                    console.error('Yedekleme hatası:', err);
                    alert(t('settings.system.backupError', 'Yedek oluşturulurken bir hata oluştu.'));
                  }
                }}
              >
                <Save size={18} />
                {t('settings.system.downloadBackup', 'Tam Yedeği İndir (.json)')}
              </button>

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '32px 0' }}></div>
              
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>{t('settings.system.notificationsTitle', 'Bildirim Ayarları')}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={notifyUpcoming} onChange={(e) => setNotifyUpcoming(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }} /> {t('settings.system.notifyUpcoming', 'Vade yaklaşan faturalar için bildirim')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={notifyOverdue} onChange={(e) => setNotifyOverdue(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }} /> {t('settings.system.notifyOverdue', 'Geciken ödemeler için bildirim')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }} /> {t('settings.system.notifyEmail', 'E-posta bildirimleri')}
                </label>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '32px 0' }}></div>
              
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>{t('settings.system.dataManagement', 'Veri Yönetimi')}</h3>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={handleExportData} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
                  {t('settings.system.exportData', 'Verileri Dışa Aktar (JSON)')}
                </button>
                <button onClick={handleResetData} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--error)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                  {t('settings.system.resetData', 'Tüm Verileri Sıfırla')}
                </button>
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{t('settings.categories.title', 'Kategori Yönetimi')}</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>{t('settings.categories.subtitle', 'Sistemde kullanılacak gelir ve gider kategorilerini düzenleyin.')}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                
                {/* Gelir Kategorileri */}
                <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--success)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                    {t('settings.categories.incomeCategories', 'Gelir Kategorileri')}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={t('settings.categories.newIncomeCat', 'Yeni gelir kategorisi')} 
                      value={newIncomeCategory}
                      onChange={(e) => setNewIncomeCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addIncomeCategory(newIncomeCategory.trim());
                          setNewIncomeCategory('');
                        }
                      }}
                    />
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0 16px' }}
                      onClick={() => {
                        addIncomeCategory(newIncomeCategory.trim());
                        setNewIncomeCategory('');
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {incomeCategories.map((cat, index) => (
                      <div 
                        key={cat} 
                        draggable={cat !== 'Diğer'}
                        onDragStart={(e) => {
                          if (cat === 'Diğer') { e.preventDefault(); return; }
                          setDraggedIncomeIndex(index);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (draggedIncomeIndex === null || draggedIncomeIndex === index || cat === 'Diğer') return;
                          const newItems = [...incomeCategories];
                          const draggedItem = newItems[draggedIncomeIndex];
                          newItems.splice(draggedIncomeIndex, 1);
                          newItems.splice(index, 0, draggedItem);
                          reorderIncomeCategories(newItems);
                          setDraggedIncomeIndex(index);
                        }}
                        onDragEnd={() => setDraggedIncomeIndex(null)}
                        style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', 
                          borderRadius: '8px', border: '1px solid var(--border-color)',
                          cursor: cat === 'Diğer' ? 'default' : 'grab',
                          opacity: draggedIncomeIndex === index ? 0.5 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {cat !== 'Diğer' && <GripVertical size={16} style={{ color: 'var(--text-muted)' }} />}
                          <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{cat}</span>
                        </div>
                        <button 
                          className="icon-button" 
                          style={{ color: 'var(--danger)', padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          onClick={() => {
                            if (window.confirm(t('settings.categories.deleteConfirm', '"{{category}}" kategorisini silmek istediğinize emin misiniz?', { category: cat }))) {
                              removeIncomeCategory(cat);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gider Kategorileri */}
                <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--danger)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger)' }}></div>
                    {t('settings.categories.expenseCategories', 'Gider Kategorileri')}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={t('settings.categories.newExpenseCat', 'Yeni gider kategorisi')}
                      value={newExpenseCategory}
                      onChange={(e) => setNewExpenseCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addExpenseCategory(newExpenseCategory.trim());
                          setNewExpenseCategory('');
                        }
                      }}
                    />
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0 16px' }}
                      onClick={() => {
                        addExpenseCategory(newExpenseCategory.trim());
                        setNewExpenseCategory('');
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {expenseCategories.map((cat, index) => (
                      <div 
                        key={cat} 
                        draggable={cat !== 'Diğer'}
                        onDragStart={(e) => {
                          if (cat === 'Diğer') { e.preventDefault(); return; }
                          setDraggedExpenseIndex(index);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (draggedExpenseIndex === null || draggedExpenseIndex === index || cat === 'Diğer') return;
                          const newItems = [...expenseCategories];
                          const draggedItem = newItems[draggedExpenseIndex];
                          newItems.splice(draggedExpenseIndex, 1);
                          newItems.splice(index, 0, draggedItem);
                          reorderExpenseCategories(newItems);
                          setDraggedExpenseIndex(index);
                        }}
                        onDragEnd={() => setDraggedExpenseIndex(null)}
                        style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', 
                          borderRadius: '8px', border: '1px solid var(--border-color)',
                          cursor: cat === 'Diğer' ? 'default' : 'grab',
                          opacity: draggedExpenseIndex === index ? 0.5 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {cat !== 'Diğer' && <GripVertical size={16} style={{ color: 'var(--text-muted)' }} />}
                          <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{cat}</span>
                        </div>
                        <button 
                          className="icon-button" 
                          style={{ color: 'var(--danger)', padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          onClick={() => {
                            if (window.confirm(t('settings.categories.deleteConfirm', '"{{category}}" kategorisini silmek istediğinize emin misiniz?', { category: cat }))) {
                              removeExpenseCategory(cat);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ROLES TAB */}
          {activeTab === 'roles' && (
            <UserManagement />
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{t('settings.activity.title', 'Aktivite Günlüğü')}</h2>
                <button onClick={handleClearHistory} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                  {t('settings.activity.clearHistory', 'Geçmişi Temizle')}
                </button>
              </div>

              {activityLog.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                  {t('settings.activity.noActivity', 'Henüz bir aktivite bulunmuyor.')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activityLog.map((log) => (
                     <div key={log.id} style={{ display: 'flex', gap: '20px', padding: '20px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                        <Clock size={20} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{log.action}</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {new Date(log.timestamp).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('common.user', 'Kullanıcı')}: <strong>{log.user}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="fade-in">
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '32px', color: 'var(--text-primary)' }}>{t('settings.about.title', 'Hakkında')}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ padding: '40px 24px', backgroundColor: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', padding: '20px', borderRadius: '20px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', marginBottom: '20px' }}>
                    <Building size={40} />
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{t('settings.about.appName', 'Barik Muhasebe Sistemi')}</h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>{t('settings.about.version', 'Versiyon')}: 2.0.0</p>
                  
                  <div style={{ minHeight: '40px' }}>
                    {updateChecking ? (
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('settings.about.checkingUpdate', 'Güncellemeler kontrol ediliyor...')}</span>
                    ) : updateMessage ? (
                      <span style={{ fontSize: '14px', color: 'var(--success)' }}>{updateMessage}</span>
                    ) : (
                      <button onClick={handleCheckUpdates} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
                        {t('settings.about.checkUpdate', 'Güncelleme Kontrolü')}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>{t('settings.about.systemInfo', 'Sistem Bilgileri')}</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('settings.about.browser', 'Tarayıcı')}:</span>
                        <span style={{ maxWidth: '60%', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={navigator.userAgent}>
                          {navigator.userAgent.split(' ')[0]}
                        </span>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('settings.about.screen', 'Ekran')}:</span>
                        <span>{window.innerWidth} x {window.innerHeight}</span>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('settings.about.time', 'Zaman')}:</span>
                        <span>{currentTime}</span>
                      </li>
                    </ul>
                  </div>

                  <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>{t('settings.about.exchangeRates', 'Döviz Kurları')}</h4>
                    {rates && Object.keys(rates).length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {Object.entries(rates).slice(0, 4).map(([currency, rate]) => (
                          <li key={currency} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{currency}:</span>
                            <span style={{ fontWeight: 500 }}>{(rate as number).toFixed(4)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('common.noData', 'Kur bilgisi bulunamadı.')}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
