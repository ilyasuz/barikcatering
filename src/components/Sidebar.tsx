import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  Briefcase, 
  Landmark, 
  Building2, 
  Users, 
  PieChart, 
  FolderOpen, 
  Settings, 
  LogOut,
  Hexagon,
  Utensils
} from 'lucide-react';
import './Sidebar.css';
import { useAuth } from '../core/contexts/AuthContext';

export function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/dashboard', roles: ['admin', 'editor', 'viewer'] },
    { icon: Wallet, label: t('sidebar.income'), path: '/income', roles: ['admin', 'editor', 'viewer'] },
    { icon: Receipt, label: t('sidebar.expenses'), path: '/expenses', roles: ['admin', 'editor', 'viewer'] },
    { icon: Landmark, label: t('sidebar.accounts', 'Kasalar & Bankalar'), path: '/accounts', roles: ['admin', 'editor', 'viewer'] },
    { icon: Utensils, label: t('sidebar.meals', 'Yemek Hesabı'), path: '/meals', roles: ['admin', 'editor', 'viewer'] },
    { icon: Users, label: t('sidebar.companies_title', 'Cariler (Şirket/Müşteri)'), path: '/companies', roles: ['admin', 'editor', 'viewer'] },
    { icon: PieChart, label: t('sidebar.reports'), path: '/reports', roles: ['admin', 'editor', 'viewer'] },
    { icon: FolderOpen, label: t('sidebar.files'), path: '/files', roles: ['admin', 'editor', 'viewer'] },
    { icon: Settings, label: t('sidebar.settings'), path: '/settings', roles: ['admin', 'editor', 'viewer'] },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Hexagon className="logo-icon" size={28} />
          <span className="logo-text">Barik</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {visibleMenuItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {user?.role === 'admin' ? t('users.roles.admin', 'Yönetici') : user?.role === 'editor' ? t('users.roles.editor', 'Veri Girişi') : t('users.roles.viewer', 'İzleyici')}
          </div>
        </div>
        <button className="nav-item logout-btn" onClick={logout}>
          <LogOut size={20} />
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
