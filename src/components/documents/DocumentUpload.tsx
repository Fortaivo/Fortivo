import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { Button } from '../ui/Button';

interface DocumentUploadProps {
  onUpload: (file: File, name: string) => Promise<void>;
  disabled?: boolean;
}

export function DocumentUpload({ onUpload, disabled }: DocumentUploadProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentName, setDocumentName] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      await onUpload(file, documentName || file.name);
      setDocumentName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('documents.form.errors.failedToUpload'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div>
        <label htmlFor="document_name" className="block text-sm font-medium text-gray-700">
          {t('documents.form.fields.name')}
        </label>
        <input
          type="text"
          id="document_name"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder={t('documents.form.fields.namePlaceholder')}
        />
      </div>

      <div className="flex items-center justify-center w-full">
        <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg shadow-lg tracking-wide border border-gray-300 cursor-pointer hover:bg-gray-50">
          <Upload className="w-8 h-8" />
          <span className="mt-2 text-sm">{uploading ? t('documents.form.buttons.uploading') : t('documents.form.fields.selectFile')}</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={uploading || disabled}
          />
        </label>
      </div>
    </div>
  );
}