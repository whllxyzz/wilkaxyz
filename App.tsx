import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Success from './pages/Success';
import Admin from './pages/Admin';
import AddProduct from './pages/AddProduct';
import PaymentGateway from './pages/PaymentGateway';

// Wrapper to provide layout
const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const location = useLocation();
  // Don't show navbar/footer on payment gateway to mimic external redirect
  const isPaymentPage = location.pathname.startsWith('/payment/');

  if (isPaymentPage) {
    return <main>{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} WhllXyz. All rights reserved.
        </div>
      </footer>
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
    <Router>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/payment/:transactionId" element={<PaymentGateway />} />
          <Route path="/success/:token" element={<Success />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/add" element={<AddProduct />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;