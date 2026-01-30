import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getTransactions, deleteProduct } from '../services/mockApi';
import { Product, Transaction } from '../types';
import { Plus, Trash2, Lock, Key, ArrowRight, ShieldAlert } from 'lucide-react';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'products' | 'transactions'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Check session storage for existing auth
    const isAuth = sessionStorage.getItem('whllxyz_admin_auth');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
      refreshData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput === 'WILKANIA') {
      sessionStorage.setItem('whllxyz_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
      refreshData();
    } else {
      setAuthError('Access Denied: Invalid Token');
      setTokenInput('');
    }
  };

  const refreshData = async () => {
    const p = await getProducts();
    const t = await getTransactions();
    if (p.data) setProducts(p.data);
    if (t.data) setTransactions(t.data);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this product?')) {
      await deleteProduct(id);
      refreshData();
    }
  };

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  });

  // --- RENDER LOGIN SCREEN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-gray-500 mb-8">Please enter the security token to manage the store.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Key className="w-4 h-4" />
              </div>
              <input 
                type="password" 
                placeholder="Enter Token"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>
            
            {authError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
                {authError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              Verify Access
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD IF AUTHENTICATED ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage products and track sales</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => {
                    sessionStorage.removeItem('whllxyz_admin_auth');
                    setIsAuthenticated(false);
                }}
                className="text-gray-500 hover:text-red-600 px-4 py-2 text-sm font-medium transition-colors"
            >
                Logout
            </button>
            <button 
            onClick={() => navigate('/admin/add')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
            <Plus className="w-4 h-4" />
            Add Product
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Products
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'transactions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Transactions
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'products' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Product Name</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Date Added</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                            <img src={p.imageUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <span className="font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatter.format(p.price)}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No products found. Click "Add Product" to start selling.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Customer</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Item</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{t._id}</td>
                    <td className="px-6 py-4">{t.customerEmail}</td>
                    <td className="px-6 py-4 text-gray-600">{t.productName}</td>
                    <td className="px-6 py-4 font-medium">{formatter.format(t.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                 {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;