import { Product, Transaction, ApiResponse, StoreSettings, Review, PaymentMethod } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore';

// ==========================================
// KONFIGURASI DATABASE (FIREBASE)
// ==========================================
// 1. Buka https://console.firebase.google.com/
// 2. Buat Project Baru -> Continue -> Continue
// 3. Masuk ke Project Settings -> General -> Scroll ke bawah "Your apps" -> Pilih icon Web (</>)
// 4. Register app, lalu copy "const firebaseConfig = { ... }"
// 5. PASTE CONFIG DI BAWAH INI MENGGANTIKAN DUMMY DATA:
// ==========================================

const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY_DARI_FIREBASE", // Contoh: "AIzaSyD..."
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// ==========================================

// Logic: Jika user belum ganti API Key, pakai LocalStorage (Offline Mode)
// Jika user sudah ganti, pakai Firebase (Online Mode)
export const IS_CLOUD_MODE = firebaseConfig.apiKey !== "GANTI_DENGAN_API_KEY_DARI_FIREBASE";

let db: any;
if (IS_CLOUD_MODE) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("🔥 Connected to Firebase Cloud Database");
  } catch (e) {
    console.error("Firebase Init Error:", e);
  }
} else {
  console.log("⚠️ Running in LOCAL STORAGE Mode (Data not synced to other devices)");
}

// --- INITIAL DUMMY DATA (For LocalStorage Fallback) ---
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

const triggerUpdate = (key: string) => {
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('db_update', { detail: { key } }));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// =========================================================
// HYBRID FUNCTIONS (Firebase > LocalStorage)
// =========================================================

// --- SETTINGS ---
export const getStoreSettings = async (): Promise<ApiResponse<StoreSettings>> => {
  if (IS_CLOUD_MODE) {
    try {
      const docRef = doc(db, "settings", "general");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() as StoreSettings };
      }
      return { success: true, data: DEFAULT_SETTINGS };
    } catch (e) {
      console.error("Cloud Error", e);
      return { success: false, message: "Failed to fetch settings" };
    }
  } else {
    await delay(200);
    const stored = localStorage.getItem(DB_KEYS.SETTINGS);
    if (!stored) return { success: true, data: DEFAULT_SETTINGS };
    const parsed = JSON.parse(stored);
    if (!parsed.paymentMethods) parsed.paymentMethods = DEFAULT_PAYMENT_METHODS;
    if (!parsed.backgroundImage) parsed.backgroundImage = DEFAULT_SETTINGS.backgroundImage;
    return { success: true, data: parsed };
  }
};

export const saveStoreSettings = async (settings: StoreSettings): Promise<ApiResponse<StoreSettings>> => {
  if (IS_CLOUD_MODE) {
    try {
      await setDoc(doc(db, "settings", "general"), settings);
      return { success: true, data: settings };
    } catch (e) {
       return { success: false, message: "Failed to save to cloud" };
    }
  } else {
    await delay(500);
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    triggerUpdate(DB_KEYS.SETTINGS);
    return { success: true, data: settings };
  }
};

// --- PRODUCTS ---
export const getProducts = async (): Promise<ApiResponse<Product[]>> => {
  if (IS_CLOUD_MODE) {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        products.push(doc.data() as Product);
      });
      return { success: true, data: products };
    } catch (e) {
      return { success: false, message: "Cloud Error" };
    }
  } else {
    await delay(600);
    const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
    if (!stored) {
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return { success: true, data: INITIAL_PRODUCTS };
    }
    return { success: true, data: JSON.parse(stored) };
  }
};

