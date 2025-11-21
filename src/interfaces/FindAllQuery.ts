// src/interfaces/FindAllQuery.ts

export interface FindAllQuery {
  limit: number;
  offset: number;
  search?: string;
  // حقل جديد لتحديد نوع الترتيب
  sortBy?: 'most_read' | 'newest'; // يمكن أن تكون القيم string
}
