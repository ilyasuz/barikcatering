import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../core/contexts/AuthContext';
import type { AppUser } from '../../../core/contexts/AuthContext';
import { Trash2, AlertCircle } from 'lucide-react';
import { hashPassword } from '../../../core/utils/cryptoUtils';

export function UserManagement() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'viewer' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('app_users').select('id, name, email, role');
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || t('settings.roles.loadError', 'Kullanıcılar yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert(t('settings.roles.cannotDeleteSelf', 'Kendi hesabınızı silemezsiniz!'));
      return;
    }
    if (!window.confirm(t('settings.roles.deleteConfirm', '"{{name}}" isimli kullanıcıyı silmek istediğinize emin misiniz?', { name }))) return;

    try {
      const { error } = await supabase.from('app_users').delete().eq('id', id);
      if (error) throw error;
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(t('common.error', 'Hata: ') + err.message);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    if (id === currentUser?.id) {
      alert(t('settings.roles.cannotChangeSelfRole', 'Kendi yetkinizi değiştiremezsiniz!'));
      return;
    }
    try {
      const { error } = await supabase.from('app_users').update({ role: newRole }).eq('id', id);
      if (error) throw error;
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole as AppUser['role'] } : u));
    } catch (err: any) {
      alert(t('common.error', 'Hata: ') + err.message);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.password) {
      setError(t('settings.roles.fillAllFields', 'Lütfen tüm alanları doldurun.'));
      return;
    }

    try {
      const hashedPassword = await hashPassword(formData.password);
      const finalEmail = formData.email.includes('@') ? formData.email : `${formData.email}@barik.com`;
      
      const { data, error } = await supabase.from('app_users').insert([{
        name: formData.name,
        email: finalEmail,
        password: hashedPassword,
        role: formData.role
      }]).select('id, name, email, role').single();

      if (error) throw error;

      setUsers([...users, data as AppUser]);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'viewer' });
    } catch (err: any) {
      setError(t('common.error', 'Hata: ') + err.message);
    }
  };

  const inputStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  if (loading) return <div>{t('common.loading', 'Yükleniyor...')}</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{t('users.rolesTitle', 'Kullanıcı Rolleri ve Yetkiler')}</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>{t('users.rolesSubtitle', 'Sisteme giriş yapabilen kullanıcıları ve yetkilerini yönetin.')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-secondary" 
          style={{ fontSize: '13px', padding: '10px 16px', borderRadius: '8px', fontWeight: 500 }}
        >
          {t('users.addNewUser', '+ Yeni Kullanıcı Ekle')}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
        {users.map((user, index) => (
          <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: index < users.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {user.name} {user.id === currentUser?.id ? t('settings.roles.you', '(Siz)') : ''}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user.id === currentUser?.id ? (
                <span style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>
                  {user.role === 'admin' ? t('settings.roles.admin', 'Sistem Yöneticisi') : user.role === 'editor' ? t('settings.roles.editor', 'Veri Girişi') : t('settings.roles.viewer', 'İzleyici')}
                </span>
              ) : (
                <select 
                  style={{ ...inputStyle, padding: '8px 12px', cursor: 'pointer', width: 'auto' }} 
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  <option value="admin">{t('settings.roles.admin', 'Sistem Yöneticisi')}</option>
                  <option value="editor">{t('settings.roles.editorLabel', 'Veri Girişi (Muhasebeci)')}</option>
                  <option value="viewer">{t('settings.roles.viewerLabel', 'Sadece İzleyici')}</option>
                </select>
              )}
              
              {user.id !== currentUser?.id && (
                <button 
                  onClick={() => handleDelete(user.id, user.name)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px' }}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>{t('settings.roles.roleDescriptions', 'Yetki Açıklamaları:')}</h4>
        <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.5 }}>
          <li><strong>{t('settings.roles.admin', 'Sistem Yöneticisi')}:</strong> {t('settings.roles.adminDesc', 'Her şeyi görebilir, değiştirebilir ve yeni kullanıcı ekleyebilir.')}</li>
          <li><strong>{t('settings.roles.editorLabel', 'Veri Girişi (Muhasebeci)')}:</strong> {t('settings.roles.editorDesc', 'Gelir/Gider ve Kasa ekleyebilir ancak Ayarlar sayfasını göremez.')}</li>
          <li><strong>{t('settings.roles.viewerLabel', 'Sadece İzleyici')}:</strong> {t('settings.roles.viewerDesc', 'Dashboard ve raporları görebilir ancak veri ekleyemez/silemez.')}</li>
        </ul>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>{t('settings.roles.newUser', 'Yeni Kullanıcı Ekle')}</h3>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('settings.roles.fullName', 'İsim Soyisim')}</label>
                <input type="text" style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('settings.roles.username', 'Kullanıcı Adı')}</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="text" style={{...inputStyle, borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ornek.isim" required />
                  <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderLeft: 'none', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', color: 'var(--text-muted)', fontSize: '14px', height: '100%', display: 'flex', alignItems: 'center' }}>
                    @barik.com
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('settings.roles.tempPassword', 'Geçici Şifre')}</label>
                <input type="text" style={inputStyle} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('settings.roles.role', 'Yetki')}</label>
                <select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="viewer">{t('settings.roles.viewerLabel', 'Sadece İzleyici')}</option>
                  <option value="editor">{t('settings.roles.editorLabel', 'Veri Girişi (Muhasebeci)')}</option>
                  <option value="admin">{t('settings.roles.admin', 'Sistem Yöneticisi')}</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>{t('common.cancel', 'İptal')}</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>{t('common.save', 'Kaydet')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
