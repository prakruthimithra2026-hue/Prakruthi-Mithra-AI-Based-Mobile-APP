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
  HelpCircle
} from 'lucide-react';
import { CROPS, NATURAL_INPUTS, Crop, NaturalInput } from './data';
import { chatWithPrakritiMitra } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

type Screen = 'home' | 'crops' | 'inputs' | 'chat' | 'faqs';

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
      case 'faqs': return <FAQScreen />;
      default: return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-black/5 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Leaf className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-primary tracking-tight">ప్రకృతి మిత్ర</h1>
        </div>
        <button onClick={toggleMenu} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 bg-white shadow-xl z-40 border-b border-black/5"
          >
            <nav className="p-4 flex flex-col gap-2">
              <NavButton icon={<Home size={20} />} label="హోమ్" active={currentScreen === 'home'} onClick={() => { setCurrentScreen('home'); toggleMenu(); }} />
              <NavButton icon={<Sprout size={20} />} label="పంటల సమాచారం" active={currentScreen === 'crops'} onClick={() => { setCurrentScreen('crops'); toggleMenu(); }} />
              <NavButton icon={<Droplets size={20} />} label="ప్రకృతి కషాయాలు" active={currentScreen === 'inputs'} onClick={() => { setCurrentScreen('inputs'); toggleMenu(); }} />
              <NavButton icon={<MessageSquare size={20} />} label="AI సహాయం" active={currentScreen === 'chat'} onClick={() => { setCurrentScreen('chat'); toggleMenu(); }} />
              <NavButton icon={<HelpCircle size={20} />} label="ప్రశ్నలు - జవాబులు" active={currentScreen === 'faqs'} onClick={() => { setCurrentScreen('faqs'); toggleMenu(); }} />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
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
                <h4 className="font-bold text-primary mb-1">నాటు సమయం:</h4>
                <p>{selectedCrop.sowingTime}</p>
              </div>
              <div>
                <h4 className="font-bold text-primary mb-1">పురుగుల నివారణ:</h4>
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
                <h4 className="font-bold text-primary mb-1">కావలసిన పదార్థాలు:</h4>
                <ul className="list-disc list-inside">
                  {selectedInput.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-primary mb-1">తయారీ విధానం:</h4>
                <p>{selectedInput.preparation}</p>
              </div>
              <div>
                <h4 className="font-bold text-primary mb-1">వాడుక:</h4>
                <p>{selectedInput.usage}</p>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Bottom Nav (Mobile Style) */}
      <footer className="bg-white border-t border-black/5 px-4 py-2 flex items-center justify-around">
        <BottomNavButton icon={<Home size={24} />} active={currentScreen === 'home'} onClick={() => setCurrentScreen('home')} />
        <BottomNavButton icon={<Sprout size={24} />} active={currentScreen === 'crops'} onClick={() => setCurrentScreen('crops')} />
        <BottomNavButton icon={<MessageSquare size={24} />} active={currentScreen === 'chat'} onClick={() => setCurrentScreen('chat')} />
        <BottomNavButton icon={<Droplets size={24} />} active={currentScreen === 'inputs'} onClick={() => setCurrentScreen('inputs')} />
      </footer>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-primary text-white' : 'hover:bg-black/5 text-stone-700'}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function BottomNavButton({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-2 rounded-xl transition-all ${active ? 'text-primary' : 'text-stone-400'}`}
    >
      {icon}
    </button>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="space-y-6">
      <section className="bg-primary text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">నమస్కారం రైతు సోదరులారా!</h2>
          <p className="opacity-90 mb-4">ప్రకృతి వ్యవసాయం ద్వారా ఆరోగ్యకరమైన పంటలను పండిద్దాం, భూమిని రక్షిద్దాం.</p>
          <button 
            onClick={() => onNavigate('chat')}
            className="bg-white text-primary px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-transform"
          >
            AI తో మాట్లాడండి <ChevronRight size={18} />
          </button>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-10">
          <Sprout size={200} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <HomeCard 
          icon={<Sprout className="text-emerald-600" />} 
          title="పంటలు" 
          desc="పంటల యాజమాన్యం" 
          onClick={() => onNavigate('crops')}
        />
        <HomeCard 
          icon={<Droplets className="text-blue-600" />} 
          title="కషాయాలు" 
          desc="తయారీ విధానం" 
          onClick={() => onNavigate('inputs')}
        />
        <HomeCard 
          icon={<BookOpen className="text-amber-600" />} 
          title="సూత్రాలు" 
          desc="9 ప్రకృతి సూత్రాలు" 
          onClick={() => onNavigate('faqs')}
        />
        <HomeCard 
          icon={<Bug className="text-rose-600" />} 
          title="నివారణ" 
          desc="పురుగుల నివారణ" 
          onClick={() => onNavigate('crops')}
        />
      </div>

      <section className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Info className="text-primary" /> నేటి సూచన
        </h3>
        <p className="text-stone-600 leading-relaxed">
          బీజామృతం విత్తన శుద్ధికి చాలా ముఖ్యం. ఇది విత్తనాల ద్వారా వచ్చే తెగుళ్లను అరికడుతుంది. నాటు వేయడానికి ముందు విత్తనాలను బీజామృతంతో శుద్ధి చేయడం మర్చిపోకండి.
        </p>
      </section>
    </div>
  );
}

function HomeCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col items-start text-left gap-3 group"
    >
      <div className="p-3 bg-secondary rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-stone-900">{title}</h4>
        <p className="text-xs text-stone-500">{desc}</p>
      </div>
    </button>
  );
}

function CropsScreen({ onSelectCrop }: { onSelectCrop: (c: Crop) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary mb-4">పంటల సమాచారం</h2>
      <div className="space-y-3">
        {CROPS.map(crop => (
          <button 
            key={crop.id}
            onClick={() => onSelectCrop(crop)}
            className="w-full bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <Sprout className="text-primary" />
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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary mb-4">ప్రకృతి కషాయాలు</h2>
      <div className="grid grid-cols-1 gap-3">
        {NATURAL_INPUTS.map(input => (
          <button 
            key={input.id}
            onClick={() => onSelectInput(input)}
            className="w-full bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4 group"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Droplets className="text-primary" />
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
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-2" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center py-10 space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="text-primary" size={32} />
            </div>
            <h3 className="text-xl font-bold">నేను మీకు ఎలా సహాయపడగలను?</h3>
            <p className="text-stone-500 max-w-xs mx-auto">ప్రకృతి వ్యవసాయం గురించి ఏదైనా అడగండి. ఉదాహరణకు: "జీవామృతం ఎలా తయారు చేయాలి?"</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-stone-800 rounded-tl-none border border-black/5'}`}>
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
          className="flex-1 bg-white border border-black/5 rounded-full px-5 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="bg-primary text-white p-3 rounded-full shadow-md hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

function FAQScreen() {
  const faqs = [
    { q: "ప్రకృతి వ్యవసాయం అంటే ఏమిటి?", a: "ప్రకృతి వ్యవసాయం అనేది బాహ్య వ్యవసాయ రసాయనాలను ఉపయోగించకుండా పంట ఉత్పాదకత మరియు నాణ్యతను మెరుగుపరచడానికి ప్రకృతి ప్రక్రియలపై ఆధారపడిన వ్యవసాయ పద్ధతుల సమితి." },
    { q: "జీవామృతం వల్ల కలిగే లాభాలు ఏమిటి?", a: "జీవామృతం నేలలోని సూక్ష్మజీవుల వృద్ధికి దోహదపడుతుంది. ఇది ఒక జీవ ఉత్ప్రేరకంగా పనిచేస్తుంది మరియు నేలలోని సూక్ష్మజీవుల వైవిధ్యాన్ని పెంపొందించడంలో సహాయపడతాయి." },
    { q: "ఆచ్ఛాదన (Mulching) ఎందుకు చేయాలి?", a: "నేల నుండి తేమ ఆవిరిని తగ్గించడానికి మరియు నేల ఉష్ణోగ్రతను నియంత్రించడానికి ఆచ్ఛాదన ముఖ్యం. ఇది నేల ఆరోగ్యాన్ని కాపాడుతుంది." }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">తరచుగా అడిగే ప్రశ్నలు</h2>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm">
            <h4 className="font-bold text-stone-900 mb-2 flex gap-2">
              <span className="text-primary">ప్ర:</span> {faq.q}
            </h4>
            <p className="text-stone-600 text-sm leading-relaxed flex gap-2">
              <span className="text-primary font-bold">జ:</span> {faq.a}
            </p>
          </div>
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
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-primary">{title}</h3>
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
