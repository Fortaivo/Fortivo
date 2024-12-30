import { FileText, Image, FileIcon, Trash2, Download, Eye } from 'lucide-react';
import { type AssetDocument } from '../../types/database';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface DocumentListProps {
  documents: AssetDocument[];
  onDelete: (document: AssetDocument) => void;
}

async function getDocumentUrl(filePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from('asset-documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (!data?.signedUrl) throw new Error('Failed to get document URL');
  return data.signedUrl;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  const getIcon = (type: AssetDocument['file_type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'image':
        return <Image className="h-8 w-8 text-blue-500" />;
      default:
        return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No documents uploaded</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          Upload important documents related to this asset for safekeeping.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((document) => (
        <article
          key={document.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getIcon(document.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {document.name}
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {formatFileSize(document.file_size)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={async () => {
                  const url = await getDocumentUrl(document.file_path);
                  window.open(url, '_blank');
                }}
              >
                {document.file_type === 'image' ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this document?')) {
                    onDelete(document);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}