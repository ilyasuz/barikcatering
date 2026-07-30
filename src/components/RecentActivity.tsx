import { useTranslation } from 'react-i18next';
import './RecentActivity.css';

export function RecentActivity() {
  const { t } = useTranslation();
  
  const activities = [
    { id: 1, date: t('dashboard.today', 'Bugün') + ', 14:23', desc: t('recent.softwareRenewal', 'Yazılım Lisans Yenileme'), company: 'Microsoft', category: t('categories.software', 'Yazılım'), currency: 'USD', amount: -2400, status: t('status.completed', 'Tamamlandı') },
    { id: 2, date: t('dashboard.today', 'Bugün') + ', 10:15', desc: t('recent.consulting', 'Danışmanlık Hizmetleri'), company: 'Acme Corp', category: t('categories.service', 'Hizmet'), currency: 'TRY', amount: 45000, status: t('status.pending', 'Bekliyor') },
    { id: 3, date: t('dashboard.yesterday', 'Dün'), desc: t('recent.officeSupplies', 'Ofis Malzemeleri'), company: 'Staples', category: t('categories.office', 'Ofis'), currency: 'TRY', amount: -1250, status: t('status.completed', 'Tamamlandı') },
    { id: 4, date: `19 ${t('common.months.jul', 'Tem')} 2026`, desc: t('recent.serverHosting', 'Sunucu Barındırma'), company: 'AWS', category: t('categories.infrastructure', 'Altyapı'), currency: 'USD', amount: -450, status: t('status.completed', 'Tamamlandı') },
    { id: 5, date: `18 ${t('common.months.jul', 'Tem')} 2026`, desc: t('recent.devAdvance', 'Q3 Geliştirme Avansı'), company: 'TechNova', category: t('categories.service', 'Hizmet'), currency: 'EUR', amount: 12000, status: t('status.completed', 'Tamamlandı') },
  ];
  return (
    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            <th>{t('common.date', 'Tarih')}</th>
            <th>{t('common.description', 'Açıklama')}</th>
            <th>{t('companies.singular', 'Firma')}</th>
            <th>{t('common.amount', 'Tutar')}</th>
            <th>{t('common.status', 'Durum')}</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((item) => (
            <tr key={item.id}>
              <td className="text-muted">{item.date}</td>
              <td className="desc-cell">
                <span className="desc-text">{item.desc}</span>
                <span className="category-badge">{item.category}</span>
              </td>
              <td>{item.company}</td>
              <td className={`amount ${item.amount > 0 ? 'positive' : ''}`}>
                {item.amount > 0 ? '+' : ''}
                {item.amount.toLocaleString()} {item.currency}
              </td>
              <td>
                <span className={`status-badge ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