export const getProductById = async (id: string): Promise<ApiResponse<Product>> => {
  if (IS_CLOUD_MODE) {
    try {
       // Search by field _id because docID might be different or same
       const q = query(collection(db, "products"), where("_id", "==", id));
       const querySnapshot = await getDocs(q);
       if (!querySnapshot.empty) {
         return { success: true, data: querySnapshot.docs[0].data() as Product };
       }
       return { success: false, message: "Not found" };
    } catch (e) { return { success: false, message: "Cloud Error" }; }
  } else {
    await delay(400);
    const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
    const products: Product[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
    const product = products.find(p => p._id === id);
    if (!product) return { success: false, message: 'Product not found' };
    return { success: true, data: product };
  }
};

export const createProduct = async (productData: Omit<Product, '_id' | 'createdAt'>): Promise<ApiResponse<Product>> => {
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

  if (IS_CLOUD_MODE) {
    try {
      await setDoc(doc(db, "products", newProduct._id), newProduct);
      return { success: true, data: newProduct };
    } catch (e) { return { success: false, message: "Failed to create" }; }
  } else {
    await delay(800);
    const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
    const products: Product[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
    const updatedProducts = [newProduct, ...products];
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    triggerUpdate(DB_KEYS.PRODUCTS);
    return { success: true, data: newProduct };
  }
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<ApiResponse<Product>> => {
  if (IS_CLOUD_MODE) {
     try {
        const productRef = doc(db, "products", id);
        await updateDoc(productRef, productData);
        return { success: true, data: { ...productData, _id: id } as Product }; // Partial return
     } catch (e) { return { success: false, message: "Failed to update" }; }
  } else {
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
  }
};

export const deleteProduct = async (id: string): Promise<ApiResponse<null>> => {
  if (IS_CLOUD_MODE) {
    try {
      await deleteDoc(doc(db, "products", id));
      return { success: true, message: "Deleted" };
    } catch (e) { return { success: false, message: "Failed to delete" }; }
  } else {
    await delay(500);
    const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
    const products: Product[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
    const filtered = products.filter(p => p._id !== id);
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(filtered));
    triggerUpdate(DB_KEYS.PRODUCTS);
    return { success: true, message: 'Product deleted' };
  }
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

  if (IS_CLOUD_MODE) {
    try {
      await setDoc(doc(db, "transactions", transaction._id), transaction);
      return { success: true, data: transaction };
    } catch (e) { return { success: false, message: "Failed to create trx" }; }
  } else {
    await delay(1000);
    const storedTrx = localStorage.getItem(DB_KEYS.TRANSACTIONS);
    const transactions: Transaction[] = storedTrx ? JSON.parse(storedTrx) : [];
    localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify([transaction, ...transactions]));
    triggerUpdate(DB_KEYS.TRANSACTIONS);
    return { success: true, data: transaction };
  }
};

export const getTransactionById = async (id: string): Promise<ApiResponse<Transaction>> => {
  if (IS_CLOUD_MODE) {
    try {
      const docRef = doc(db, "transactions", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return { success: true, data: docSnap.data() as Transaction };
      return { success: false, message: "Not found" };
    } catch(e) { return { success: false, message: "Error" }; }
  } else {
    await delay(400);
    const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
    const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
    const trx = transactions.find(t => t._id === id);
    if (!trx) return { success: false, message: 'Transaction not found' };
    return { success: true, data: trx };
  }
};

export const uploadTransactionProof = async (id: string, base64Image: string): Promise<ApiResponse<Transaction>> => {
  if (IS_CLOUD_MODE) {
    try {
        const ref = doc(db, "transactions", id);
        // Note: Storing heavy base64 in Firestore is bad practice (max 1MB). 
        // Ideally use Firebase Storage, but for simplicity keeping it base64 string in doc.
        const newData = { proofImageUrl: base64Image, status: 'waiting_verification' };
        await updateDoc(ref, newData as any);
        
        // Return full updated obj
        const updated = await getDoc(ref);
        return { success: true, data: updated.data() as Transaction };
    } catch(e) { return { success: false, message: "Error uploading" }; }
  } else {
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
  }
};

export const updateTransactionStatus = async (id: string, status: 'success' | 'failed'): Promise<ApiResponse<Transaction>> => {
   if (IS_CLOUD_MODE) {
     try {
       const ref = doc(db, "transactions", id);
       await updateDoc(ref, { status });
       const updated = await getDoc(ref);
       return { success: true, data: updated.data() as Transaction };
     } catch(e) { return { success: false, message: "Error" }; }
   } else {
     await delay(500);
     const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
     const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
     const index = transactions.findIndex(t => t._id === id);
     if (index === -1) return { success: false, message: 'Transaction not found' };
     transactions[index].status = status;
     localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
     triggerUpdate(DB_KEYS.TRANSACTIONS);
     return { success: true, data: transactions[index] };
   }
};

export const updateTransactionResi = async (id: string, resi: string): Promise<ApiResponse<Transaction>> => {
    if (IS_CLOUD_MODE) {
        try {
            const ref = doc(db, "transactions", id);
            await updateDoc(ref, { resi });
            const updated = await getDoc(ref);
            return { success: true, data: updated.data() as Transaction };
        } catch(e) { return { success: false, message: "Error" }; }
    } else {
        await delay(400);
        const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
        const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
        const index = transactions.findIndex(t => t._id === id);
        if (index === -1) return { success: false, message: 'Transaction not found' };
        transactions[index].resi = resi;
        localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
        triggerUpdate(DB_KEYS.TRANSACTIONS);
        return { success: true, data: transactions[index] };
    }
};

export const getTransactions = async (): Promise<ApiResponse<Transaction[]>> => {
  if (IS_CLOUD_MODE) {
    try {
      const q = await getDocs(collection(db, "transactions"));
      const trxs: Transaction[] = [];
      q.forEach(d => trxs.push(d.data() as Transaction));
      // Sort in memory for now
      return { success: true, data: trxs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
    } catch (e) { return { success: false, message: "Error" }; }
  } else {
    await delay(600);
    const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
    return { success: true, data: stored ? JSON.parse(stored) : [] };
  }
};

export const verifyDownloadToken = async (token: string): Promise<ApiResponse<{url: string, product: string, transaction: Transaction}>> => {
  if (IS_CLOUD_MODE) {
      try {
          const q = query(collection(db, "transactions"), where("downloadToken", "==", token));
          const snapshot = await getDocs(q);
          if (snapshot.empty) return { success: false, message: "Invalid Token" };
          
          const trx = snapshot.docs[0].data() as Transaction;
          if (trx.status !== 'success') return { success: false, message: "Payment not verified" };
          
          const prodRes = await getProductById(trx.productId);
          if (!prodRes.data) return { success: false, message: "Product missing" };
          
          return { success: true, data: { url: prodRes.data.fileUrl, product: prodRes.data.name, transaction: trx } };
      } catch (e) { return { success: false, message: "Error" }; }
  } else {
    await delay(500);
    const storedTrx = localStorage.getItem(DB_KEYS.TRANSACTIONS);
    const transactions: Transaction[] = storedTrx ? JSON.parse(storedTrx) : [];
    const trx = transactions.find(t => t.downloadToken === token);
    if (!trx || trx.status !== 'success') {
        return { success: false, message: 'Invalid token or Payment not verified yet.' };
    }
    const prodRes = await getProductById(trx.productId);
    if (!prodRes.data) return { success: false, message: 'Product no longer exists' };
    return { success: true, data: { url: prodRes.data.fileUrl, product: prodRes.data.name, transaction: trx } };
  }
};

// --- REVIEWS ---
export const createReview = async (reviewData: Omit<Review, '_id' | 'createdAt'>): Promise<ApiResponse<Review>> => {
  const newReview: Review = {
    ...reviewData,
    _id: `rev_${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  if (IS_CLOUD_MODE) {
     try {
         await setDoc(doc(db, "reviews", newReview._id), newReview);
         // Note: Aggregation (rating calculation) typically done via Cloud Functions or manually updating product doc here.
         // Skipping strict aggregation for simplicity in this hybrid mock.
         return { success: true, data: newReview };
     } catch (e) { return { success: false, message: "Error" }; }
  } else {
    await delay(800);
    const storedReviews = localStorage.getItem(DB_KEYS.REVIEWS);
    const reviews: Review[] = storedReviews ? JSON.parse(storedReviews) : [];
    const updatedReviews = [newReview, ...reviews];
    localStorage.setItem(DB_KEYS.REVIEWS, JSON.stringify(updatedReviews));

    // Update Product Stats (Local Only logic preserved)
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
  }
};

export const getReviewsByProductId = async (productId: string): Promise<ApiResponse<Review[]>> => {
  if (IS_CLOUD_MODE) {
      try {
          const q = query(collection(db, "reviews"), where("productId", "==", productId));
          const snapshot = await getDocs(q);
          const reviews: Review[] = [];
          snapshot.forEach(d => reviews.push(d.data() as Review));
          return { success: true, data: reviews };
      } catch (e) { return { success: false, message: "Error" }; }
  } else {
    await delay(400);
    const stored = localStorage.getItem(DB_KEYS.REVIEWS);
    const reviews: Review[] = stored ? JSON.parse(stored) : [];
    const productReviews = reviews.filter(r => r.productId === productId);
    return { success: true, data: productReviews };
  }
};