import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  receipt_number: string;
  total: number;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface DashboardData {
  totalProducts: number;
  totalInventory: number;
  totalSales: number;
  totalRevenue: number;
  recentSales: Sale[];
}

export const productsApi = {
  list: () => api.get<Product[]>('/products').then(r => r.data),
  get: (id: number) => api.get<Product>(`/products/${id}`).then(r => r.data),
  create: (data: Partial<Product>) => api.post<Product>('/products', data).then(r => r.data),
  update: (id: number, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const salesApi = {
  list: () => api.get<Sale[]>('/sales').then(r => r.data),
  get: (id: number) => api.get<Sale>(`/sales/${id}`).then(r => r.data),
  create: (items: { product_id: number; quantity: number }[]) =>
    api.post<Sale>('/sales', { items }).then(r => r.data),
};

export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard').then(r => r.data),
};

export default api;
