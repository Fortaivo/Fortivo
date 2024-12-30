import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { DocumentList } from '../components/documents/DocumentList';
import { DocumentUpload } from '../components/documents/DocumentUpload';
import { useAssetDocuments } from '../hooks/useAssetDocuments';
import { ROUTES } from '../lib/routes';

export function DocumentsPage() {
  const { assetId } = useParams<{ assetId: string }>();
  
  if (!assetId) {
    return <Navigate to={ROUTES.ASSETS} replace />;
  }

  const { documents, loading, error, uploadDocument, deleteDocument } = useAssetDocuments(assetId!);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File, name: string) => {
    try {
      setIsUploading(true);
      await uploadDocument(file, name);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Asset Documents</h1>
      </div>

      <div className="space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h2>
          <DocumentUpload onUpload={handleUpload} />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h2>
          <DocumentList documents={documents} onDelete={deleteDocument} />
        </div>
      </div>
    </div>
  );
}