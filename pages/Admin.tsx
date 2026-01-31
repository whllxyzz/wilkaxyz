import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getTransactions, deleteProduct, getStoreSettings, saveStoreSettings, updateTransactionStatus, updateTransactionResi, IS_CLOUD_MODE } from '../services/mockApi';
import { Product, Transaction, StoreSettings, PaymentMethod } from '../types';
import { Plus, Trash2, Lock, Edit, DollarSign, ShoppingBag, TrendingUp, Save, CreditCard, Check, X, Eye, Phone, Wallet, QrCode, Loader2, LogOut, Calendar, Filter, ArrowUpDown, Search, Image as ImageIcon, Monitor, Upload, Cloud, HardDrive, AlertTriangle, ExternalLink, HelpCircle, ChevronRight, Copy, Terminal } from 'lucide-react';
import { useToast } from '../components/ToastContext';

// Theme Presets
const WALLPAPER_PRESETS = [
    { name: 'Aurora Dark', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' },
    { name: 'Cyberpunk City', url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2670&auto=format&fit=crop' },
    { name: 'Deep Space', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2672&auto=format&fit=crop' },
    { name: 'Minimal Glass', url: 'https://images.unsplash.com/photo-1496247749665-49cf5bf8756f?q=80&w=2523&auto=format&fit=crop' },
];

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'products' | 'transactions' | 'history' | 'settings' | 'guide'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // History Tab State
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySort, setHistorySort] = useState<'newest' | 'oldest'>('newest');
  const [historySearch, setHistorySearch] = useState('');
  
  // Loading States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingTransactionId, setUpdatingTransactionId] = useState<string | null>(null); 
  
  // Settings State
  const [settings, setSettings] = useState<StoreSettings>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    instructions: '',
    adminPhone: '',
    paymentMethods: [],
    backgroundImage: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Modal State for Proof
  const [viewProof, setViewProof] = useState<string | null>(null);

  // Edit Resi State
  const [editingResi, setEditingResi] = useState<string | null>(null); 
  const [resiInput, setResiInput] = useState('');

  useEffect(() => {
    const isAuth = sessionStorage.getItem('whllxyz_admin_auth');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
      refreshData();
    }
  }, []);
  
  // Auto-switch to guide if offline
  useEffect(() => {
      if (isAuthenticated && !IS_CLOUD_MODE) {
          setActiveTab('guide');
      }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput === 'WILKANIA') {
      sessionStorage.setItem('whllxyz_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
      addToast("Welcome back, Admin!", 'success');
      refreshData();
    } else {
      setAuthError('Access Denied: Invalid Token');
      addToast("Invalid access token", 'error');
      setTokenInput('');
    }
  };

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to logout?")) {
        sessionStorage.removeItem('whllxyz_admin_auth'); 
        setIsAuthenticated(false);
        addToast("Logged out successfully", 'info');
        navigate('/'); 
    }
  };

  const refreshData = async () => {
    const p = await getProducts();
    const t = await getTransactions();
    const s = await getStoreSettings();
    
    if (p.data) setProducts(p.data);
    if (t.data) setTransactions(t.data);
    if (s.data) setSettings(s.data || settings);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setDeletingId(id);
      try {
        await deleteProduct(id);
        setProducts(current => current.filter(p => p._id !== id));
        addToast("Product deleted", 'success');
      } catch (error) {
        addToast("Failed to delete product", 'error');
        refreshData(); 
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleStatusChange = async (id: string, status: 'success' | 'failed') => {
    const action = status === 'success' ? 'APPROVE' : 'REJECT';
    if (window.confirm(`Are you sure you want to ${action} this transaction?`)) {
       setUpdatingTransactionId(id);
       try {
        await updateTransactionStatus(id, status);
        await refreshData();
        addToast(`Transaction ${status === 'success' ? 'approved' : 'rejected'}`, 'success');
       } catch (error) {
           addToast("Failed to update status", 'error');
       } finally {
           setUpdatingTransactionId(null);
       }
    }
  };

  const handleSaveResi = async (id: string) => {
    await updateTransactionResi(id, resiInput);
    setEditingResi(null);
    setResiInput('');
    addToast("Tracking number updated", 'success');
    refreshData();
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            addToast("File is too large (Max 5MB)", 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setSettings(prev => ({ ...prev, backgroundImage: base64String }));
            document.body.style.backgroundImage = `url('${base64String}')`;
            addToast("Wallpaper uploaded successfully!", 'success');
        };
        reader.readAsDataURL(file);
    }
  };

  const startEditResi = (t: Transaction) => {
    setEditingResi(t._id);
    setResiInput(t.resi || '');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveStoreSettings(settings);
      if (settings.backgroundImage) {
          document.body.style.backgroundImage = `url('${settings.backgroundImage}')`;
      }
      addToast("Store settings saved!", 'success');
    } catch (err) {
      addToast("Failed to save settings", 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: any) => {
    const newMethods = [...settings.paymentMethods];
    newMethods[index] = { ...newMethods[index], [field]: value };
    setSettings({ ...settings, paymentMethods: newMethods });
  };

  const togglePaymentMethod = (index: number) => {
    const newMethods = [...settings.paymentMethods];
    newMethods[index].enabled = !newMethods[index].enabled;
    setSettings({ ...settings, paymentMethods: newMethods });
  };

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'waiting_verification': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const getMethodIcon = (type: string) => {
    switch(type) {
      case 'bank': return <CreditCard className="w-5 h-5" />;
      case 'ewallet': return <Wallet className="w-5 h-5" />;
      case 'qris': return <QrCode className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const getFilteredHistory = () => {
    return transactions.filter(t => {
      const matchesSearch = t._id.toLowerCase().includes(historySearch.toLowerCase()) || 
                          t.productName.toLowerCase().includes(historySearch.toLowerCase()) ||
                          (t.customerEmail || '').toLowerCase().includes(historySearch.toLowerCase());
      const matchesFilter = historyFilter === 'all' || t.status === historyFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return historySort === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const totalRevenue = transactions.filter(t => t.status === 'success').reduce((acc, curr) => acc + curr.amount, 0);
  const successfulSales = transactions.filter(t => t.status === 'success').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30"><Lock className="w-8 h-8" /></div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4 mt-8">
            <input 
              type="password" placeholder="Enter Token" className="glass-input w-full p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white placeholder-gray-400"
              value={tokenInput} onChange={(e) => setTokenInput(e.target.value)}
            />
            {authError && <div className="text-red-400 text-sm">{authError}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">Verify</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {viewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setViewProof(null)}>
          <div className="glass-panel bg-black/80 rounded-xl p-2 max-w-3xl max-h-[90vh] overflow-auto relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewProof(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white transition-colors"><X className="w-5 h-5" /></button>
            <img src={viewProof} alt="Proof" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${IS_CLOUD_MODE ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                {IS_CLOUD_MODE ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                {IS_CLOUD_MODE ? 'ONLINE (Cloud Connected)' : 'OFFLINE (Local Storage Only)'}
            </div>
            {!IS_CLOUD_MODE && <div className="text-xs text-red-300 mt-1 cursor-pointer hover:underline" onClick={() => setActiveTab('guide')}>Database not connected. Click here for help.</div>}
        </div>
        <div className="flex gap-3">
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-200 hover:text-red-400 px-4 py-2 font-medium transition-colors">
                <LogOut className="w-4 h-4" /> Logout
            </button>
            <button onClick={() => navigate('/admin/add')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 border border-white/10"><Plus className="w-4 h-4" /> Add Product</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30"><DollarSign className="w-6 h-6" /></div>
          <div><p className="text-sm text-gray-200 font-medium">Revenue</p><p className="text-2xl font-bold text-white">{formatter.format(totalRevenue)}</p></div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-sm text-gray-200 font-medium">Sales</p><p className="text-2xl font-bold text-white">{successfulSales}</p></div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30"><ShoppingBag className="w-6 h-6" /></div>
          <div><p className="text-sm text-gray-200 font-medium">Products</p><p className="text-2xl font-bold text-white">{products.length}</p></div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex border-b border-white/10 overflow-x-auto">
          {['products', 'transactions', 'history', 'settings', 'guide'].map(tab => (
            <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)} 
                className={`pb-3 px-4 capitalize font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-300 hover:text-white'}`}
            >
                {tab === 'guide' && !IS_CLOUD_MODE && <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />}
                {tab === 'guide' ? 'TUTORIAL FIREBASE' : tab === 'history' ? 'Order History' : tab}
            </button>
          ))}
        </div>

        <div className="glass-panel rounded-xl overflow-hidden min-h-[400px]">
          
          {activeTab === 'guide' && (
              <div className="p-8 max-w-5xl mx-auto text-gray-100">
                  <div className="bg-gradient-to-br from-gray-900 to-slate-900 p-8 rounded-2xl border border-white/10 shadow-2xl">
                      <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                          <Cloud className="w-8 h-8 text-blue-400" />
                          Tutorial Koneksi Database (Langkah-demi-Langkah)
                      </h2>
                      <p className="text-gray-400 mb-8 border-b border-white/10 pb-6">
                        Ikuti panduan ini agar website Anda online sungguhan dan bisa diakses dari HP mana saja.
                      </p>

                      <div className="space-y-12">
                          {/* STEP 1 */}
                          <div className="flex gap-6">
                              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-xl shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.5)]">1</div>
                              <div className="space-y-4 flex-1">
                                  <h3 className="font-bold text-white text-xl">Buat Project Baru</h3>
                                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                      <ol className="list-decimal list-inside space-y-2 text-gray-300">
                                          <li>Buka <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-400 underline font-bold">Firebase Console (Klik Disini)</a>.</li>
                                          <li>Klik kotak besar bertuliskan <strong>"Create a Project"</strong>.</li>
                                          <li>Isi nama project (misal: <code>TokoDigitalSaya</code>). Klik Continue.</li>
                                          <li>Matikan opsi <strong>"Enable Google Analytics"</strong> (Biar cepat & tidak ribet).</li>
                                          <li>Klik tombol biru <strong>"Create Project"</strong>. Tunggu loading selesai, lalu klik Continue.</li>
                                      </ol>
                                  </div>
                              </div>
                          </div>

                          {/* STEP 2 */}
                          <div className="flex gap-6">
                              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white text-xl shrink-0 shadow-[0_0_15px_rgba(147,51,234,0.5)]">2</div>
                              <div className="space-y-4 flex-1">
                                  <h3 className="font-bold text-white text-xl">Bikin Database (Firestore)</h3>
                                  <p className="text-gray-400 text-sm">Ini tempat menyimpan data produk & transaksi Anda.</p>
                                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 grid md:grid-cols-2 gap-4">
                                      <div>
                                          <strong className="text-purple-300 block mb-2">Langkah A: Masuk Menu</strong>
                                          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                                              <li>Di menu kiri layar, cari bagian <strong>"Build"</strong>.</li>
                                              <li>Klik <strong>"Firestore Database"</strong>.</li>
                                              <li>Klik tombol <strong>"Create Database"</strong>.</li>
                                          </ul>
                                      </div>
                                      <div>
                                          <strong className="text-red-300 block mb-2">Langkah B: PENTING!</strong>
                                          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                                              <li>Akan muncul pilihan lokasi, pilih <strong>"Singapore"</strong> (supaya cepat).</li>
                                              <li>Akan muncul pilihan Mode. Pilih <strong>"START IN TEST MODE"</strong>.</li>
                                              <li>Klik <strong>Enable</strong>.</li>
                                          </ul>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* STEP 3 */}
                          <div className="flex gap-6">
                              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center font-bold text-white text-xl shrink-0 shadow-[0_0_15px_rgba(22,163,74,0.5)]">3</div>
                              <div className="space-y-4 flex-1">
                                  <h3 className="font-bold text-white text-xl">Ambil Kunci Rahasia (Config)</h3>
                                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                      <ol className="list-decimal list-inside space-y-2 text-gray-300">
                                          <li>Klik ikon <strong>Gear (⚙️)</strong> di pojok kiri atas (sebelah tulisan "Project Overview").</li>
                                          <li>Pilih menu <strong>"Project Settings"</strong>.</li>
                                          <li>Scroll ke paling bawah halaman.</li>
                                          <li>Anda akan melihat deretan ikon bulat. Klik ikon <strong>`&lt;/&gt;` (Web)</strong>.</li>
                                          <li>Isi nama aplikasi (bebas, misal: "WebToko"). Klik "Register App".</li>
                                          <li>Akan muncul kode panjang. Cari tulisan <code>const firebaseConfig = ...</code></li>
                                          <li>Copy kode di dalam kurung kurawal <code>{'{ ... }'}</code>.</li>
                                      </ol>
                                  </div>
                              </div>
                          </div>

                          {/* STEP 4 */}
                          <div className="flex gap-6">
                              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center font-bold text-white text-xl shrink-0 shadow-[0_0_15px_rgba(234,88,12,0.5)]">4</div>
                              <div className="space-y-4 flex-1">
                                  <h3 className="font-bold text-white text-xl">Tempel Kode (Paste)</h3>
                                  <p className="text-gray-400">Kembali ke kode editor Anda. Buka file <code className="text-yellow-400">services/mockApi.ts</code>.</p>
                                  
                                  <div className="bg-black/80 p-6 rounded-xl border border-white/20 font-mono text-sm relative overflow-hidden">
                                      <div className="absolute top-0 left-0 w-full bg-white/10 px-4 py-1 text-xs text-gray-400 border-b border-white/5 flex items-center gap-2">
                                          <Terminal className="w-3 h-3" /> services/mockApi.ts
                                      </div>
                                      <div className="mt-4 text-gray-500">
                                          // ... kode lain ...
                                      </div>
                                      <div className="my-2 text-green-400 font-bold">
                                          // ⬇️ ⬇️ TEMPEL KODE ANDA DI SINI (TIMPA BAGIAN INI) ⬇️ ⬇️
                                      </div>
                                      <div className="text-blue-300">
                                          const firebaseConfig = {'{'}<br/>
                                          &nbsp;&nbsp;apiKey: "AIzaSyDxxxx...", <span className="text-gray-500">// Pastikan ini bukan "GANTI_DENGAN..."</span><br/>
                                          &nbsp;&nbsp;authDomain: "tokosaya.firebaseapp.com",<br/>
                                          &nbsp;&nbsp;projectId: "tokosaya",<br/>
                                          &nbsp;&nbsp;...<br/>
                                          {'}'};
                                      </div>
                                      <div className="mt-2 text-gray-500">
                                          // ... kode lain ...
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="mt-12 p-6 bg-blue-900/30 border border-blue-500/30 rounded-xl text-center">
                          <h4 className="font-bold text-blue-200 mb-2">Sudah Melakukan Semua Langkah?</h4>
                          <p className="text-gray-300 text-sm mb-4">Jika sudah, refresh halaman ini. Tanda ⚠️ OFFLINE MODE di pojok kiri atas akan berubah menjadi <span className="text-green-400 font-bold">ONLINE</span>.</p>
                          <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                              Refresh Website
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'products' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-100">
                <thead className="bg-white/5 border-b border-white/10 text-white">
                  <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Price</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map(p => (
                    <tr key={p._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                      <td className="px-6 py-4 text-gray-200">{formatter.format(p.price)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                            onClick={() => navigate(`/admin/edit/${p._id}`)} 
                            title="Edit Product"
                            className="text-blue-400 hover:bg-blue-500/20 p-2 rounded-lg transition-colors"
                           >
                            <Edit className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => handleDelete(p._id)} 
                            disabled={deletingId === p._id}
                            title="Delete Product"
                            className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors disabled:opacity-50"
                           >
                            {deletingId === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-300">No products yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-200">
                <thead className="bg-white/5 border-b border-white/10 text-white">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Proof</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Resi/Ref</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map(t => (
                    <tr key={t._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-blue-200">{t._id.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium block text-white">{t.productName}</span>
                        <span className="text-xs text-gray-300">{t.customerEmail}</span>
                      </td>
                      <td className="px-6 py-4 capitalize text-gray-200">{t.paymentMethod.replace('_', ' ')}</td>
                      <td className="px-6 py-4">
                        {t.proofImageUrl ? (
                          <button onClick={() => setViewProof(t.proofImageUrl!)} className="flex items-center gap-1 text-blue-400 hover:underline text-xs">
                            <Eye className="w-3 h-3" /> View Proof
                          </button>
                        ) : <span className="text-gray-400 text-xs">No proof</span>}
                      </td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(t.status)}`}>{t.status.replace('_', ' ').toUpperCase()}</span></td>
                      <td className="px-6 py-4">
                         {t.status === 'success' ? (
                             editingResi === t._id ? (
                                 <div className="flex items-center gap-1">
                                     <input 
                                        type="text" 
                                        className="w-24 p-1 rounded text-xs glass-input text-white" 
                                        value={resiInput} 
                                        onChange={e => setResiInput(e.target.value)}
                                        placeholder="Input Resi"
                                     />
                                     <button onClick={() => handleSaveResi(t._id)} className="text-green-400 hover:text-green-300 bg-green-500/20 p-1 rounded"><Check className="w-3 h-3" /></button>
                                     <button onClick={() => setEditingResi(null)} className="text-red-400 hover:text-red-300 bg-red-500/20 p-1 rounded"><X className="w-3 h-3" /></button>
                                 </div>
                             ) : (
                                 <div className="flex items-center gap-2 group cursor-pointer" onClick={() => startEditResi(t)}>
                                     <span className={`text-xs ${t.resi ? 'text-white font-mono' : 'text-gray-400 italic'}`}>{t.resi || 'Add Resi'}</span>
                                     <Edit className="w-3 h-3 text-gray-400 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                 </div>
                             )
                         ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                            {t.status === 'waiting_verification' && (
                            <>
                                <button 
                                    onClick={() => handleStatusChange(t._id, 'success')} 
                                    disabled={updatingTransactionId === t._id}
                                    title="Approve Transaction" 
                                    className="bg-green-500/20 text-green-400 p-2 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                >
                                    {updatingTransactionId === t._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button 
                                    onClick={() => handleStatusChange(t._id, 'failed')} 
                                    disabled={updatingTransactionId === t._id}
                                    title="Reject Transaction" 
                                    className="bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                >
                                     {updatingTransactionId === t._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                </button>
                            </>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-300">No transactions yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-0">
               {/* Filters Toolbar */}
               <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      type="text" 
                      placeholder="Search ID, Product..." 
                      className="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 outline-none placeholder-gray-400 text-white"
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                    />
                 </div>
                 
                 <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
                    <div className="relative min-w-[140px]">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                        <select 
                            className="glass-input w-full pl-9 pr-8 py-2 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer text-white"
                            value={historyFilter}
                            onChange={e => setHistoryFilter(e.target.value)}
                        >
                            <option value="all" className="bg-slate-800">All Status</option>
                            <option value="success" className="bg-slate-800">Success</option>
                            <option value="pending" className="bg-slate-800">Pending</option>
                            <option value="waiting_verification" className="bg-slate-800">Waiting</option>
                            <option value="failed" className="bg-slate-800">Failed</option>
                        </select>
                    </div>

                    <div className="relative min-w-[140px]">
                        <ArrowUpDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                        <select 
                            className="glass-input w-full pl-9 pr-8 py-2 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer text-white"
                            value={historySort}
                            onChange={e => setHistorySort(e.target.value as any)}
                        >
                            <option value="newest" className="bg-slate-800">Newest First</option>
                            <option value="oldest" className="bg-slate-800">Oldest First</option>
                        </select>
                    </div>
                 </div>
               </div>
               
               <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-200">
                  <thead className="bg-white/5 border-b border-white/10 text-white">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {getFilteredHistory().map(t => (
                      <tr key={t._id}>
                        <td className="px-6 py-4 font-mono text-xs text-blue-200">{t._id.slice(-8)}</td>
                        <td className="px-6 py-4 text-gray-300">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium text-white">{t.productName}</td>
                        <td className="px-6 py-4">{formatter.format(t.amount)}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(t.status)}`}>{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-8 max-w-4xl text-gray-100">
               {/* Same settings content as before */}
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white"><CreditCard className="w-5 h-5 text-blue-400" /> Payment & Contact Setup</h3>
               <form onSubmit={handleSaveSettings} className="space-y-8">
                   <div className="glass-panel p-6 rounded-xl">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2"><Monitor className="w-4 h-4" /> Theme & Appearance</h4>
                      <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-100">Custom Wallpaper</label>
                            <div className="flex gap-3">
                                <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><ImageIcon className="w-4 h-4" /></div>
                                <input 
                                    type="text" 
                                    placeholder="https://..." 
                                    className="glass-input w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none text-white" 
                                    value={settings.backgroundImage || ''} 
                                    onChange={e => setSettings({...settings, backgroundImage: e.target.value})} 
                                    />
                                </div>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={handleWallpaperUpload}
                                    />
                                    <button type="button" className="h-full px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors flex items-center gap-2 whitespace-nowrap">
                                        <Upload className="w-4 h-4" /> Upload File
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Presets */}
                         <div>
                             <label className="block text-sm font-medium mb-2 text-gray-100">Presets</label>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {WALLPAPER_PRESETS.map((preset, idx) => (
                                    <button 
                                    key={idx}
                                    type="button"
                                    onClick={() => setSettings({...settings, backgroundImage: preset.url})}
                                    className={`relative h-20 rounded-lg overflow-hidden border transition-all group ${settings.backgroundImage === preset.url ? 'border-blue-400 ring-2 ring-blue-500/30' : 'border-white/10 hover:border-white/30'}`}
                                    >
                                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs font-bold text-white text-center px-1">{preset.name}</span>
                                    </div>
                                    </button>
                                ))}
                             </div>
                        </div>
                      </div>
                   </div>
                   {/* ... Payment methods form ... */}
                   <div>
                    <h4 className="font-semibold text-white mb-4">Payment Methods</h4>
                    <div className="space-y-4">
                        {settings.paymentMethods && settings.paymentMethods.map((method, index) => (
                            <div key={method.id} className={`p-4 rounded-xl border transition-colors ${method.enabled ? 'border-blue-500/30 bg-blue-500/10' : 'border-white/10 bg-white/5 opacity-70'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center h-full pt-1">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={method.enabled} onChange={() => togglePaymentMethod(index)} />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    
                                    <div className={`p-2 rounded-lg ${method.enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                                        {getMethodIcon(method.type)}
                                    </div>

                                    <div className="w-32">
                                        <p className="font-bold text-sm text-white">{method.name}</p>
                                        <p className="text-xs text-gray-300 capitalize">{method.type}</p>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <input 
                                                type="text" 
                                                className="glass-input w-full p-2 text-sm rounded text-white"
                                                value={method.accountNumber} 
                                                onChange={(e) => updatePaymentMethod(index, 'accountNumber', e.target.value)}
                                                placeholder={method.type === 'qris' ? 'https://...' : '1234567890'}
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                type="text" 
                                                className="glass-input w-full p-2 text-sm rounded text-white"
                                                value={method.accountHolder} 
                                                onChange={(e) => updatePaymentMethod(index, 'accountHolder', e.target.value)}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="glass-panel p-6 rounded-xl mt-4">
                    <h4 className="font-semibold text-white mb-4">Contact Information</h4>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-100">WhatsApp Number (For confirmations)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Phone className="w-4 h-4" /></div>
                            <input type="text" placeholder="62812345678" className="glass-input w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none text-white" value={settings.adminPhone} onChange={e => setSettings({...settings, adminPhone: e.target.value})} />
                        </div>
                    </div>
                 </div>

                   <button type="submit" disabled={savingSettings} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-70 text-lg shadow-lg shadow-blue-500/30 border border-white/10"><Save className="w-5 h-5" /> {savingSettings ? 'Saving...' : 'Save All Settings'}</button>
               </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;