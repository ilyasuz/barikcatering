import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, File, X, CheckCircle } from 'lucide-react';
import './FileUpload.css';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({ onFileSelect, accept = '*/*', maxSizeMB = 5 }: FileUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(t('upload.sizeError', 'Dosya boyutu {{maxSize}}MB\'dan küçük olmalıdır', { maxSize: maxSizeMB }));
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="file-upload-wrapper">
      {!selectedFile ? (
        <div 
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${error ? 'error' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={32} className="upload-icon" />
          <p className="upload-text">
            <span className="upload-highlight">{t('upload.clickToUpload', 'Yüklemek için tıklayın')}</span> {t('upload.orDragAndDrop', 'veya sürükleyip bırakın')}
          </p>
          <p className="upload-hint">{t('upload.hint', 'PDF, PNG, JPG maks {{maxSize}}MB', { maxSize: maxSizeMB })}</p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept={accept}
            className="hidden-input" 
          />
        </div>
      ) : (
        <div className="selected-file">
          <div className="file-info">
            <div className="file-icon-wrapper">
              <File size={20} className="file-icon" />
            </div>
            <div className="file-details">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
          <div className="file-actions">
            <CheckCircle size={18} className="success-icon" />
            <button type="button" className="remove-btn" onClick={handleRemove}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}
