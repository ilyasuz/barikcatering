export interface FileRecord {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'excel' | 'other';
  category: string;
  size_bytes: number;
  url: string;
  created_at: string;
  created_by: string;
}
