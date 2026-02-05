import { Product, Transaction, ApiResponse, StoreSettings, Review, PaymentMethod } from '../types';

// ============================================================================
// OFFLINE / LOCAL STORAGE CONFIGURATION
// ============================================================================

// Force Cloud Mode to FALSE to prevent any network calls or errors
export const IS_CLOUD_MODE = false;

console.log("🚀 Running in LOCAL STORAGE Mode (Offline - Fast & Stable)");

const DB_KEYS = {
  PRODUCTS: 'whllxyz_products',
  TRANSACTIONS: 'whllxyz_transactions',
  SETTINGS: 'whllxyz_settings',
  REVIEWS: 'whllxyz_reviews'
};

// --- INITIAL DUMMY DATA ---
const INITIAL_PRODUCTS: Product[] = [
  {
    _id: "prod_demo_1",
    name: "Contoh Produk (Local)",
    description: "Produk ini tersimpan di browser Anda. Tidak perlu koneksi internet database.",
    price: 100000,
    category: "Software",
    imageUrl: "https://images.unsplash.com/photo-1661956602116-aa6865609028?q=60&w=600",
    fileUrl: "#",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_SETTINGS: StoreSettings = {
  bankName: 'BCA', accountNumber: '123', accountHolder: 'Admin', instructions: 'Transfer', adminPhone: '628123', paymentMethods: [], backgroundImage: ''
};

const triggerUpdate = (key: string) => {
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('db_update', { detail: { key } }));
};

// =========================================================
// LOCAL STORAGE FUNCTIONS (No Async Delays)
// =========================================================

// --- SETTINGS ---
export const getStoreSettings = async (): Promise<ApiResponse<StoreSettings>> => {
  const stored = localStorage.getItem(DB_KEYS.SETTINGS);
  return { success: true, data: stored ? JSON.parse(stored) : DEFAULT_SETTINGS };
};

export const saveStoreSettings = async (settings: StoreSettings): Promise<ApiResponse<StoreSettings>> => {
  localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
  triggerUpdate(DB_KEYS.SETTINGS);
  return { success: true, data: settings };
};

// --- PRODUCTS ---
export const getProducts = async (): Promise<ApiResponse<Product[]>> => {
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  return { success: true, data: stored ? JSON.parse(stored) : INITIAL_PRODUCTS };
};

export const getProductById = async (id: string): Promise<ApiResponse<Product>> => {
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  const products: Product[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  const product = products.find(p => p._id === id);
  return product ? { success: true, data: product } : { success: false, message: 'Not found' };
};

export const createProduct = async (productData: Omit<Product, '_id' | 'createdAt'>): Promise<ApiResponse<Product>> => {
  const newProduct: Product = {
    ...productData,
    _id: `prod_${Date.now()}`,
    createdAt: new Date().toISOString(),
    averageRating: 0, totalReviews: 0
  };

  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  const products = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify([newProduct, ...products]));
  triggerUpdate(DB_KEYS.PRODUCTS);
  return { success: true, data: newProduct };
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<ApiResponse<Product>> => {
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  const products = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  const index = products.findIndex((p: Product) => p._id === id);
  if (index === -1) return { success: false };
  products[index] = { ...products[index], ...productData };
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
  triggerUpdate(DB_KEYS.PRODUCTS);
  return { success: true, data: products[index] };
};

export const deleteProduct = async (id: string): Promise<ApiResponse<null>> => {
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  const products = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products.filter((p: Product) => p._id !== id)));
  triggerUpdate(DB_KEYS.PRODUCTS);
  return { success: true, message: 'Deleted' };
};

