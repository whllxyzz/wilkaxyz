import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, getProductById, updateProduct } from '../services/mockApi';
import { ArrowLeft, Save, UploadCloud, Tag, FileText, Image as ImageIcon, LayoutGrid, Loader2, HardDrive, Sparkles, Wand2, Video, Film, RefreshCcw, Layers } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const CATEGORIES = [
  "UI Kits",
  "Templates", 
  "E-Books",
  "Icons",
  "Software",
  "Audio",
  "Photography"
];

const FILE_TYPES = ["ZIP", "RAR", "PDF", "FIG", "PSD", "AI", "MP3", "MP4"];

const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return "";
  }
};

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMode, setAiMode] = useState<'generate' | 'edit'>('generate');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [improvingText, setImprovingText] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const [videoPrompt, setVideoPrompt] = useState('');
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  useEffect(() => {
    const isAuth = sessionStorage.getItem('whllxyz_admin_auth');
    if (isAuth !== 'true') {
      navigate('/admin');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'UI Kits',
    description: '',
    imageUrl: 'https://picsum.photos/800/600',
    videoUrl: '', 
    fileUrl: 'https://example.com/file.zip',
    fileSize: '150 MB',
    fileType: 'ZIP'
  });

  useEffect(() => {
    if (isEditing && id) {
      getProductById(id).then(res => {
        if (res.success && res.data) {
          setFormData({
            name: res.data.name,
            price: res.data.price.toString(),
            category: res.data.category,
            description: res.data.description,
            imageUrl: res.data.imageUrl,
            videoUrl: res.data.videoUrl || '',
            fileUrl: res.data.fileUrl,
            fileSize: res.data.fileSize || '150 MB',
            fileType: res.data.fileType || 'ZIP'
          });
        }
        setInitialLoading(false);
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        imageUrl: formData.imageUrl,
        videoUrl: formData.videoUrl,
        fileUrl: formData.fileUrl,
        fileSize: formData.fileSize,
        fileType: formData.fileType
      };

      if (isEditing && id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate('/admin');
    } catch (error) {
      alert("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleImproveDescription = async () => {
    if (!process.env.API_KEY) { alert("API Key missing"); return; }
    if (!formData.name) { alert("Please enter a product name first."); return; }
    
    setImprovingText(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a compelling description for "${formData.name}". Draft: "${formData.description}". Category: "${formData.category}". Keep it under 100 words.`,
        });
        if (response.text) setFormData(prev => ({ ...prev, description: response.text || "" }));
    } catch (e) { alert("AI Text Improvement failed."); } finally { setImprovingText(false); }
  };

  const handleGenerateImage = async () => {
    if (!process.env.API_KEY) { alert("API Key missing"); return; }
    if (!aiPrompt) { alert("Please enter a prompt."); return; }
    
    setGeneratingImage(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const parts: any[] = [];
        
        // LOGIC: Image Editing vs New Generation
        if (aiMode === 'edit') {
            let base64Image = "";
            if (formData.imageUrl.startsWith("data:image")) {
                base64Image = formData.imageUrl.split(',')[1];
            } else if (formData.imageUrl.startsWith("http")) {
                const fetched = await urlToBase64(formData.imageUrl);
                if (fetched) base64Image = fetched.split(',')[1];
            }

            if (base64Image) {
                parts.push({ inlineData: { mimeType: 'image/png', data: base64Image } });
            } else {
                alert("Cannot edit: No valid existing image found. Switch to 'Generate New'.");
                setGeneratingImage(false);
                return;
            }
        }

        // Add the text prompt
        parts.push({ text: aiPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
        });

        let newImage = null;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    newImage = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                }
            }
        }
        if (newImage) {
            setFormData(prev => ({ ...prev, imageUrl: newImage }));
            setAiPrompt("");
        } else alert("No image generated.");
    } catch (e) { alert("AI Image Generation failed."); } finally { setGeneratingImage(false); }
  };

  const handleGenerateVideo = async () => {
    try {
      if (!window.aistudio) { alert("AI Studio not detected."); return; }
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) await window.aistudio.openSelectKey();
    } catch (err) {}

    if (!process.env.API_KEY) { alert("API Key missing"); return; }
    
    let base64Image = "";
    if (formData.imageUrl.startsWith("data:image")) base64Image = formData.imageUrl.split(',')[1];
    else if (formData.imageUrl.startsWith("http")) {
        const fetched = await urlToBase64(formData.imageUrl);
        if (fetched) base64Image = fetched.split(',')[1];
    }
    if (!base64Image) { alert("Valid image required."); return; }

    setGeneratingVideo(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt || "Cinematic animation",
        image: { imageBytes: base64Image, mimeType: 'image/png' },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: videoAspectRatio }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoRes.blob();
        setFormData(prev => ({ ...prev, videoUrl: URL.createObjectURL(videoBlob) }));
        setShowVideoPanel(false);
        setVideoPrompt("");
      } else alert("Video generation failed.");
    } catch (e: any) {
        alert("Video generation failed. " + e.message);
    } finally { setGeneratingVideo(false); }
  };

  if (initialLoading) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors border border-white/10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{isEditing ? 'Edit Asset' : 'New Asset'}</h1>
          <p className="text-sm text-gray-300">Fill in the details for your spatial product listing.</p>
        </div>
      </div>

      <div className="glass-panel rounded-[2.5rem] p-8 md:p-10 border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Product Details</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2 pl-1">Product Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300"><Tag className="w-4 h-4" /></div>
                  <input required type="text" placeholder="e.g. Vision Pro Kit" className="glass-input w-full pl-11 pr-4 py-3 rounded-2xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2 pl-1">Price (IDR)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300"><span className="text-xs font-bold">Rp</span></div>
                  <input required type="number" placeholder="0" className="glass-input w-full pl-11 pr-4 py-3 rounded-2xl outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2 pl-1">Category</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300"><LayoutGrid className="w-4 h-4" /></div>
                  <select required className="glass-input w-full pl-11 pr-4 py-3 rounded-2xl outline-none appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-gray-900">{cat}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 pl-1">
                 <label className="block text-sm font-medium text-gray-200">Description</label>
                 <button type="button" onClick={handleImproveDescription} disabled={improvingText} className="flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-500/40 px-3 py-1 rounded-full transition-colors border border-purple-500/30">
                   {improvingText ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} AI Rewrite
                 </button>
              </div>
              <textarea required placeholder="Describe your product details..." className="glass-input w-full p-4 rounded-2xl outline-none min-h-[120px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          <div className="space-y-6 pt-2">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Media & Files</h2>
            
            {/* Image URL with AI Editor */}
            <div>
              <div className="flex justify-between items-center mb-2 pl-1">
                  <label className="block text-sm font-medium text-gray-200">Cover Image</label>
                  <button type="button" onClick={() => setShowAiPanel(!showAiPanel)} className="flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white bg-blue-500/20 hover:bg-blue-500/40 px-3 py-1 rounded-full transition-colors border border-blue-500/30">
                    <Sparkles className="w-3 h-3" /> AI Studio
                  </button>
              </div>

              {showAiPanel && (
                <div className="mb-6 glass-card p-5 rounded-2xl animate-in slide-in-from-top-2 border border-blue-500/30">
                    {/* AI Mode Toggle */}
                    <div className="flex bg-black/40 rounded-lg p-1 mb-4 border border-white/10 w-fit">
                        <button 
                            type="button"
                            onClick={() => setAiMode('generate')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${aiMode === 'generate' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Sparkles className="w-3 h-3" /> Generate New
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAiMode('edit')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${aiMode === 'edit' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Layers className="w-3 h-3" /> Edit Current
                        </button>
                    </div>

                    <p className="text-xs text-blue-200 mb-3 font-medium">
                        {aiMode === 'generate' ? "Create a completely new image from text." : "Edit or enhance the current image using a text prompt."}
                    </p>

                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder={aiMode === 'generate' ? "Cyberpunk city, neon lights, 4k..." : "Add a red glow, make it night time..."} 
                            className="glass-input flex-1 px-4 py-2 rounded-xl text-sm outline-none" 
                            value={aiPrompt} 
                            onChange={(e) => setAiPrompt(e.target.value)} 
                        />
                        <button type="button" onClick={handleGenerateImage} disabled={generatingImage || !aiPrompt} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-500 flex items-center gap-2 shadow-lg shadow-blue-500/20">
                            {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : (aiMode === 'edit' ? <RefreshCcw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
                            {aiMode === 'edit' ? 'Update' : 'Generate'}
                        </button>
                    </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300"><ImageIcon className="w-4 h-4" /></div>
                <input required type="url" placeholder="https://..." className="glass-input w-full pl-11 pr-4 py-3 rounded-2xl outline-none" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
              {formData.imageUrl && <div className="mt-4 relative w-full h-48 rounded-2xl overflow-hidden border border-white/10 group">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  {/* Visual indicator for edit mode source */}
                  {showAiPanel && aiMode === 'edit' && (
                      <div className="absolute inset-0 bg-blue-500/20 border-4 border-blue-500/50 flex items-center justify-center">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">Source for Editing</span>
                      </div>
                  )}
              </div>}
            </div>
            
            {/* Video Generator */}
            <div>
                 <div className="flex justify-between items-center mb-2 pl-1">
                    <label className="block text-sm font-medium text-gray-200">Video Preview</label>
                    <button type="button" onClick={() => setShowVideoPanel(!showVideoPanel)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/40 px-3 py-1 rounded-full transition-colors border border-indigo-500/30">
                        <Film className="w-3 h-3" /> Veo Animate
                    </button>
                </div>
                 {showVideoPanel && (
                    <div className="mb-4 glass-card p-4 rounded-2xl animate-in slide-in-from-top-2 border border-indigo-500/30">
                        <textarea placeholder="Describe movement..." className="glass-input w-full px-3 py-2 rounded-xl text-sm outline-none mb-2" value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} />
                        <button type="button" onClick={handleGenerateVideo} disabled={generatingVideo || !formData.imageUrl} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-500 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                            {generatingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />} Generate Video
                        </button>
                    </div>
                )}
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300"><Video className="w-4 h-4" /></div>
                    <input type="text" placeholder="https://..." className="glass-input w-full pl-11 pr-4 py-3 rounded-2xl outline-none" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
                </div>
            </div>

            <div className="pt-6 flex items-center gap-4">
               <button type="button" onClick={() => navigate('/admin')} className="px-6 py-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-2xl font-medium transition-colors w-1/3">Cancel</button>
               <button type="submit" disabled={loading} className="flex-1 px-6 py-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2">
                 {loading ? "Saving..." : <><Save className="w-5 h-5" /> Publish Asset</>}
               </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;