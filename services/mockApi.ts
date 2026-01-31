import { Product, Transaction, ApiResponse, StoreSettings, Review, PaymentMethod } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore';

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyAFxvSKso3_4EtADN8UNUg6Ah8shTQqmtY",
  authDomain: "wilka-90494.firebaseapp.com",
  projectId: "wilka-90494",
  storageBucket: "wilka-90494.firebasestorage.app",
  messagingSenderId: "186984944673",
  appId: "1:186984944673:web:2d17ce4ae4ca3986803f60",
  measurementId: "G-RS9NQFE4YF"
};

// ============================================================================
// ⚠️ JANGAN UBAH KODE DI BAWAH GARIS INI ⚠️
// ============================================================================

// Logic Check: Apakah user sudah paste config?
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "PASTE_CONFIG_DARI_FIREBASE_DISINI" && firebaseConfig.apiKey !== "GANTI_DENGAN_API_KEY_ANDA";
export const IS_CLOUD_MODE = isConfigured;

let db: any;

// Initialize Firebase
if (IS_CLOUD_MODE) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("🔥 Connected to Firebase Cloud Database");
  } catch (e) {
    console.error("Firebase Init Error - Cek Config Anda:", e);
  }
} else {
  console.log("⚠️ Running in LOCAL STORAGE Mode (Offline)");
}

const DB_KEYS = {
  PRODUCTS: 'whllxyz_products',
  TRANSACTIONS: 'whllxyz_transactions',
  SETTINGS: 'whllxyz_settings',
  REVIEWS: 'whllxyz_reviews'
};

// --- INITIAL DUMMY DATA (Hanya dipakai jika OFFLINE) ---
const INITIAL_PRODUCTS: Product[] = [
  {
    _id: "prod_demo_1",
    name: "Contoh Produk (Offline)",
    description: "Ini adalah data dummy karena Firebase belum dikoneksikan. Silakan edit services/mockApi.ts",
    price: 100000,
    category: "Software",
    imageUrl: "https://images.unsplash.com/photo-1661956602116-aa6865609028",
    fileUrl: "#",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_SETTINGS: StoreSettings = {
  bankName: 'BCA', accountNumber: '123', accountHolder: 'Admin', instructions: 'Transfer', adminPhone: '628123', paymentMethods: [], backgroundImage: ''
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const triggerUpdate = (key: string) => {
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('db_update', { detail: { key } }));
};

// =========================================================
// HYBRID FUNCTIONS (Firebase Priority)
// =========================================================

// --- SETTINGS ---
export const getStoreSettings = async (): Promise<ApiResponse<StoreSettings>> => {
  if (IS_CLOUD_MODE && db) {
    try {
      const docRef = doc(db, "settings", "general");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() as StoreSettings };
      }
      return { success: true, data: DEFAULT_SETTINGS };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Cloud Error" };
    }
  }
  // Fallback Local
  const stored = localStorage.getItem(DB_KEYS.SETTINGS);
  return { success: true, data: stored ? JSON.parse(stored) : DEFAULT_SETTINGS };
};

export const saveStoreSettings = async (settings: StoreSettings): Promise<ApiResponse<StoreSettings>> => {
  if (IS_CLOUD_MODE && db) {
    try {
      await setDoc(doc(db, "settings", "general"), settings);
      return { success: true, data: settings };
    } catch (e) { return { success: false, message: "Save Error" }; }
  }
  localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
  triggerUpdate(DB_KEYS.SETTINGS);
  return { success: true, data: settings };
};

// --- PRODUCTS ---
export const getProducts = async (): Promise<ApiResponse<Product[]>> => {
  if (IS_CLOUD_MODE && db) {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const products: Product[] = [];
      querySnapshot.forEach((doc) => products.push(doc.data() as Product));
      return { success: true, data: products };
    } catch (e) { return { success: false, message: "Cloud Error" }; }
  }
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  return { success: true, data: stored ? JSON.parse(stored) : INITIAL_PRODUCTS };
};

