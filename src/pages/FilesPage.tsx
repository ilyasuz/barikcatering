import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FolderOpen, UploadCloud, FileText, Image, File, Download, 
  Trash2, Search, Filter, Eye, HardDrive, Calendar, Tag, Plus 
} from 'lucide-react';

import { filesApi } from '../modules/files/api';
import type { FileRecord } from '../modules/files/types';

export function FilesPage() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create mapped tabs dynamically so they can change with the language
  const tabs = [
    { key: 'all', label: t('files.tabs.all', 'Tümü') },
    { key: 'invoices', label: t('files.tabs.invoices', 'Faturalar') },
    { key: 'contracts', label: t('files.tabs.contracts', 'Sözleşmeler') },
    { key: 'receipts', label: t('files.tabs.receipts', 'Dekontlar') },
    { key: 'personnel', label: t('files.tabs.personnel', 'Personel') },
    { key: 'other', label: t('files.tabs.other', 'Diğer') }
  ];

  const [activeTabKey, setActiveTabKey] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    const data = await filesApi.getAll();
    setFiles(data);
    setLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
  
  const handleDelete = async (id: string, url: string) => {
    if (window.confirm(t('files.deleteConfirm', 'Bu dosyayı silmek istediğinize emin misiniz?'))) {
      const success = await filesApi.deleteFile(id, url);
      if (success) {
        setFiles(files.filter(f => f.id !== id));
      } else {
        alert(t('files.deleteError', 'Dosya silinirken bir hata oluştu.'));
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploading(true);
      
      const category = activeTabKey !== 'all' ? 
        (activeTabKey === 'invoices' ? 'Fatura' : 
         activeTabKey === 'contracts' ? 'Sözleşme' : 
         activeTabKey === 'receipts' ? 'Dekont' : 
         activeTabKey === 'personnel' ? 'Personel' : 'Diğer') : 'Diğer';

      const uploaded = await filesApi.uploadFile(file, category, 'Admin');
      
      if (uploaded && uploaded.record) {
        setFiles([uploaded.record, ...files]);
      } else {
        alert(t('files.uploadError', 'Dosya yüklenirken bir hata oluştu.'));
      }
      setUploading(false);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTabKey === 'all' 
      ? true 
      : activeTabKey === 'invoices' ? f.category === 'Fatura'
      : activeTabKey === 'contracts' ? f.category === 'Sözleşme'
      : activeTabKey === 'receipts' ? f.category === 'Dekont'
      : activeTabKey === 'personnel' ? f.category === 'Personel'
      : activeTabKey === 'other' ? f.category === 'Diğer'
      : true;
    return matchesSearch && matchesTab;
  });

  const totalSize = files.reduce((acc, f) => acc + f.size_bytes, 0);
  const formattedTotalSize = (totalSize / 1024 / 1024).toFixed(2) + ' MB';
  
  // Calculate uploads in the current month dynamically based on today's date
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const thisMonthUploads = files.filter(f => f.created_at && f.created_at.startsWith(currentMonthPrefix)).length;
  const categoriesCount = new Set(files.map(f => f.category)).size;

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={32} color="var(--danger)" />;
      case 'image': return <Image size={32} color="var(--accent)" />;
      case 'excel': return <FileText size={32} color="var(--success)" />;
      default: return <File size={32} color="var(--text-muted)" />;
    }
  };

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>{t('files.title', 'Dosyalar & Arşiv')}</h1>
          <p className="text-muted">{t('files.subtitle', 'Barik Catering tüm departman belgeleri ve arşiv yönetimi.')}</p>
        </div>
        <button 
          onClick={handleUploadClick}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UploadCloud size={18} />
          <span>{t('files.newUpload', 'Yeni Dosya Yükle')}</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--accent)' }}>
            <FolderOpen size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>{t('files.totalFiles', 'Toplam Dosya')}</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{files.length}</p>
          </div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--success)' }}>
            <HardDrive size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>{t('files.totalSize', 'Toplam Boyut')}</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formattedTotalSize}</p>
          </div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--accent)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>{t('files.thisMonth', 'Bu Ay Yüklenen')}</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{thisMonthUploads}</p>
          </div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', color: '#F59E0B' }}>
            <Tag size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>{t('files.categories', 'Kategoriler')}</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{categoriesCount}</p>
          </div>
        </div>
      </div>

      {/* Upload Zone (Visual) */}
      <div 
        onClick={handleUploadClick}
        className="hover-bg-tertiary"
        style={{ 
          border: '2px dashed var(--border-color)', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          padding: '32px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          textAlign: 'center', 
          cursor: 'pointer',
          marginBottom: '24px',
          transition: 'all 0.2s'
        }}
      >
        <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <UploadCloud size={32} color="var(--accent)" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-primary)' }}>{t('files.dragDrop', 'Dosyaları Sürükleyip Bırakın')}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {t('files.dragDropDesc', 'veya seçmek için tıklayın. PDF, Excel ve Görsel formatları desteklenmektedir.')}
        </p>
      </div>

      {/* Controls: Search & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', width: '300px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder={t('files.searchPlaceholder', 'Dosya adı ile ara...')}
            value={searchTerm}
            onChange={handleSearch}
            style={{ border: 'none', background: 'transparent', padding: '10px', width: '100%', outline: 'none', color: 'var(--text-primary)' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <Filter size={20} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTabKey(tab.key)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 500,
                border: activeTabKey === tab.key ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                backgroundColor: activeTabKey === tab.key ? 'var(--accent)' : 'var(--bg-secondary)',
                color: activeTabKey === tab.key ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* File List Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
        {filteredFiles.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <File size={48} style={{ margin: '0 auto 12px auto', opacity: 0.2 }} />
            <p>{t('files.noFiles', 'Aradığınız kriterlere uygun dosya bulunamadı.')}</p>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div key={file.id} className="hover-bg-secondary" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', overflow: 'hidden', flex: 1 }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', flexShrink: 0 }}>
                  {getFileIcon(file.type)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontWeight: 500, fontSize: '15px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }} title={file.name}>
                    {file.name}
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                      {t(`files.categoriesMap.${file.category}`, file.category)}
                    </span>
                    <span>•</span>
                    <span>{(file.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>{new Date(file.created_at).toLocaleDateString('tr-TR')}</span>
                    <span>•</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.created_by}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn-icon" title={t('common.preview', 'Önizle')} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '8px', display: 'flex' }}>
                  <Eye size={18} />
                </a>
                <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer" className="btn-icon" title={t('common.download', 'İndir')} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--success)', borderRadius: '8px', display: 'flex' }}>
                  <Download size={18} />
                </a>
                <button className="btn-icon" onClick={() => handleDelete(file.id, file.url)} title={t('common.delete', 'Sil')} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', borderRadius: '8px' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
