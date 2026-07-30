import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Trash2, AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNotifications, type NotificationRecord } from '../core/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const prevUnreadCount = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
        oscillator.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // ignore audio errors (e.g. autoplay policies)
      }
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: NotificationRecord) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    
    // Eski bildirimlerde link '/income' şeklindeyse related_id ekleyerek detaya yönlendir
    let targetLink = notif.link;
    if (targetLink === '/income' && notif.related_id) {
      targetLink = `/income/${notif.related_id}`;
    } else if (targetLink === '/expenses' && notif.related_id) {
      targetLink = `/expenses/${notif.related_id}`;
    } else if (targetLink === '/companies' && notif.related_id) {
      targetLink = `/companies/${notif.related_id}`;
    }

    if (targetLink) {
      navigate(targetLink);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} color="var(--warning)" />;
      case 'error': return <AlertCircle size={16} color="var(--danger)" />;
      case 'success': return <CheckCircle2 size={16} color="var(--success)" />;
      default: return <Info size={16} color="var(--accent)" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className="icon-button notification-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', top: '-2px', right: '-2px', 
            backgroundColor: '#EF4444', color: '#ffffff', 
            fontSize: '10px', fontWeight: 'bold', 
            width: '18px', height: '18px', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-primary)',
            zIndex: 10,
            boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fade-in" style={{
          position: 'absolute', top: '100%', right: '0', marginTop: '12px',
          width: '320px', backgroundColor: 'rgba(17, 24, 39, 0.95)', 
          backdropFilter: 'blur(8px)',
          borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)', 
          zIndex: 100, overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#F3F4F6' }}>{t('notifications.title', 'Bildirimler')}</h3>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Check size={14} /> {t('notifications.markAllAsRead', 'Tümünü Okundu İşaretle')}
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Bell size={32} style={{ opacity: 0.2, margin: '0 auto 12px auto', display: 'block' }} />
                {t('notifications.empty', 'Henüz bir bildiriminiz yok.')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{ 
                      padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: notif.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.1)',
                      cursor: notif.link ? 'pointer' : 'default',
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {getIcon(notif.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: notif.is_read ? 500 : 600, color: notif.is_read ? '#D1D5DB' : '#F9FAFB', marginBottom: '4px' }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.4, marginBottom: '8px' }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        {new Date(notif.created_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {!notif.is_read && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#60A5FA', flexShrink: 0, marginTop: '6px', boxShadow: '0 0 6px rgba(96, 165, 250, 0.6)' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0, 0, 0, 0.2)', textAlign: 'center' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); clearAll(); setIsOpen(false); }}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}
              >
                <Trash2 size={14} /> {t('notifications.clearHistory', 'Geçmişi Temizle')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
