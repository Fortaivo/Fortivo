/*
  # Storage setup for asset documents

  1. Storage Configuration
    - Create asset-documents bucket
    - Configure private access

  2. Security
    - Enable RLS on storage.objects
    - Add policies for authenticated users to:
      - Upload documents
      - Read own documents
      - Delete own documents
      - Update own documents
*/

-- Create storage bucket for asset documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-documents', 'asset-documents', false);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-documents');

-- Create policy to allow users to read their own documents
CREATE POLICY "Users can read own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'asset-documents' 
    AND auth.uid()::text = SPLIT_PART(name, '/', 1)
  );

-- Create policy to allow users to delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'asset-documents' 
    AND auth.uid()::text = SPLIT_PART(name, '/', 1)
  );

-- Create policy to allow users to update their own documents
CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'asset-documents' 
    AND auth.uid()::text = SPLIT_PART(name, '/', 1)
  )
  WITH CHECK (bucket_id = 'asset-documents');