export const getProductById = async (id: string): Promise<ApiResponse<Product>> => {
  if (IS_CLOUD_MODE && db) {
    try {
       const q = query(collection(db, "products"), where("_id", "==", id));
       const querySnapshot = await getDocs(q);
       if (!querySnapshot.empty) return { success: true, data: querySnapshot.docs[0].data() as Product };
       return { success: false, message: "Not found" };
    } catch (e) { return { success: false, message: "Cloud Error" }; }
  }
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

  if (IS_CLOUD_MODE && db) {
    try {
      await setDoc(doc(db, "products", newProduct._id), newProduct);
      return { success: true, data: newProduct };
    } catch (e) { return { success: false, message: "Create Error" }; }
  }
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  const products = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify([newProduct, ...products]));
  triggerUpdate(DB_KEYS.PRODUCTS);
  return { success: true, data: newProduct };
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<ApiResponse<Product>> => {
  if (IS_CLOUD_MODE && db) {
     try {
        await updateDoc(doc(db, "products", id), productData);
        return { success: true, data: { ...productData, _id: id } as Product };
     } catch (e) { return { success: false, message: "Update Error" }; }
  }
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
  if (IS_CLOUD_MODE && db) {
    try {
      await deleteDoc(doc(db, "products", id));
      return { success: true, message: "Deleted" };
    } catch (e) { return { success: false, message: "Delete Error" }; }
  }
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

  if (IS_CLOUD_MODE && db) {
    try {
      await setDoc(doc(db, "transactions", transaction._id), transaction);
      return { success: true, data: transaction };
    } catch (e) { return { success: false, message: "Trx Error" }; }
  }
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions = stored ? JSON.parse(stored) : [];
  localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify([transaction, ...transactions]));
  triggerUpdate(DB_KEYS.TRANSACTIONS);
  return { success: true, data: transaction };
};

export const getTransactionById = async (id: string): Promise<ApiResponse<Transaction>> => {
  if (IS_CLOUD_MODE && db) {
    try {
      const docSnap = await getDoc(doc(db, "transactions", id));
      if (docSnap.exists()) return { success: true, data: docSnap.data() as Transaction };
      return { success: false, message: "Not found" };
    } catch(e) { return { success: false, message: "Error" }; }
  }
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  const transactions = stored ? JSON.parse(stored) : [];
  const trx = transactions.find((t: Transaction) => t._id === id);
  return trx ? { success: true, data: trx } : { success: false, message: 'Not found' };
};

export const uploadTransactionProof = async (id: string, base64Image: string): Promise<ApiResponse<Transaction>> => {
  if (IS_CLOUD_MODE && db) {
    try {
        const ref = doc(db, "transactions", id);
        await updateDoc(ref, { proofImageUrl: base64Image, status: 'waiting_verification' });
        const updated = await getDoc(ref);
        return { success: true, data: updated.data() as Transaction };
    } catch(e) { return { success: false, message: "Upload Error" }; }
  }
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
   if (IS_CLOUD_MODE && db) {
     try {
       const ref = doc(db, "transactions", id);
       await updateDoc(ref, { status });
       const updated = await getDoc(ref);
       return { success: true, data: updated.data() as Transaction };
     } catch(e) { return { success: false, message: "Error" }; }
   }
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
    if (IS_CLOUD_MODE && db) {
        try {
            const ref = doc(db, "transactions", id);
            await updateDoc(ref, { resi });
            const updated = await getDoc(ref);
            return { success: true, data: updated.data() as Transaction };
        } catch(e) { return { success: false, message: "Error" }; }
    }
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
  if (IS_CLOUD_MODE && db) {
    try {
      const q = await getDocs(collection(db, "transactions"));
      const trxs: Transaction[] = [];
      q.forEach(d => trxs.push(d.data() as Transaction));
      return { success: true, data: trxs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
    } catch (e) { return { success: false, message: "Error" }; }
  }
  const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
  return { success: true, data: stored ? JSON.parse(stored) : [] };
};

export const verifyDownloadToken = async (token: string): Promise<ApiResponse<{url: string, product: string, transaction: Transaction}>> => {
  if (IS_CLOUD_MODE && db) {
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
  }
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

  if (IS_CLOUD_MODE && db) {
     try {
         await setDoc(doc(db, "reviews", newReview._id), newReview);
         return { success: true, data: newReview };
     } catch (e) { return { success: false, message: "Error" }; }
  }
  const stored = localStorage.getItem(DB_KEYS.REVIEWS);
  const reviews = stored ? JSON.parse(stored) : [];
  localStorage.setItem(DB_KEYS.REVIEWS, JSON.stringify([newReview, ...reviews]));
  triggerUpdate(DB_KEYS.REVIEWS);
  return { success: true, data: newReview };
};

export const getReviewsByProductId = async (productId: string): Promise<ApiResponse<Review[]>> => {
  if (IS_CLOUD_MODE && db) {
      try {
          const q = query(collection(db, "reviews"), where("productId", "==", productId));
          const snapshot = await getDocs(q);
          const reviews: Review[] = [];
          snapshot.forEach(d => reviews.push(d.data() as Review));
          return { success: true, data: reviews };
      } catch (e) { return { success: false, message: "Error" }; }
  }
  const stored = localStorage.getItem(DB_KEYS.REVIEWS);
  const reviews = stored ? JSON.parse(stored) : [];
  return { success: true, data: reviews.filter((r: Review) => r.productId === productId) };
};

// Export these for Admin Panel
export const updateCloudConfig = () => { alert("Harap edit file services/mockApi.ts langsung."); return false; };
export const disconnectCloud = () => { alert("Harap edit file services/mockApi.ts langsung."); };
