import { Product, Transaction, ApiResponse, StoreSettings, Review, PaymentMethod } from '../types';

// Initial Mock Data
const INITIAL_PRODUCTS: Product[] = [
  {
    _id: "prod_demo_1",
    name: "SaaS Starter Kit",
    description: "A complete React & Node.js boilerplate for building SaaS applications. Includes authentication, payments, and dashboard.",
    price: 450000,
    category: "Software",
    imageUrl: "https://images.unsplash.com/photo-1661956602116-aa6865609028?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    fileUrl: "#",
    fileSize: "45 MB",
    fileType: "ZIP",
    createdAt: new Date().toISOString(),
    averageRating: 4.8,
    totalReviews: 12
  },
  {
    _id: "prod_demo_2",
    name: "Modern Portfolio Template",
    description: "Minimalist personal portfolio website template. Built with Tailwind CSS and Framer Motion.",
    price: 150000,
    category: "Templates",
    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    fileUrl: "#",
    fileSize: "12 MB",
    fileType: "ZIP",
    createdAt: new Date().toISOString(),
    averageRating: 5,
    totalReviews: 4
  }
];

const DB_KEYS = {
  PRODUCTS: 'whllxyz_products',
  TRANSACTIONS: 'whllxyz_transactions',
  SETTINGS: 'whllxyz_settings',
  REVIEWS: 'whllxyz_reviews'
};

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'bca', name: 'BCA', type: 'bank', accountNumber: '1234567890', accountHolder: 'Admin WhllXyz', enabled: true },
  { id: 'dana', name: 'Dana', type: 'ewallet', accountNumber: '081234567890', accountHolder: 'Admin WhllXyz', enabled: true },
  { id: 'shopeepay', name: 'ShopeePay', type: 'ewallet', accountNumber: '081234567890', accountHolder: 'Admin WhllXyz', enabled: false },
  { id: 'gopay', name: 'GoPay', type: 'ewallet', accountNumber: '081234567890', accountHolder: 'Admin WhllXyz', enabled: false },
  { id: 'qris', name: 'QRIS', type: 'qris', accountNumber: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg', accountHolder: 'WhllXyz Store', enabled: false }
];

const DEFAULT_SETTINGS: StoreSettings = {
  bankName: 'BCA',
  accountNumber: '1234567890',
  accountHolder: 'Admin WhllXyz',
  instructions: 'Silakan pilih metode pembayaran, transfer sesuai nominal, lalu upload bukti pembayaran.',
  adminPhone: '628123456789', // Default dummy WA
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  backgroundImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
};

