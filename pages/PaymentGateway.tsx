import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransactionById, uploadTransactionProof, getStoreSettings } from '../services/mockApi';
import { Transaction, StoreSettings, PaymentMethod } from '../types';
import { Loader2, ShieldCheck, Copy, CheckCircle, AlertCircle, Home, Check, CreditCard, User, Upload, MessageCircle, Clock, LayoutDashboard, Wallet, QrCode, RefreshCw } from 'lucide-react';
import { useToast } from '../components/ToastContext';

const PaymentGateway: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [activeMethods, setActiveMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Safety Redirect for Invalid IDs
  useEffect(() => {
    if (!transactionId || transactionId === 'undefined' || transactionId === 'null') {
      navigate('/', { replace: true });
    }
  }, [transactionId, navigate]);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!transactionId || transactionId === 'undefined') return;
    
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [trxRes, settingsRes] = await Promise.all([
          getTransactionById(transactionId),
          getStoreSettings()
      ]);

      if (trxRes.data) {
          setTransaction(trxRes.data);
      }
      
      if (settingsRes.data) {
          const stg = settingsRes.data;
          setSettings(stg);
          
          if (stg.paymentMethods) {
            const enabled = stg.paymentMethods.filter(m => m.enabled);
            setActiveMethods(enabled);
            setSelectedMethod(prev => prev || (enabled.length > 0 ? enabled[0] : null));
          }
      }
    } catch (error) {
       console.error("Fetch error", error);
       addToast("Failed to load payment details", 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transactionId, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload Logic
  const handleUploadProof = async () => {
    if (!transactionId || !selectedFile) return;
    setUploading(true);
    
    // Simulate File to Base64
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await uploadTransactionProof(transactionId, base64);
      if (res.success && res.data) {
        setTransaction(res.data);
        addToast("Proof uploaded successfully! Waiting for verification.", 'success');
        window.scrollTo(0,0);
      } else {
        addToast("Upload failed. Please try again.", 'error');
      }
      setUploading(false);
    };
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast("Copied to clipboard", 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!settings?.adminPhone || !transaction) return;
    const msg = `Halo Admin, saya sudah transfer via ${selectedMethod?.name || 'Bank Transfer'} untuk Order ID: ${transaction._id.slice(-6)} (${transaction.productName}). Mohon dicek.`;
    const url = `https://wa.me/${settings.adminPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleManualRefresh = () => {
      fetchData(true);
      addToast("Status refreshed", 'info');
  };

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

  const getMethodIcon = (type: string) => {
    switch(type) {
      case 'bank': return <CreditCard className="w-5 h-5" />;
      case 'ewallet': return <Wallet className="w-5 h-5" />;
      case 'qris': return <QrCode className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
      <p className="text-gray-200">Loading payment details...</p>
    </div>
  );

  if (!transaction || !settings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center">
           <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
             <AlertCircle className="w-8 h-8" />
           </div>
           <h2 className="text-xl font-bold text-white mb-2">Transaction Not Found</h2>
           <p className="text-gray-300 mb-6">
             The transaction ID is invalid or expired.
           </p>
           <button 
             onClick={() => navigate('/')}
             className="w-full bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/10"
           >
             <LayoutDashboard className="w-4 h-4" /> Return to Dashboard
           </button>
        </div>
      </div>
    );
  }

  if (transaction.status === 'success') {
    setTimeout(() => navigate(`/success/${transaction.downloadToken}`), 100);
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-green-400"/> 
        <span className="text-gray-200 font-medium">Payment verified! Redirecting to download...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center">
      <div className="glass-panel rounded-3xl max-w-md w-full overflow-hidden relative backdrop-blur-2xl">
        {refreshing && (
             <div className="absolute top-0 left-0 w-full h-1 bg-blue-900 overflow-hidden z-10">
                 <div className="w-full h-full bg-blue-400 animate-pulse origin-left"></div>
             </div>
        )}

        <div className={`${transaction.status === 'waiting_verification' ? 'bg-orange-500/80' : 'bg-blue-600/80'} backdrop-blur-xl px-6 py-4 flex items-center justify-between text-white border-b border-white/10`}>
          <div className="flex items-center gap-2 font-bold">
            {transaction.status === 'waiting_verification' ? <Clock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            <span>{transaction.status === 'waiting_verification' ? 'Verification Pending' : 'Manual Transfer'}</span>
          </div>
          <div className="text-sm opacity-80">Order #{transaction._id.slice(-6)}</div>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-sm text-gray-300 mb-1">Total Amount</p>
            <h2 className="text-4xl font-bold text-white tracking-tight">{formatter.format(transaction.amount)}</h2>
            <p className="text-sm text-blue-200 mt-2 font-medium bg-blue-500/20 inline-block px-3 py-1 rounded-full border border-blue-500/30">{transaction.productName}</p>
          </div>

          {activeMethods.length === 0 ? (
             <div className="bg-red-500/20 text-red-300 p-4 rounded-lg text-sm text-center mb-6 border border-red-500/30">
                No payment methods are currently active. Please contact admin.
             </div>
          ) : (
             <div className="mb-6">
                <p className="text-xs font-bold text-gray-300 uppercase mb-2">Select Payment Method</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {activeMethods.map(method => (
                        <button 
                            key={method.id}
                            onClick={() => setSelectedMethod(method)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border min-w-[80px] transition-all ${selectedMethod?.id === method.id ? 'border-blue-400/50 bg-blue-500/20 text-blue-200' : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            {getMethodIcon(method.type)}
                            <span className="text-xs font-bold mt-1">{method.name}</span>
                        </button>
                    ))}
                </div>
             </div>
          )}

          {selectedMethod && (
            <div className="bg-black/30 border border-white/10 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 text-white rounded-lg border border-white/5">{getMethodIcon(selectedMethod.type)}</div>
                    <div>
                        <h3 className="font-bold text-white">{selectedMethod.name}</h3>
                        <p className="text-xs text-gray-300 capitalize">{selectedMethod.type === 'qris' ? 'Scan QR Code' : 'Transfer Manual'}</p>
                    </div>
                 </div>
              </div>
              
              {selectedMethod.type === 'qris' ? (
                  <div className="flex flex-col items-center gap-2">
                     <div className="p-2 bg-white rounded-lg border border-white/20 shadow-sm">
                        <img src={selectedMethod.accountNumber} alt="QRIS" className="w-48 h-48 object-contain" />
                     </div>
                     <p className="text-xs text-gray-300 text-center mt-1">Scan using any supported e-wallet or bank app.</p>
                  </div>
              ) : (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">{selectedMethod.type === 'ewallet' ? 'Phone Number' : 'Account Number'}</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="text-xl font-mono font-bold text-white bg-black/40 px-3 py-2 rounded-lg border border-white/10 flex-1 break-all">{selectedMethod.accountNumber}</code>
                            <button onClick={() => handleCopy(selectedMethod.accountNumber)} className={`p-3 rounded-lg border border-white/10 ${copied ? 'text-green-400 bg-green-500/20' : 'text-blue-300 hover:bg-white/10'}`}>{copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 p-3 rounded-lg border border-white/5">
                        <User className="w-4 h-4 text-gray-400" />
                        <div><p className="text-xs text-gray-400">Account Name</p><p className="font-medium text-gray-200">{selectedMethod.accountHolder}</p></div>
                    </div>
                </div>
              )}
            </div>
          )}

          {transaction.status === 'pending' && (
            <div className="space-y-4">
               <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition-colors relative group">
                 <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-500/30">
                        {selectedFile ? <CheckCircle className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                    </div>
                    <p className="font-medium text-white">{selectedFile ? selectedFile.name : 'Tap to Upload Proof'}</p>
                    <p className="text-xs text-gray-400 mt-1">Screenshots or Photos allowed</p>
                 </div>
               </div>

               <button 
                onClick={handleUploadProof}
                disabled={!selectedFile || uploading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 border border-white/10"
               >
                 {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                 Confirm Payment
               </button>
            </div>
          )}

          {transaction.status === 'waiting_verification' && (
            <div className="text-center space-y-4">
               <div className="bg-orange-500/20 text-orange-200 p-4 rounded-xl text-sm mb-4 border border-orange-500/30">
                 <strong>Proof Uploaded!</strong> Please wait for admin approval.
               </div>
               
               <button 
                 onClick={handleWhatsApp}
                 className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-white/10"
               >
                 <MessageCircle className="w-5 h-5" />
                 Confirm via WhatsApp
               </button>

               <button 
                onClick={handleManualRefresh} 
                disabled={refreshing}
                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
               >
                 <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                 Refresh Status
               </button>
            </div>
          )}

          {transaction.status === 'failed' && (
             <div className="bg-red-500/20 text-red-300 p-4 rounded-xl text-center border border-red-500/30">
                <p className="font-bold">Transaction Rejected</p>
                <p className="text-sm">Please contact admin or try again.</p>
                <button onClick={() => handleWhatsApp()} className="mt-2 text-sm underline font-medium hover:text-white">Contact Admin</button>
             </div>
          )}

          <button onClick={() => navigate(`/product/${transaction.productId}`)} className="w-full mt-6 text-gray-400 hover:text-gray-200 text-sm font-medium">Cancel & Return</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;