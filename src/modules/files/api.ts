import { supabase } from '../../lib/supabase';
import type { FileRecord } from './types';

export const filesApi = {
  async getAll(): Promise<FileRecord[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return [];
    }
    return data || [];
  },

  async uploadFile(file: File, category: string, uploadedBy: string, saveToDb: boolean = true): Promise<{ url: string; record?: FileRecord } | null> {
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('barik_documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('barik_documents')
        .getPublicUrl(filePath);

      const url = publicUrlData.publicUrl;

      // Determine type
      let type: FileRecord['type'] = 'other';
      if (fileExt?.toLowerCase() === 'pdf') type = 'pdf';
      else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt?.toLowerCase() || '')) type = 'image';
      else if (['xls', 'xlsx'].includes(fileExt?.toLowerCase() || '')) type = 'excel';

      if (!saveToDb) {
        return { url };
      }

      // 3. Insert into Database
      const newFile = {
        name: file.name,
        type,
        category,
        size_bytes: file.size,
        url,
        created_by: uploadedBy
      };

      const { data, error: dbError } = await supabase
        .from('files')
        .insert([newFile])
        .select()
        .single();

      if (dbError) throw dbError;
      return { url, record: data };
    } catch (e) {
      console.error('File upload error:', e);
      return null;
    }
  },

  async deleteFile(id: string, url: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('barik_documents')
        .remove([fileName]);

      if (storageError) throw storageError;

      // Delete from DB
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
      return true;
    } catch (e) {
      console.error('File delete error:', e);
      return false;
    }
  }
};
