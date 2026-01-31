export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  videoUrl?: string; // New: Product Video
  fileUrl: string;
  fileSize?: string;
  fileType?: string;
  createdAt: string;
  averageRating?: number; // New: Cache average rating
  totalReviews?: number;  // New: Cache total reviews
}

export interface Transaction {
  _id: string;
  productId: string;
  productName: string;
  amount: number;
  status: 'pending' | 'waiting_verification' | 'success' | 'failed'; // Updated status
  paymentMethod: string;
  downloadToken: string;
  customerEmail?: string;
  proofImageUrl?: string; // New: To store base64 proof
  resi?: string; // New: Tracking Number / Reference / License Key
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank' | 'ewallet' | 'qris';
  accountNumber: string; // Acts as Image URL for QRIS
  accountHolder: string;
  enabled: boolean;
  logo?: string; // Optional icon/logo url
}

export interface StoreSettings {
  bankName: string; // Deprecated, kept for type safety
  accountNumber: string; // Deprecated
  accountHolder: string; // Deprecated
  instructions: string;
  adminPhone: string; // New: WhatsApp Number
  paymentMethods: PaymentMethod[]; // New: Dynamic List
  backgroundImage?: string; // New: Custom Wallpaper URL
}

export interface Review {
  _id: string;
  productId: string;
  transactionId: string; // Link to transaction to verify purchase
  rating: number; // 1-5
  comment: string;
  userName: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}