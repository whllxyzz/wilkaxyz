import { Product, Transaction, ApiResponse } from '../types';

// Initial Mock Data - Empty start
const INITIAL_PRODUCTS: Product[] = [];

const DB_KEYS = {
  PRODUCTS: 'whllxyz_products',
  TRANSACTIONS: 'whllxyz_transactions'
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- PRODUCT SERVICES ---

export const getProducts = async (): Promise<ApiResponse<Product[]>> => {
  await delay(600);
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  if (!stored) {
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return { success: true, data: INITIAL_PRODUCTS };
  }
  return { success: true, data: JSON.parse(stored) };
};

export const getProductById = async (id: string): Promise<ApiResponse<Product>> => {
  await delay(400);
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  const products: Product[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  const product = products.find(p => p._id === id);
  
  if (!product) return { success: false, message: 'Product not found' };
  return { success: true, data: product };
};

export const createProduct = async (productData: Omit<Product, '_id' | 'createdAt'>): Promise<ApiResponse<Product>> => {
  await delay(800);
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  const products: Product[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  
  const newProduct: Product = {
    ...productData,
    category: productData.category || 'Uncategorized', // Default fallback
    _id: `prod_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  const updatedProducts = [newProduct, ...products];
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
  
  return { success: true, data: newProduct };
};

export const deleteProduct = async (id: string): Promise<ApiResponse<null>> => {
  await delay(500);
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  const products: Product[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  
  const filtered = products.filter(p => p._id !== id);
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(filtered));
  
  return { success: true, message: 'Product deleted' };
};

// --- TRANSACTION / PAYMENT SERVICES ---

export const createTransaction = async (productId: string, paymentMethod: string, email: string): Promise<ApiResponse<Transaction>> => {
  await delay(1000); // Simulate API call to Payment Gateway
  
  const productRes = await getProductById(productId);
  if (!productRes.data) return { success: false, message: 'Product invalid' };
  
  const transaction: Transaction = {
    _id: `trx_${Date.now()}`,
    productId: productId,
    productName: productRes.data.name,
    amount: productRes.data.price,
    status: 'pending', // Starts as pending
    paymentMethod,
    customerEmail: email,
    downloadToken: `token_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString()
  };

  const storedTrx = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions: Transaction[] = storedTrx ? JSON.parse(storedTrx) : [];
  localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify([transaction, ...transactions]));

  return { success: true, data: transaction };
};

export const getTransactionById = async (id: string): Promise<ApiResponse<Transaction>> => {
  await delay(400);
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
  const trx = transactions.find(t => t._id === id);
  
  if (!trx) return { success: false, message: 'Transaction not found' };
  return { success: true, data: trx };
};

export const updateTransactionStatus = async (id: string, status: 'success' | 'failed'): Promise<ApiResponse<Transaction>> => {
  await delay(1500); // Simulate payment verification time
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
  
  const index = transactions.findIndex(t => t._id === id);
  if (index === -1) return { success: false, message: 'Transaction not found' };
  
  transactions[index].status = status;
  localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  
  return { success: true, data: transactions[index] };
};

export const getTransactions = async (): Promise<ApiResponse<Transaction[]>> => {
  await delay(600);
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  return { success: true, data: stored ? JSON.parse(stored) : [] };
};

export const verifyDownloadToken = async (token: string): Promise<ApiResponse<{url: string, product: string}>> => {
  await delay(500);
  const storedTrx = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions: Transaction[] = storedTrx ? JSON.parse(storedTrx) : [];
  
  const trx = transactions.find(t => t.downloadToken === token);
  
  if (!trx || trx.status !== 'success') {
    return { success: false, message: 'Invalid or expired token' };
  }

  // Find original product to get the file URL
  const prodRes = await getProductById(trx.productId);
  if (!prodRes.data) return { success: false, message: 'Product no longer exists' };

  return { 
    success: true, 
    data: { 
      url: prodRes.data.fileUrl,
      product: prodRes.data.name
    } 
  };
};