// Helper to trigger update events (For same-device tab syncing)
const triggerUpdate = (key: string) => {
  // Dispatch generic storage event for other tabs
  window.dispatchEvent(new Event('storage'));
  // Dispatch custom event for current tab components
  window.dispatchEvent(new CustomEvent('db_update', { detail: { key } }));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- SETTINGS ---
export const getStoreSettings = async (): Promise<ApiResponse<StoreSettings>> => {
  await delay(200);
  const stored = localStorage.getItem(DB_KEYS.SETTINGS);
  if (!stored) return { success: true, data: DEFAULT_SETTINGS };
  
  // Merge with defaults to ensure new fields (like wallpaper) exist
  const parsed = JSON.parse(stored);
  if (!parsed.paymentMethods) parsed.paymentMethods = DEFAULT_PAYMENT_METHODS;
  if (!parsed.backgroundImage) parsed.backgroundImage = DEFAULT_SETTINGS.backgroundImage;
  
  return { success: true, data: parsed };
};

export const saveStoreSettings = async (settings: StoreSettings): Promise<ApiResponse<StoreSettings>> => {
  await delay(500);
  localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
  triggerUpdate(DB_KEYS.SETTINGS);
  return { success: true, data: settings };
};

// --- PRODUCTS ---
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
    category: productData.category || 'Uncategorized',
    fileSize: productData.fileSize || 'Unknown',
    fileType: productData.fileType || 'FILE',
    _id: `prod_${Date.now()}`,
    createdAt: new Date().toISOString(),
    averageRating: 0,
    totalReviews: 0
  };
  
  const updatedProducts = [newProduct, ...products];
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
  triggerUpdate(DB_KEYS.PRODUCTS);
  return { success: true, data: newProduct };
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<ApiResponse<Product>> => {
  await delay(800);
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  const products: Product[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  const index = products.findIndex(p => p._id === id);
  if (index === -1) return { success: false, message: 'Product not found' };

  const updatedProduct = { ...products[index], ...productData };
  products[index] = updatedProduct;
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
  triggerUpdate(DB_KEYS.PRODUCTS);
  return { success: true, data: updatedProduct };
};

export const deleteProduct = async (id: string): Promise<ApiResponse<null>> => {
  await delay(500);
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  const products: Product[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  const filtered = products.filter(p => p._id !== id);
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(filtered));
  triggerUpdate(DB_KEYS.PRODUCTS);
  return { success: true, message: 'Product deleted' };
};

// --- TRANSACTIONS ---
export const createTransaction = async (productId: string, paymentMethod: string, email: string): Promise<ApiResponse<Transaction>> => {
  await delay(1000);
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

  const storedTrx = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions: Transaction[] = storedTrx ? JSON.parse(storedTrx) : [];
  localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify([transaction, ...transactions]));
  triggerUpdate(DB_KEYS.TRANSACTIONS);
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

export const uploadTransactionProof = async (id: string, base64Image: string): Promise<ApiResponse<Transaction>> => {
  await delay(1500);
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
  const index = transactions.findIndex(t => t._id === id);
  
  if (index === -1) return { success: false, message: 'Transaction not found' };
  
  transactions[index].proofImageUrl = base64Image;
  transactions[index].status = 'waiting_verification';
  
  localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  triggerUpdate(DB_KEYS.TRANSACTIONS);
  return { success: true, data: transactions[index] };
};

export const updateTransactionStatus = async (id: string, status: 'success' | 'failed'): Promise<ApiResponse<Transaction>> => {
  await delay(500);
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
  const index = transactions.findIndex(t => t._id === id);
  
  if (index === -1) return { success: false, message: 'Transaction not found' };
  
  transactions[index].status = status;
  localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  triggerUpdate(DB_KEYS.TRANSACTIONS);
  return { success: true, data: transactions[index] };
};

export const updateTransactionResi = async (id: string, resi: string): Promise<ApiResponse<Transaction>> => {
  await delay(400);
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
  const index = transactions.findIndex(t => t._id === id);
  
  if (index === -1) return { success: false, message: 'Transaction not found' };
  
  transactions[index].resi = resi;
  localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  triggerUpdate(DB_KEYS.TRANSACTIONS);
  return { success: true, data: transactions[index] };
};

export const getTransactions = async (): Promise<ApiResponse<Transaction[]>> => {
  await delay(600);
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  return { success: true, data: stored ? JSON.parse(stored) : [] };
};

export const verifyDownloadToken = async (token: string): Promise<ApiResponse<{url: string, product: string, transaction: Transaction}>> => {
  await delay(500);
  const storedTrx = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions: Transaction[] = storedTrx ? JSON.parse(storedTrx) : [];
  const trx = transactions.find(t => t.downloadToken === token);
  
  if (!trx || trx.status !== 'success') {
    return { success: false, message: 'Invalid token or Payment not verified yet.' };
  }

  const prodRes = await getProductById(trx.productId);
  if (!prodRes.data) return { success: false, message: 'Product no longer exists' };

  return { 
    success: true, 
    data: { 
      url: prodRes.data.fileUrl,
      product: prodRes.data.name,
      transaction: trx
    } 
  };
};

// --- REVIEWS ---

export const createReview = async (reviewData: Omit<Review, '_id' | 'createdAt'>): Promise<ApiResponse<Review>> => {
  await delay(800);
  
  const storedReviews = localStorage.getItem(DB_KEYS.REVIEWS);
  const reviews: Review[] = storedReviews ? JSON.parse(storedReviews) : [];
  
  const newReview: Review = {
    ...reviewData,
    _id: `rev_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  const updatedReviews = [newReview, ...reviews];
  localStorage.setItem(DB_KEYS.REVIEWS, JSON.stringify(updatedReviews));

  // Update Product Stats
  const storedProducts = localStorage.getItem(DB_KEYS.PRODUCTS);
  if (storedProducts) {
    const products: Product[] = JSON.parse(storedProducts);
    const prodIndex = products.findIndex(p => p._id === reviewData.productId);
    
    if (prodIndex !== -1) {
      const productReviews = updatedReviews.filter(r => r.productId === reviewData.productId);
      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      
      products[prodIndex].totalReviews = productReviews.length;
      products[prodIndex].averageRating = totalRating / productReviews.length;
      
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
      triggerUpdate(DB_KEYS.PRODUCTS);
    }
  }
  triggerUpdate(DB_KEYS.REVIEWS);

  return { success: true, data: newReview };
};

export const getReviewsByProductId = async (productId: string): Promise<ApiResponse<Review[]>> => {
  await delay(400);
  const stored = localStorage.getItem(DB_KEYS.REVIEWS);
  const reviews: Review[] = stored ? JSON.parse(stored) : [];
  const productReviews = reviews.filter(r => r.productId === productId);
  return { success: true, data: productReviews };
};