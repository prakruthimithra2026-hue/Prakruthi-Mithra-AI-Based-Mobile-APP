/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Sprout, 
  Droplets, 
  MessageSquare, 
  Info, 
  Menu, 
  X, 
  ChevronRight, 
  Send,
  Leaf,
  Bug,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  ShieldCheck,
  LogOut,
  Plus,
  Upload,
  UserCircle,
  Book,
  Sun,
  Share2,
  AlertTriangle,
  Megaphone
} from 'lucide-react';
import { CROPS, NATURAL_INPUTS, Crop, NaturalInput } from './data';
import { chatWithPrakritiMitra } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

type Screen = 'home' | 'crops' | 'inputs' | 'chat' | 'handbook' | 'admin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [selectedInput, setSelectedInput] = useState<NaturalInput | null>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home': return <HomeScreen onNavigate={setCurrentScreen} />;
      case 'crops': return <CropsScreen onSelectCrop={setSelectedCrop} />;
      case 'inputs': return <InputsScreen onSelectInput={setSelectedInput} />;
      case 'chat': return <ChatScreen />;
      case 'handbook': return <HandbookScreen onNavigate={setCurrentScreen} />;
      case 'admin': return <AdminScreen />;
      default: return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-[#1b7d36] px-4 py-3 flex items-center justify-between sticky top-0 z-50 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentScreen('home')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Prakruthi Mithra</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-1.5 rounded-full">
            <ShieldCheck size={20} />
          </div>
          <div className="flex items-center gap-1 border border-white/30 rounded-lg px-2 py-1 text-sm bg-white/5">
            <span>తెలుగు</span>
            <ChevronRight size={14} className="rotate-90" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedCrop && (
          <Modal title={selectedCrop.teluguName} onClose={() => setSelectedCrop(null)}>
            <div className="space-y-4">
              <p className="text-stone-600 italic">{selectedCrop.description}</p>
              <div>
                <h4 className="font-bold text-[#1b7d36] mb-1">నాటు సమయం:</h4>
                <p>{selectedCrop.sowingTime}</p>
              </div>
              <div>
                <h4 className="font-bold text-[#1b7d36] mb-1">పురుగుల నివారణ:</h4>
                <ul className="list-disc list-inside">
                  {selectedCrop.pestManagement.map((pest, i) => (
                    <li key={i}>{pest}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Modal>
        )}
        {selectedInput && (
          <Modal title={selectedInput.teluguName} onClose={() => setSelectedInput(null)}>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-[#1b7d36] mb-1">కావలసిన పదార్థాలు:</h4>
                <ul className="list-disc list-inside">
                  {selectedInput.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-[#1b7d36] mb-1">తయారీ విధానం:</h4>
                <p>{selectedInput.preparation}</p>
              </div>
              <div>
                <h4 className="font-bold text-[#1b7d36] mb-1">వాడుక:</h4>
                <p>{selectedInput.usage}</p>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <footer className="bg-white border-t border-black/5 px-4 py-2 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <BottomNavButton 
          icon={<Home size={24} />} 
          label="హోమ్" 
          active={currentScreen === 'home'} 
          onClick={() => setCurrentScreen('home')} 
        />
        <BottomNavButton 
          icon={<MessageSquare size={24} />} 
          label="సలహాదారు" 
          active={currentScreen === 'chat'} 
          onClick={() => setCurrentScreen('chat')} 
        />
        <BottomNavButton 
          icon={<Book size={24} />} 
          label="హ్యాండ్ బుక్" 
          active={currentScreen === 'handbook'} 
          onClick={() => setCurrentScreen('handbook')} 
        />
      </footer>
    </div>
  );
}

function BottomNavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#1b7d36]' : 'text-stone-400'}`}
    >
      <div className={`${active ? 'scale-110' : ''} transition-transform`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [acres, setAcres] = useState(1);

  return (
    <div className="p-4 space-y-6">
      {/* Hero Section */}
      <section className="bg-[#1b7d36] text-white p-8 rounded-[40px] shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-3">శుభోదయం రైతు సోదరా!</h2>
          <p className="opacity-90 mb-8 text-sm leading-relaxed max-w-[280px]">
            APCNF ప్రకృతి వ్యవసాయంతో భూమిని రక్షించండి, ఆరోగ్యాన్ని కాపాడండి.
          </p>
          <button 
            onClick={() => onNavigate('chat')}
            className="bg-white text-stone-800 px-10 py-3.5 rounded-full font-bold shadow-md hover:scale-105 transition-transform text-sm"
          >
            AI తో మాట్లాడండి
          </button>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-10">
          <Sprout size={200} />
        </div>
      </section>

      {/* Weather Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-stone-800 px-2">రోజువారీ వాతావరణ సమాచారం</h3>
        <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-stone-800">32°C</span>
            </div>
            <p className="text-stone-500 font-medium">Sunny</p>
          </div>
          <div className="flex flex-col items-center">
            <Sun className="text-amber-400 w-14 h-14" />
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-stone-400">తేమ: 65%</p>
            <p className="text-xs text-emerald-600 font-bold">✓ Good for natural farming</p>
            <button className="text-[10px] text-stone-300 italic underline">Click to see 10-day report</button>
          </div>
        </div>
      </div>

      {/* PMDS Calculator Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xl font-bold text-[#1b7d36]">PMDS విత్తన క్యాలిక్యులేటర్</h3>
          <button className="p-2 bg-[#f0fdf4] text-[#1b7d36] rounded-full">
            <Share2 size={20} />
          </button>
        </div>
        
        <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm space-y-8">
          <div className="flex items-center justify-between bg-[#f8f9fa] p-5 rounded-3xl border border-black/5">
            <label className="text-stone-700 font-bold text-lg">ఎకరాల సంఖ్య:</label>
            <div className="bg-white rounded-2xl px-6 py-2 border border-stone-200 min-w-[100px] text-center font-bold text-2xl text-stone-800 shadow-sm">
              {acres}
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-stone-50 pb-4">
              <p className="text-stone-600 font-bold text-lg">మొత్తం విత్తనాలు (12-14kg/acre):</p>
              <p className="text-3xl font-bold text-[#1b7d36]">{acres * 13}.0 kg</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[#1b7d36] font-bold text-xl">ధాన్యాలు (Cereals)</p>
                <p className="text-sm text-stone-400">సజ్జలు, జొన్నలు, రాగులు, కొర్రలు, ఆరికలు</p>
              </div>
              <p className="font-bold text-stone-700 text-xl">{(acres * 3.9).toFixed(2)} kg</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[#1b7d36] font-bold text-xl">పప్పు దినుసులు (Pulses)</p>
                <p className="text-sm text-stone-400">కందులు, పెసలు, మినుములు, అలసందలు, శనగలు</p>
              </div>
              <p className="font-bold text-stone-700 text-xl">{(acres * 3.9).toFixed(2)} kg</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[#1b7d36] font-bold text-xl">నూనె గింజలు (Oil Seeds)</p>
                <p className="text-sm text-stone-400">వేరుశనగ, నువ్వులు, కుసుమలు, ఆముదాలు, ఆవాలు</p>
              </div>
              <p className="font-bold text-stone-700 text-xl">{(acres * 2.6).toFixed(2)} kg</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[#1b7d36] font-bold text-xl">పశుగ్రాసం (Fodder)</p>
                <p className="text-sm text-stone-400">పిల్లిపెసర, అలసంద, గడ్డి రకాలు</p>
              </div>
              <p className="font-bold text-stone-700 text-xl">{(acres * 1.3).toFixed(2)} kg</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[#1b7d36] font-bold text-xl">కూరగాయలు (Vegetables)</p>
                <p className="text-sm text-stone-400">బెండ, గోరుచిక్కుడు, సొరకాయ, టమోటా</p>
              </div>
              <p className="font-bold text-stone-700 text-xl">{(acres * 1.3).toFixed(2)} kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Note Section */}
      <section className="bg-[#fff7ed] p-8 rounded-[40px] border border-orange-100 shadow-sm relative mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 p-2 rounded-xl">
            <AlertTriangle className="text-orange-600 w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-stone-800">ముఖ్య గమనిక</h3>
        </div>
        <p className="text-stone-700 text-base leading-relaxed pr-16">
          రసాయన ఎరువుల వాడకం వల్ల నేల సారం తగ్గిపోవడమే కాకుండా, మన ఆరోగ్యానికి కూడా ముప్పు. ప్రకృతి వ్యవసాయం ద్వారా తక్కువ పెట్టుబడితో ఎక్కువ లాభం పొందవచ్చు.
        </p>
        <div className="absolute top-8 right-8 bg-[#f26522] p-3 rounded-full shadow-lg">
          <Megaphone className="text-white w-6 h-6" />
        </div>
      </section>
    </div>
  );
}

function HomeCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
    >
      <div className="p-3 bg-[#f0fdf4] rounded-full group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-stone-900 text-sm">{title}</h4>
        <p className="text-[10px] text-stone-500">{desc}</p>
      </div>
    </button>
  );
}

function AdminScreen() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold text-[#1b7d36]">అడ్మిన్ ప్యానెల్</h2>
        <button className="text-rose-500 font-bold flex items-center gap-1">
          Logout
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-black/5 shadow-lg overflow-hidden relative">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#1b7d36]">Edit కషాయాలు</h3>
          <button className="p-1 hover:bg-black/5 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[#1b7d36] font-bold text-sm block">పేరు</label>
            <input 
              type="text" 
              defaultValue="కోడిగుడ్డు నిమ్మరస ద్రావణం"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#1b7d36] font-bold text-sm block">మీడియా అప్లోడ్</label>
            <div className="border-2 border-dashed border-emerald-100 rounded-2xl p-10 flex flex-col items-center justify-center gap-2 bg-emerald-50/30">
              <Upload className="text-stone-300" size={32} />
              <p className="text-emerald-500 text-sm font-medium">Click to upload Image/Video</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[#1b7d36] font-bold text-sm">ఉప శీర్షికలు</label>
              <button className="text-[#1b7d36] text-sm font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-lg">
                +కొత్తది జోడించు
              </button>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-4 border border-black/5 relative">
              <button className="absolute top-2 right-2 bg-rose-100 text-rose-500 p-1 rounded-full">
                <X size={12} />
              </button>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-stone-900 font-bold text-sm block">Description</label>
                  <input type="text" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-400 text-sm block">Content</label>
                  <textarea className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm h-24 resize-none" />
                </div>
              </div>
            </div>
          </div>

          <button className="w-full bg-[#1b7d36] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#16652b] transition-colors">
            Save & Sync
          </button>
        </div>
      </div>
    </div>
  );
}

function CropsScreen({ onSelectCrop }: { onSelectCrop: (c: Crop) => void }) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-[#1b7d36] mb-4">పంటల సమాచారం</h2>
      <div className="space-y-3">
        {CROPS.map(crop => (
          <button 
            key={crop.id}
            onClick={() => onSelectCrop(crop)}
            className="w-full bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#f0fdf4] rounded-xl flex items-center justify-center">
                <Sprout className="text-[#1b7d36]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-lg">{crop.teluguName}</h4>
                <p className="text-sm text-stone-500">{crop.name}</p>
              </div>
            </div>
            <ChevronRight className="text-stone-300 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}

function InputsScreen({ onSelectInput }: { onSelectInput: (i: NaturalInput) => void }) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-[#1b7d36] mb-4">ప్రకృతి కషాయాలు</h2>
      <div className="grid grid-cols-1 gap-3">
        {NATURAL_INPUTS.map(input => (
          <button 
            key={input.id}
            onClick={() => onSelectInput(input)}
            className="w-full bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4 group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Droplets className="text-[#1b7d36]" />
            </div>
            <div className="text-left flex-1">
              <h4 className="font-bold text-lg">{input.teluguName}</h4>
              <p className="text-sm text-stone-500 truncate max-w-[200px]">{input.usage}</p>
            </div>
            <ChevronRight className="text-stone-300 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatScreen() {
  const [messages, setMessages] = useState<{ role: string, parts: { text: string }[] }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setIsLoading(true);

    const response = await chatWithPrakritiMitra(userMessage, messages);
    
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: response || '' }] }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] p-4">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-2" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center py-10 space-y-4">
            <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="text-[#1b7d36]" size={32} />
            </div>
            <h3 className="text-xl font-bold">నేను మీకు ఎలా సహాయపడగలను?</h3>
            <p className="text-stone-500 max-w-xs mx-auto text-sm">ప్రకృతి వ్యవసాయం గురించి ఏదైనా అడగండి. ఉదాహరణకు: "జీవామృతం ఎలా తయారు చేయాలి?"</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-[#1b7d36] text-white rounded-tr-none' : 'bg-white text-stone-800 rounded-tl-none border border-black/5'}`}>
              <div className="prose prose-sm prose-stone max-w-none">
                <ReactMarkdown>{m.parts[0].text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-black/5 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-2 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి..."
          className="flex-1 bg-white border border-stone-200 rounded-full px-5 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20 text-sm"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="bg-[#1b7d36] text-white p-3 rounded-full shadow-md hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

function HandbookScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const categories = [
    { title: "PMDS విధానం", screen: 'home' as Screen },
    { title: "కషాయాలు", screen: 'inputs' as Screen },
    { title: "పురుగుల & తెగుళ్ల నివారణ", screen: 'crops' as Screen },
    { title: "పంటలు", screen: 'crops' as Screen },
    { title: "విజయ గాథలు", screen: 'home' as Screen },
    { title: "మోడల్స్", screen: 'home' as Screen },
  ];

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-3xl font-bold text-[#1b7d36] mb-8">హ్యాండ్ బుక్</h2>
      <div className="space-y-4">
        {categories.map((cat, i) => (
          <button 
            key={i}
            onClick={() => onNavigate(cat.screen)}
            className="w-full bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
          >
            <span className="text-xl font-bold text-stone-800">{cat.title}</span>
            <ChevronRight className="text-[#1b7d36] group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-black/5 flex items-center justify-between bg-[#f8f9fa]">
          <h3 className="text-2xl font-bold text-[#1b7d36]">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
