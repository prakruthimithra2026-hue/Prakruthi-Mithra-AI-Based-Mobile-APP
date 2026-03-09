import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import Markdown from 'react-markdown';
import { Send, Bot, User, Loader2, RefreshCw, Image as ImageIcon, Volume2, Copy, Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

const AIAdvisor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'నమస్కారం! నేను మీ ప్రకృతి మిత్ర AI సలహాదారుని. సహజ వ్యవసాయం, పంటల యాజమాన్యం మరియు జీవ నియంత్రణ పద్ధతుల గురించి మీకు ఎలా సహాయపడగలను?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearChat = () => {
    if (confirm('సంభాషణను తొలగించాలనుకుంటున్నారా? (Do you want to clear the chat?)')) {
      setMessages([
        {
          role: 'model',
          text: 'నమస్కారం! నేను మీ ప్రకృతి మిత్ర AI సలహాదారుని. సహజ వ్యవసాయం, పంటల యాజమాన్యం మరియు జీవ నియంత్రణ పద్ధతుల గురించి మీకు ఎలా సహాయపడగలను?'
        }
      ]);
    }
  };

  const handleSpeak = async (text: string, index: number) => {
    if (isSpeaking === index) {
      audioRef.current?.pause();
      setIsSpeaking(null);
      return;
    }

    setIsSpeaking(index);
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `చదవండి: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        const audio = new Audio(audioSrc);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(null);
        await audio.play();
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(null);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Prakruthi Mithra AI Advice',
          text: text,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopy(text, -1);
      alert('లింక్ కాపీ చేయబడింది! (Link copied!)');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const getApiKey = () => process.env.GEMINI_API_KEY || process.env.API_KEY;
    let apiKey = getApiKey();

    if (!apiKey && typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        // After opening the dialog, we assume the user might have selected a key
        // The platform will inject it into process.env.API_KEY
        apiKey = getApiKey();
      }
    }

    const userMessage = input.trim();
    const userImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    const updatedMessages: Message[] = [...messages, { role: 'user', text: userMessage, image: userImage || undefined }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Re-read the key right before the call to ensure we have the latest from the dialog
      const currentApiKey = getApiKey();
      if (!currentApiKey) {
        throw new Error("API Key is missing. Please ensure GEMINI_API_KEY is set in the project environment or select a key.");
      }
      const ai = new GoogleGenAI({ apiKey: currentApiKey });
      
      const contents: any[] = [];
      
      updatedMessages.forEach(m => {
        const parts: any[] = [];
        if (m.text) parts.push({ text: m.text });
        if (m.image) {
          const mimeType = m.image.split(';')[0].split(':')[1] || "image/jpeg";
          parts.push({
            inlineData: {
              mimeType,
              data: m.image.split(',')[1]
            }
          });
        }
        if (parts.length > 0) {
          contents.push({ role: m.role, parts });
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: `You are "Prakruthi Mithra AI Advisor", the ultimate expert in APCNF (Andhra Pradesh Community Managed Natural Farming).
          
          Your core principles:
          1. ZERO CHEMICALS: Never recommend synthetic fertilizers or pesticides.
          2. BIOLOGICAL CONTROL: Prioritize NPV, Trichoderma, Pseudomonas, Beauveria, and Metarhizium.
          3. KASHAYAMS: Recommend Agniastram, Brahmastram, Neem oil, etc.
          4. SOIL HEALTH: Focus on Jeevamrutham and Ghanajeevamrutham.
          
          Specific Guidance:
          - Spodoptera NPV is ONLY for Spodoptera (Tobacco Caterpillar).
          - Helicoverpa NPV is ONLY for Helicoverpa (Gram Pod Borer).
          - Trichoderma Viride is for soil-borne diseases like Root Rot and Wilt.
          - Pseudomonas is for Blast and Leaf Spots.
          - Beauveria is for Sucking Pests (Aphids, Jassids).
          - Sour Buttermilk (పుల్లటి మజ్జిగ) is excellent for Powdery Mildew.
          
          Tone & Language:
          - Respond ONLY in Telugu.
          - Be extremely respectful, using "రైతు సోదరా" (Farmer brother).
          - Keep instructions step-by-step and easy to follow.
          - If a farmer asks for a chemical solution, explain the damage it causes to soil and health, then provide the natural alternative.`,
        },
      });

      const aiResponse = response.text || "క్షమించండి, నేను సమాధానం ఇవ్వలేకపోతున్నాను. దయచేసి మళ్ళీ ప్రయత్నించండి.";
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      
      let errorMessage = "క్షమించండి, సాంకేతిక సమస్య ఏర్పడింది. దయచేసి కాసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.";
      
      if (error?.message?.includes("Requested entity was not found") && (window as any).aistudio) {
        errorMessage = "API కీతో సమస్య ఉంది. దయచేసి మళ్ళీ కీని ఎంచుకోండి.";
        await (window as any).aistudio.openSelectKey();
      } else if (error?.message?.includes("API Key is missing")) {
        errorMessage = `API కీ లేదు. దయచేసి కీని ఎంచుకోండి. (${error.message})`;
        if ((window as any).aistudio) await (window as any).aistudio.openSelectKey();
      }
      
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]" id="ai-advisor-container">
      {/* Header with Clear Chat */}
      <div className="px-4 py-2 bg-white border-b border-black/5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[#1b5e20]">
          <Bot size={20} />
          <span className="text-sm font-bold">AI సలహాదారు</span>
        </div>
        <button 
          onClick={handleClearChat}
          className="text-xs font-bold text-stone-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={14} /> చాట్ క్లియర్ చేయండి
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex flex-col gap-2 max-w-[90%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.image && (
                  <div className="p-3 bg-[#1b5e20] rounded-[24px] shadow-md">
                    <img 
                      src={msg.image} 
                      alt="User uploaded" 
                      className="max-w-full h-auto rounded-[16px] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                
                {msg.text && (
                  <div className={`relative p-4 rounded-[24px] shadow-sm text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#1b5e20] text-white' 
                      : 'bg-white text-[#1a1a1a] border border-black/5'
                  }`}>
                    <div className="markdown-body">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                    {msg.role === 'model' && (
                      <div className="flex justify-end mt-2 gap-3">
                        <button 
                          onClick={() => handleSpeak(msg.text, idx)}
                          className={`transition-colors ${isSpeaking === idx ? 'text-[#1b5e20]' : 'text-stone-400 hover:text-[#1b5e20]'}`}
                          title="వినండి (Listen)"
                        >
                          {isSpeaking === idx ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
                        </button>
                        <button 
                          onClick={() => handleCopy(msg.text, idx)}
                          className={`transition-colors ${copiedIndex === idx ? 'text-emerald-500' : 'text-stone-400 hover:text-[#1b5e20]'}`}
                          title="కాపీ (Copy)"
                        >
                          {copiedIndex === idx ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                        <button 
                          onClick={() => handleShare(msg.text)}
                          className="text-stone-400 hover:text-[#1b5e20] transition-colors"
                          title="షేర్ (Share)"
                        >
                          <Share2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-[24px] shadow-sm border border-black/5 flex items-center gap-3 text-[#1b5e20]">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs font-medium">ఆలోచిస్తున్నాను...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-black/5">
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-[#1b5e20]" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-stone-500 hover:text-[#1b5e20] transition-colors"
          >
            <ImageIcon size={28} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            className="hidden" 
          />
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి..."
              className="w-full bg-[#f8f9fa] border border-black/5 rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-[#1b5e20] outline-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="bg-[#1b5e20] text-white p-3 rounded-full hover:bg-[#144317] disabled:opacity-50 transition-all shadow-md active:scale-95"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
