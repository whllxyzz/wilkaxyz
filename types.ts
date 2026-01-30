export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string; // New field for filtering
  imageUrl: string;
  fileUrl: string; // In a real app, this is secure. Here we simulate it.
  createdAt: string;
}

export interface Transaction {
  _id: string;
  productId: string;
  productName: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  paymentMethod: string;
  downloadToken: string;
  customerEmail?: string;
  createdAt: string;
}

export type PaymentMethod = 'qris' | 'bank_transfer' | 'ewallet';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}