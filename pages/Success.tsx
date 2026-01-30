import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyDownloadToken } from '../services/mockApi';
import { Download, CheckCircle, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

const Success: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      verifyDownloadToken(token).then(res => {
        setLoading(false);
        if (res.success && res.data) {
          setDownloadUrl(res.data.url);
          setProductName(res.data.product);
          // Trigger confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } else {
          setError(res.message || 'Invalid token');
        }
      });
    }
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      {loading ? (
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 w-1/2 rounded mb-2"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>{error}</p>
          <Link to="/" className="mt-4 inline-block text-sm underline">Back to Home</Link>
        </div>
      ) : (
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-blue-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-500 mb-8">
            Thank you for purchasing <strong>{productName}</strong>. You can download your file below. A copy of this link has been sent to your email.
          </p>

          <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 mb-8">
            <p className="text-sm text-gray-500 mb-4">Your secure download link:</p>
            <a 
              href={downloadUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-200 w-full sm:w-auto"
            >
              <Download className="w-5 h-5" />
              Download Product
            </a>
          </div>

          <Link to="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors">
            <Home className="w-4 h-4 mr-2" />
            Return to Store
          </Link>
        </div>
      )}
    </div>
  );
};

export default Success;