// --- TRANSACTIONS ---
export const createTransaction = async (productId: string, paymentMethod: string, email: string): Promise<ApiResponse<Transaction>> => {
  const productRes = await getProductById(productId);
  if (!productRes.data) return { success: false, message: 'Product invalid' };
  
  const transaction: Transaction = {
    _id: `trx_${Date.now()}`,
    productId: productId,
    productName: productRes.data.name,
    amount: productRes.data.price,
    status: 'pending',
    paymentMethod,
    customerEmail: email,
    downloadToken: `token_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    resi: '' 
  };

  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions = stored ? JSON.parse(stored) : [];
  localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify([transaction, ...transactions]));
  triggerUpdate(DB_KEYS.TRANSACTIONS);
  return { success: true, data: transaction };
};

export const getTransactionById = async (id: string): Promise<ApiResponse<Transaction>> => {
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions = stored ? JSON.parse(stored) : [];
  const trx = transactions.find((t: Transaction) => t._id === id);
  return trx ? { success: true, data: trx } : { success: false, message: 'Not found' };
};

export const uploadTransactionProof = async (id: string, base64Image: string): Promise<ApiResponse<Transaction>> => {
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions = stored ? JSON.parse(stored) : [];
  const index = transactions.findIndex((t: Transaction) => t._id === id);
  if (index === -1) return { success: false };
  transactions[index].proofImageUrl = base64Image;
  transactions[index].status = 'waiting_verification';
  localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  triggerUpdate(DB_KEYS.TRANSACTIONS);
  return { success: true, data: transactions[index] };
};

export const updateTransactionStatus = async (id: string, status: 'success' | 'failed'): Promise<ApiResponse<Transaction>> => {
   const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
   const transactions = stored ? JSON.parse(stored) : [];
   const index = transactions.findIndex((t: Transaction) => t._id === id);
   if (index !== -1) {
     transactions[index].status = status;
     localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
     triggerUpdate(DB_KEYS.TRANSACTIONS);
     return { success: true, data: transactions[index] };
   }
   return { success: false };
};

export const updateTransactionResi = async (id: string, resi: string): Promise<ApiResponse<Transaction>> => {
    const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
    const transactions = stored ? JSON.parse(stored) : [];
    const index = transactions.findIndex((t: Transaction) => t._id === id);
    if (index !== -1) {
        transactions[index].resi = resi;
        localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
        triggerUpdate(DB_KEYS.TRANSACTIONS);
        return { success: true, data: transactions[index] };
    }
    return { success: false };
};

export const getTransactions = async (): Promise<ApiResponse<Transaction[]>> => {
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  return { success: true, data: stored ? JSON.parse(stored) : [] };
};

export const verifyDownloadToken = async (token: string): Promise<ApiResponse<{url: string, product: string, transaction: Transaction}>> => {
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions = stored ? JSON.parse(stored) : [];
  const trx = transactions.find((t: Transaction) => t.downloadToken === token);
  if (!trx || trx.status !== 'success') return { success: false, message: 'Invalid/Unpaid' };
  
  const prodRes = await getProductById(trx.productId);
  return prodRes.data ? { success: true, data: { url: prodRes.data.fileUrl, product: prodRes.data.name, transaction: trx } } : { success: false };
};

// --- REVIEWS ---
export const createReview = async (reviewData: Omit<Review, '_id' | 'createdAt'>): Promise<ApiResponse<Review>> => {
  const newReview: Review = { ...reviewData, _id: `rev_${Date.now()}`, createdAt: new Date().toISOString() };
  const stored = localStorage.getItem(DB_KEYS.REVIEWS);
  const reviews = stored ? JSON.parse(stored) : [];
  localStorage.setItem(DB_KEYS.REVIEWS, JSON.stringify([newReview, ...reviews]));
  triggerUpdate(DB_KEYS.REVIEWS);
  return { success: true, data: newReview };
};

export const getReviewsByProductId = async (productId: string): Promise<ApiResponse<Review[]>> => {
  const stored = localStorage.getItem(DB_KEYS.REVIEWS);
  const reviews = stored ? JSON.parse(stored) : [];
  return { success: true, data: reviews.filter((r: Review) => r.productId === productId) };
};

// Helper dummies (No-op)
export const updateCloudConfig = () => false;
export const disconnectCloud = () => {};