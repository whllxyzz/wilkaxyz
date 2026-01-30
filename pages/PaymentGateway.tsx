import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransactionById, updateTransactionStatus } from '../services/mockApi';
import { Transaction } from '../types';
import { Loader2, ShieldCheck, QrCode, Building, Copy, CheckCircle, AlertCircle } from 'lucide-react';

const PaymentGateway: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (transactionId) {
      getTransactionById(transactionId).then(res => {
        setTransaction(res.data || null);
        setLoading(false);
      });
    }
  }, [transactionId]);

  const handleSimulatePayment = async () => {
    if (!transactionId) return;
    setVerifying(true);
    
    try {
      // Simulate backend verifying payment from Midtrans
      const res = await updateTransactionStatus(transactionId, 'success');
      if (res.success && res.data) {
        navigate(`/success/${res.data.downloadToken}`);
      }
    } catch (error) {
      alert("Payment verification failed");
      setVerifying(false);
    }
  };

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Transaction Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="w-5 h-5" />
            <span>Secure Payment</span>
          </div>
          <div className="text-sm opacity-80">Order #{transaction._id.slice(-6)}</div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <h2 className="text-3xl font-bold text-gray-900">{formatter.format(transaction.amount)}</h2>
            <p className="text-sm text-blue-600 mt-2 font-medium bg-blue-50 inline-block px-3 py-1 rounded-full">
              {transaction.productName}
            </p>
          </div>

          {transaction.paymentMethod === 'qris' ? (
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 text-center mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-gray-600" />
                Scan QRIS
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg inline-block border border-gray-200">
                 {/* Generating a static QR Code for visualization */}
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=whllxyz-payment-${transaction._id}`} 
                   alt="Payment QR" 
                   className="w-40 h-40"
                 />
              </div>
              <div className="flex justify-center gap-2 mt-4">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gopay_logo.svg/1200px-Gopay_logo.svg.png" className="h-6 object-contain opacity-70" alt="Gopay"/>
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/2560px-Logo_ovo_purple.svg.png" className="h-6 object-contain opacity-70" alt="Ovo"/>
              </div>
              <p className="text-xs text-gray-400 mt-4">Scan with any e-wallet app</p>
            </div>
          ) : (
             <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-gray-600" />
                  Virtual Account
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bank BCA</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-lg font-mono font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 flex-1">
                        8271 9028 {Math.floor(Math.random() * 10000)}
                      </code>
                      <button className="text-blue-600 p-2 hover:bg-blue-50 rounded" title="Copy">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Process automagically detected. Transfer exact amount.
                  </div>
                </div>
             </div>
          )}

          {/* Action Button */}
          <button 
            onClick={handleSimulatePayment}
            disabled={verifying}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
          >
            {verifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying Payment...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                I Have Paid
              </>
            )}
          </button>
          
          <button 
            onClick={() => navigate(`/product/${transaction.productId}`)}
            className="w-full mt-4 text-gray-500 hover:text-gray-800 text-sm font-medium"
          >
            Cancel Transaction
          </button>

        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;