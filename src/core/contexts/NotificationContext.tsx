import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useRegion } from './RegionContext';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'error';
  is_read: boolean;
  link?: string;
  related_id?: string;
  created_at: string;
}

interface NotificationContextType {
  notifications: NotificationRecord[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  checkSystemAlerts: () => Promise<void>;
  addNotification: (notification: Partial<NotificationRecord>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { region } = useRegion();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Bildirimler alınamadı:', err);
    }
  };

  const addNotification = async (notification: Partial<NotificationRecord>) => {
    try {
      const { data, error } = await supabase.from('notifications').insert([{
        ...notification,
        is_read: false
      }]).select().single();
      if (error) throw error;
      if (data) {
        setNotifications(prev => [data, ...prev].slice(0, 50));
      }
    } catch (err) {
      console.error('Bildirim eklenemedi:', err);
    }
  };

  const checkSystemAlerts = async () => {
    // 1. Fetch current notifications to avoid duplicates
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('related_id');
      
    const existingIds = new Set(existingNotifs?.map(n => n.related_id).filter(Boolean));
    const newNotifications: Partial<NotificationRecord>[] = [];
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    try {
      // 2. Check Incomes (Gelirler)
      const { data: pendingIncomes, error: incErr } = await supabase
        .from('income')
        .select('id, invoice_no, due_date, title, amount, currency, status')
        .eq('status', 'pending');

      if (incErr) console.error("Income fetch error in NotificationContext:", incErr);

      if (pendingIncomes) {
        for (const inc of pendingIncomes) {
          if (existingIds.has(inc.id)) continue;
          
          if (!inc.due_date) continue;
          const dDate = new Date(inc.due_date);
          
          // Gecikmiş
          if (dDate < today) {
            newNotifications.push({
              title: 'Gecikmiş Tahsilat',
              message: `${inc.title} firmasından ${inc.amount} ${inc.currency} tutarındaki tahsilat gecikmiştir. (Belge: ${inc.invoice_no})`,
              type: 'error',
              link: `/income/${inc.id}`,
              related_id: inc.id
            });
            existingIds.add(inc.id);
          } 
          // Yaklaşan
          else if (dDate <= threeDaysFromNow) {
            newNotifications.push({
              title: 'Yaklaşan Tahsilat',
              message: `${inc.title} firmasından ${inc.amount} ${inc.currency} tahsilatın vadesi yaklaşıyor. (Belge: ${inc.invoice_no})`,
              type: 'warning',
              link: `/income/${inc.id}`,
              related_id: inc.id
            });
            existingIds.add(inc.id);
          }
        }
      }

      // 3. Check Expenses (Giderler)
      const { data: pendingExpenses, error: expErr } = await supabase
        .from('expenses')
        .select('id, receipt_no, due_date, title, amount, currency, status')
        .eq('status', 'pending');

      if (expErr) console.error("Expense fetch error in NotificationContext:", expErr);

      if (pendingExpenses) {
        for (const exp of pendingExpenses) {
          if (existingIds.has(exp.id)) continue;
          
          if (!exp.due_date) continue;
          const dDate = new Date(exp.due_date);
          
          // Gecikmiş
          if (dDate < today) {
            newNotifications.push({
              title: 'Gecikmiş Ödeme',
              message: `${exp.title} firmasına ${exp.amount} ${exp.currency} ödemeniz gecikmiştir. (Belge: ${exp.receipt_no})`,
              type: 'error',
              link: `/expenses/${exp.id}`,
              related_id: exp.id
            });
            existingIds.add(exp.id);
          } 
          // Yaklaşan
          else if (dDate <= threeDaysFromNow) {
            newNotifications.push({
              title: 'Yaklaşan Ödeme',
              message: `${exp.title} firmasına ${exp.amount} ${exp.currency} ödemenizin vadesi yaklaşıyor. (Belge: ${exp.receipt_no})`,
              type: 'warning',
              link: `/expenses/${exp.id}`,
              related_id: exp.id
            });
            existingIds.add(exp.id);
          }
        }
      }

      // 4. Insert new notifications if any
      if (newNotifications.length > 0) {
        await supabase.from('notifications').insert(newNotifications);
        
        // Show Native Desktop Notifications
        if ('Notification' in window && Notification.permission === 'granted') {
          newNotifications.forEach(notif => {
            new Notification('Barik Muhasebe: ' + notif.title, {
              body: notif.message,
              icon: '/favicon.ico' // Assuming a favicon exists
            });
          });
        }
        
        await fetchNotifications(); // Refresh list
      }

    } catch (err) {
      console.error('Sistem uyarıları kontrol edilirken hata:', err);
    }
  };

  const isCheckingSalaries = useRef(false);

  const checkAndAccrueSalaries = async () => {
    // Otomatik maaş oluşturma sistemi devre dışı bırakıldı (kullanıcı talebi)
  };

  useEffect(() => {
    // Request Native Notification permission on load
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    fetchNotifications();
    checkSystemAlerts();
    
    // Check every hour
    const interval = setInterval(() => {
      checkSystemAlerts();
    }, 3600000);
    return () => clearInterval(interval);
  }, [region]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
  };

  const clearAll = async () => {
    setNotifications([]);
    // Tümünü temizlemek için id'si null olmayanları sil (yani hepsini)
    const { error } = await supabase.from('notifications').delete().not('id', 'is', null);
    if (error) console.error("Bildirimler silinirken hata:", error);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAll,
      checkSystemAlerts,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
