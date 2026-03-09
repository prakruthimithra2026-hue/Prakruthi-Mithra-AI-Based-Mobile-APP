import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  ArrowLeft,
  Info,
  Leaf,
  Bug,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

const PlantDoctor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const base64Data = image.split(',')[1];
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      };

      const prompt = `You are an expert Agricultural Scientist specializing in Natural Farming (APCNF). 
      Analyze this image of a plant. 
      1. Identify the plant.
      2. Identify any visible diseases, pests, or nutrient deficiencies.
      3. Suggest natural remedies based on APCNF (Andhra Pradesh Community Managed Natural Farming) practices. 
      Specifically mention preparations like:
      - Bijamrutham
      - Jivamrutham (Drava/Ghana)
      - Neem Oil / Neem Astra
      - Agni Astra
      - Brahma Astra
      - Dashaparni Kashayam
      - Sour Buttermilk spray
      
      Provide the response in Telugu (primary) and English (secondary). 
      Keep the tone helpful and encouraging for a farmer.
      Format the response clearly with headings.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [imagePart, { text: prompt }] }],
      });

      setAnalysis(response.text || "విశ్లేషణ అందుబాటులో లేదు. / Analysis not available.");
    } catch (err) {
      console.error("Analysis error:", err);
      setError("చిత్రాన్ని విశ్లేషించడంలో లోపం ఏర్పడింది. దయచేసి మళ్ళీ ప్రయత్నించండి. / Error analyzing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]" id="plant-doctor-container">
      {/* Header */}
      <div className="bg-white border-b border-black/5 p-4 sticky top-0 z-20 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#e8f5e9] rounded-xl flex items-center justify-center text-[#1b5e20]">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-stone-900 leading-tight">మొక్కల డాక్టర్ (Plant Doctor)</h2>
          <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">AI వ్యాధి నిర్ధారణ</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!image ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[32px] p-8 border border-dashed border-stone-300 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-[#f0fdf4] rounded-full flex items-center justify-center text-[#1b5e20]">
                <Camera size={40} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి</h3>
                <p className="text-sm text-stone-500 max-w-[240px] mx-auto mt-2">
                  మీ పంటకు సోకిన వ్యాధి లేదా పురుగు ఫోటోను ఇక్కడ అప్‌లోడ్ చేయండి.
                </p>
              </div>
              
              <div className="flex flex-col w-full gap-3 pt-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-[#1b5e20] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Upload size={20} />
                  ఫోటో ఎంచుకోండి
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-blue-50 p-5 rounded-[24px] flex gap-4 border border-blue-100">
                <div className="text-blue-600 shrink-0">
                  <Info size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-blue-900">మంచి ఫలితాల కోసం చిట్కాలు:</h4>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                    <li>వెలుతురు బాగా ఉన్నప్పుడు ఫోటో తీయండి.</li>
                    <li>వ్యాధి సోకిన భాగాన్ని స్పష్టంగా కనిపించేలా దగ్గరగా తీయండి.</li>
                    <li>ఫోటో మసకగా లేకుండా చూసుకోండి.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="relative rounded-[32px] overflow-hidden shadow-xl border-4 border-white">
              <img src={image} alt="Uploaded plant" className="w-full aspect-square object-cover" />
              <button 
                onClick={reset}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/70 transition-all"
              >
                <RefreshCw size={20} />
              </button>
            </div>

            {!analysis && !loading && (
              <button 
                onClick={analyzeImage}
                className="w-full bg-[#1b5e20] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-[#144317] transition-all"
              >
                <CheckCircle2 size={20} />
                విశ్లేషించండి (Analyze)
              </button>
            )}

            {loading && (
              <div className="bg-white rounded-[32px] p-10 border border-black/5 shadow-sm flex flex-col items-center text-center space-y-4">
                <Loader2 className="animate-spin text-[#1b5e20]" size={48} />
                <div>
                  <h3 className="text-lg font-bold text-stone-900">AI విశ్లేషిస్తోంది...</h3>
                  <p className="text-sm text-stone-500">దయచేసి వేచి ఉండండి, మేము వ్యాధిని గుర్తిస్తున్నాము.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 p-5 rounded-[24px] flex gap-4 border border-rose-100 text-rose-700">
                <AlertCircle size={24} className="shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {analysis && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] p-6 border border-black/5 shadow-sm space-y-6"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                  <div className="w-10 h-10 bg-[#e8f5e9] rounded-full flex items-center justify-center text-[#1b5e20]">
                    <Leaf size={20} />
                  </div>
                  <h3 className="font-bold text-stone-900">AI నిర్ధారణ & పరిష్కారాలు</h3>
                </div>

                <div className="markdown-body text-stone-700 leading-relaxed prose prose-sm max-w-none">
                  <Markdown>{analysis}</Markdown>
                </div>

                <div className="pt-6 border-t border-stone-100 flex flex-col gap-3">
                  <p className="text-[10px] text-stone-400 text-center italic">
                    గమనిక: ఇది AI ఆధారిత సలహా. క్షేత్రస్థాయిలో అమలు చేసే ముందు స్థానిక వ్యవసాయ అధికారులను సంప్రదించడం మంచిది.
                  </p>
                  <button 
                    onClick={reset}
                    className="w-full border border-stone-200 text-stone-600 py-3 rounded-2xl font-bold hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={18} />
                    మరో ఫోటో తీయండి
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlantDoctor;
