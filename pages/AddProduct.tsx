import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../services/mockApi';
import { ArrowLeft, Save, UploadCloud, Tag, FileText, Image as ImageIcon, LayoutGrid } from 'lucide-react';

const CATEGORIES = [
  "UI Kits",
  "Templates", 
  "E-Books",
  "Icons",
  "Software",
  "Audio",
  "Photography"
];

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Security Check
  useEffect(() => {
    const isAuth = sessionStorage.getItem('whllxyz_admin_auth');
    if (isAuth !== 'true') {
      // Redirect to admin login if not authenticated
      navigate('/admin');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'UI Kits',
    description: '',
    imageUrl: 'https://picsum.photos/800/600',
    fileUrl: 'https://example.com/file.zip'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createProduct({
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        imageUrl: formData.imageUrl,
        fileUrl: formData.fileUrl
      });
      
      // Redirect back to admin dashboard after success
      navigate('/admin');
    } catch (error) {
      alert("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500">Create a new digital asset listing</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* General Info Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">General Information</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Ultimate UI Kit"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (IDR)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <span className="text-xs font-bold">Rp</span>
                  </div>
                  <input 
                    required
                    type="number" 
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <select
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="relative">
                <textarea 
                  required
                  placeholder="Describe your product details..."
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[120px]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Media & Files Section */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Assets</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Cover)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <input 
                  required
                  type="url" 
                  placeholder="https://..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Direct link to product cover image.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Download URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <input 
                  required
                  type="url" 
                  placeholder="https://..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.fileUrl}
                  onChange={e => setFormData({...formData, fileUrl: e.target.value})}
                />
              </div>
              <div className="mt-2 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex items-start gap-2">
                <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>In a real production app, you would upload the file directly here. For this demo, please provide a direct download link (e.g., from Dropbox, Google Drive, or S3).</p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex items-center gap-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => navigate('/admin')}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Publish Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;