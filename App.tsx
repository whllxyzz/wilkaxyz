import React, { Component, ReactNode, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Success from './pages/Success';
import Admin from './pages/Admin';
import AddProduct from './pages/AddProduct';
import PaymentGateway from './pages/PaymentGateway';
import { ToastProvider } from './components/ToastContext';
import { getStoreSettings, IS_CLOUD_MODE } from './services/mockApi';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center">
          <div className="glass-panel p-8 rounded-3xl max-w-lg border border-red-500/30 bg-red-900/20">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-4">The application encountered an unexpected error.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper to provide layout
const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const location = useLocation();
  const isPaymentPage = location.pathname.startsWith('/payment/');

  // Effect to load custom wallpaper from settings
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await getStoreSettings();
        if(settings.data?.backgroundImage) {
           document.body.style.backgroundImage = `url('${settings.data.backgroundImage}')`;
        }
      } catch (e) {
        console.error("Failed to load theme");
      }
    };
    loadTheme();
  }, []); // Run once on mount

  if (isPaymentPage) {
    return <main>{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />
      {/* 
        Adjusted padding:
        Mobile: Top padding for floating nav
        Desktop: Left padding for sidebar, less top padding
      */}
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-8 md:pl-32 transition-all duration-300">
        {children}
      </main>
      
      {/* Optional decorative background glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
      </div>

      {/* OFFLINE MODE WARNING BANNER */}
      {!IS_CLOUD_MODE && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-xs font-bold z-[9999] flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            ⚠️ OFFLINE MODE: Data is NOT syncing between devices. Please configure Firebase in 'services/mockApi.ts'.
        </div>
      )}
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/payment/:transactionId" element={<PaymentGateway />} />
              <Route path="/payment" element={<Navigate to="/" replace />} />
              <Route path="/success/:token" element={<Success />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/add" element={<AddProduct />} />
              <Route path="/admin/edit/:id" element={<AddProduct />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;