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

interface HandbookSection {
  id: string;
  title: string;
  content: string;
}

interface HandbookItem {
  id: string;
  name: string;
  screen: Screen;
  image?: string;
  sections: HandbookSection[];
}

interface HandbookCategory {
  id: string;
  name: string;
  items: HandbookItem[];
}

const INITIAL_HANDBOOK: HandbookCategory[] = [
  {
    id: '1',
    name: 'PMDS విధానం',
    items: [
      { id: '1-1', name: 'PMDS', screen: 'home', sections: [], image: 'https://picsum.photos/seed/pmds/800/400' },
      { id: '1-2', name: 'విత్తన గుళికలు', screen: 'home', sections: [], image: 'https://picsum.photos/seed/seeds/800/400' }
    ]
  },
  {
    id: '2',
    name: 'కషాయాలు',
    items: [
      { 
        id: '2-1', 
        name: 'ఘన జీవామృతం', 
        screen: 'inputs', 
        image: 'https://picsum.photos/seed/ghana/800/400',
        sections: [
          { id: 's1', title: 'కావలసిన పదార్థాలు', content: 'ఆవు పేడ, బెల్లం, పప్పు పిండి...' },
          { id: 's2', title: 'తయారీ విధానం', content: 'అన్ని పదార్థాలను కలిపి నీడలో ఆరబెట్టాలి...' }
        ]
      },
      { id: '2-2', name: 'బీజామృతం', screen: 'inputs', sections: [], image: 'https://picsum.photos/seed/beeja/800/400' },
      { id: '2-3', name: 'ద్రవ జీవామృతం', screen: 'inputs', sections: [], image: 'https://picsum.photos/seed/drava/800/400' }
    ]
  },
  {
    id: '3',
    name: 'పంటలు',
    items: [
      { id: '3-1', name: 'వరి (Paddy)', screen: 'crops', sections: [], image: 'https://picsum.photos/seed/paddy/800/400' },
      { id: '3-2', name: 'వేరుశనగ', screen: 'crops', sections: [], image: 'https://picsum.photos/seed/groundnut/800/400' },
      { id: '3-3', name: 'మిరప', screen: 'crops', sections: [], image: 'https://picsum.photos/seed/chilli/800/400' },
      { id: '3-4', name: 'శనగ', screen: 'crops', sections: [], image: 'https://picsum.photos/seed/chickpea/800/400' },
      { id: '3-5', name: 'పత్తి', screen: 'crops', sections: [], image: '' },
      { id: '3-6', name: 'మొక్కజొన్న', screen: 'crops', sections: [], image: 'https://picsum.photos/seed/maize/800/400' },
      { id: '3-7', name: 'మినుము/పెసర', screen: 'crops', sections: [], image: '' },
      { id: '3-8', name: 'పసుపు', screen: 'crops', sections: [], image: 'https://picsum.photos/seed/turmeric/800/400' },
    ]
  }
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [handbookData, setHandbookData] = useState<HandbookCategory[]>(INITIAL_HANDBOOK);
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
      case 'handbook': return <HandbookScreen onNavigate={setCurrentScreen} categories={handbookData} />;
      case 'admin': 
        return isAdminLoggedIn ? 
          <AdminScreen 
            onLogout={() => setIsAdminLoggedIn(false)} 
            categories={handbookData}
            setCategories={setHandbookData}
          /> : 
          <LoginScreen onLogin={() => setIsAdminLoggedIn(true)} />;
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
          <button 
            onClick={() => setCurrentScreen('admin')}
            className="text-xs bg-white/20 px-3 py-1.5 rounded-full text-white hover:bg-white/30 transition-colors font-bold border border-white/20"
          >
            Admin
          </button>
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
          <h2 className="text-lg font-bold mb-3">శుభోదయం రైతు సోదరా!</h2>
          <p className="opacity-90 mb-8 text-xs leading-relaxed max-w-[280px] text-justify">
            APCNF ప్రకృతి వ్యవసాయంతో భూమిని రక్షించండి, ఆరోగ్యాన్ని కాపాడండి.
          </p>
          <button 
            onClick={() => onNavigate('chat')}
            className="bg-white text-stone-800 px-10 py-3.5 rounded-full font-bold shadow-md hover:scale-105 transition-transform text-xs"
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
        <h3 className="text-sm font-bold text-stone-800 px-2">రోజువారీ వాతావరణ సమాచారం</h3>
        <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-stone-800">32°C</span>
            </div>
            <p className="text-stone-500 font-medium text-xs">Sunny</p>
          </div>
          <div className="flex flex-col items-center">
            <Sun className="text-amber-400 w-10 h-10" />
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-stone-400">తేమ: 65%</p>
            <p className="text-xs text-emerald-600 font-bold">✓ Good for natural farming</p>
            <button className="text-xs text-stone-300 italic underline">Click to see 10-day report</button>
          </div>
        </div>
      </div>

      {/* PMDS Calculator Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-sm font-bold text-[#1b7d36]">PMDS విత్తన క్యాలిక్యులేటర్</h3>
          <button className="p-2 bg-[#f0fdf4] text-[#1b7d36] rounded-full">
            <Share2 size={16} />
          </button>
        </div>
        
        <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm space-y-8">
          <div className="flex items-center justify-between bg-[#f8f9fa] p-5 rounded-3xl border border-black/5">
            <label className="text-stone-700 font-bold text-xs">ఎకరాల సంఖ్య:</label>
            <div className="bg-white rounded-2xl px-6 py-2 border border-stone-200 min-w-[80px] text-center font-bold text-xl text-stone-800 shadow-sm">
              {acres}
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-stone-50 pb-4">
              <p className="text-stone-600 font-bold text-xs">మొత్తం విత్తనాలు (12-14kg/acre):</p>
              <p className="text-2xl font-bold text-[#1b7d36]">{acres * 13}.0 kg</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[#1b7d36] font-bold text-xs">ధాన్యాలు (Cereals)</p>
                <p className="text-xs text-stone-400 text-justify">సజ్జలు, జొన్నలు, రాగులు, కొర్రలు, ఆరికలు</p>
              </div>
              <p className="font-bold text-stone-700 text-sm">{(acres * 3.9).toFixed(2)} kg</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[#1b7d36] font-bold text-xs">పప్పు దినుసులు (Pulses)</p>
                <p className="text-xs text-stone-400 text-justify">కందులు, పెసలు, మినుములు, అలసందలు, శనగలు</p>
              </div>
              <p className="font-bold text-stone-700 text-sm">{(acres * 3.9).toFixed(2)} kg</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[#1b7d36] font-bold text-xs">నూనె గింజలు (Oil Seeds)</p>
                <p className="text-xs text-stone-400 text-justify">వేరుశనగ, నువ్వులు, కుసుమలు, ఆముదాలు, ఆవాలు</p>
              </div>
              <p className="font-bold text-stone-700 text-sm">{(acres * 2.6).toFixed(2)} kg</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[#1b7d36] font-bold text-xs">పశుగ్రాసం (Fodder)</p>
                <p className="text-xs text-stone-400 text-justify">పిల్లిపెసర, అలసంద, గడ్డి రకాలు</p>
              </div>
              <p className="font-bold text-stone-700 text-sm">{(acres * 1.3).toFixed(2)} kg</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[#1b7d36] font-bold text-xs">కూరగాయలు (Vegetables)</p>
                <p className="text-xs text-stone-400 text-justify">బెండ, గోరుచిక్కుడు, సొరకాయ, టమోటా</p>
              </div>
              <p className="font-bold text-stone-700 text-sm">{(acres * 1.3).toFixed(2)} kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Note Section */}
      <section className="bg-[#fff7ed] p-8 rounded-[40px] border border-orange-100 shadow-sm relative mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 p-2 rounded-xl">
            <AlertTriangle className="text-orange-600 w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-stone-800">ముఖ్య గమనిక</h3>
        </div>
        <p className="text-stone-700 text-xs leading-relaxed pr-16 text-justify">
          రసాయన ఎరువుల వాడకం వల్ల నేల సారం తగ్గిపోవడమే కాకుండా, మన ఆరోగ్యానికి కూడా ముప్పు. ప్రకృతి వ్యవసాయం ద్వారా తక్కువ పెట్టుబడితో ఎక్కువ లాభం పొందవచ్చు.
        </p>
        <div className="absolute top-8 right-8 bg-[#f26522] p-3 rounded-full shadow-lg">
          <Megaphone className="text-white w-5 h-5" />
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
        <h4 className="font-bold text-stone-900 text-xs">{title}</h4>
        <p className="text-xs text-stone-500">{desc}</p>
      </div>
    </button>
  );
}

function AdminScreen({ onLogout, categories, setCategories }: { 
  onLogout: () => void, 
  categories: HandbookCategory[],
  setCategories: React.Dispatch<React.SetStateAction<HandbookCategory[]>>
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingItem, setEditingItem] = useState<{ catId: string, item: HandbookItem } | null>(null);
  const [editingCategory, setEditingCategory] = useState<HandbookCategory | null>(null);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the handbook?')) {
      setCategories(INITIAL_HANDBOOK);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: HandbookCategory = {
      id: Date.now().toString(),
      name: newCategoryName,
      items: []
    };
    setCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
  };

  const handleUpdateCategoryName = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    setCategories(prev => prev.map(c => c.id === editingCategory.id ? editingCategory : c));
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Delete this category and all its items?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddItem = (catId: string) => {
    if (!newItemName.trim()) return;
    const newItem: HandbookItem = { 
      id: Date.now().toString(), 
      name: newItemName, 
      screen: 'handbook',
      sections: [],
      image: 'https://picsum.photos/seed/' + Date.now() + '/800/400'
    };
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: [...c.items, newItem]
        };
      }
      return c;
    }));
    setNewItemName('');
    setAddingToCategory(null);
  };

  const handleDeleteItem = (catId: string, itemId: string) => {
    if (confirm('Delete this subcategory?')) {
      setCategories(prev => prev.map(c => {
        if (c.id === catId) {
          return {
            ...c,
            items: c.items.filter(i => i.id !== itemId)
          };
        }
        return c;
      }));
    }
  };

  const handleSaveItem = (catId: string, updatedItem: HandbookItem) => {
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.map(i => i.id === updatedItem.id ? updatedItem : i)
        };
      }
      return c;
    }));
    setEditingItem(null);
  };

  if (editingItem) {
    return (
      <ItemEditor 
        catId={editingItem.catId} 
        item={editingItem.item} 
        onSave={handleSaveItem} 
        onCancel={() => setEditingItem(null)} 
      />
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#1b7d36]">అడ్మిన్ ప్యానెల్</h2>
        <button onClick={onLogout} className="text-rose-500 font-bold hover:opacity-80 transition-opacity">
          Logout
        </button>
      </div>

      <button 
        onClick={handleReset}
        className="w-full bg-rose-50 text-rose-500 py-3 rounded-2xl font-bold border border-rose-100 hover:bg-rose-100 transition-colors"
      >
        Reset Handbook
      </button>

      {/* Category Editor Modal-like section */}
      {editingCategory && (
        <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-200 shadow-sm space-y-4">
          <h3 className="text-amber-800 font-bold">కేటగిరీ పేరు సవరించు</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={editingCategory.name}
              onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
              className="flex-1 bg-white border border-amber-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button 
              onClick={handleUpdateCategoryName}
              className="bg-amber-600 text-white px-6 rounded-2xl font-bold shadow-md"
            >
              Save
            </button>
            <button 
              onClick={() => setEditingCategory(null)}
              className="bg-stone-200 text-stone-600 px-4 rounded-2xl font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Category Section */}
      {!editingCategory && (
        <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm space-y-4">
          <h3 className="text-[#1b7d36] font-bold">కొత్త కేటగిరీని జోడించు</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="కేటగిరీ పేరు"
              className="flex-1 bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
            />
            <button 
              onClick={handleAddCategory}
              className="bg-[#1b7d36] text-white p-4 rounded-2xl shadow-md hover:scale-105 transition-transform"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-8">
        {categories.map(cat => (
          <div key={cat.id} className="space-y-4 bg-stone-50/50 p-4 rounded-[40px] border border-black/5">
            <div className="flex flex-col gap-2 px-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-bold text-[#1b7d36]">{cat.name}</h4>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setEditingCategory(cat)}
                    className="text-blue-500 text-sm font-bold"
                  >
                    సవరించు
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-rose-500 text-sm font-bold"
                  >
                    తొలగించు
                  </button>
                </div>
              </div>
              
              {addingToCategory === cat.id ? (
                <div className="flex gap-2 bg-white p-2 rounded-xl border border-emerald-200">
                  <input 
                    type="text" 
                    autoFocus
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    placeholder="సబ్ కేటగిరీ పేరు"
                    className="flex-1 px-3 py-1 text-sm focus:outline-none"
                    onKeyPress={e => e.key === 'Enter' && handleAddItem(cat.id)}
                  />
                  <button 
                    onClick={() => handleAddItem(cat.id)}
                    className="bg-[#1b7d36] text-white px-3 py-1 rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => { setAddingToCategory(null); setNewItemName(''); }}
                    className="text-stone-400 px-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setAddingToCategory(cat.id)}
                  className="w-full bg-emerald-50 text-[#1b7d36] py-2 rounded-xl text-sm font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                  + కొత్త సబ్ కేటగిరీని జోడించు
                </button>
              )}
            </div>

            <div className="space-y-2">
              {cat.items.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.image && <img src={item.image} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />}
                    <span className="font-bold text-stone-700">{item.name}</span>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setEditingItem({ catId: cat.id, item })}
                      className="text-blue-500 font-bold text-sm"
                    >
                      సవరించు
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(cat.id, item.id)}
                      className="text-rose-500 font-bold text-sm"
                    >
                      తొలగించు
                    </button>
                  </div>
                </div>
              ))}
              {cat.items.length === 0 && (
                <p className="text-center text-stone-400 text-xs py-2 italic">No subcategories yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemEditor({ catId, item, onSave, onCancel }: { 
  catId: string, 
  item: HandbookItem, 
  onSave: (catId: string, item: HandbookItem) => void,
  onCancel: () => void
}) {
  const [editedItem, setEditedItem] = useState<HandbookItem>({ ...item });

  const handleAddSection = () => {
    const newSection: HandbookSection = {
      id: Date.now().toString(),
      title: '',
      content: ''
    };
    setEditedItem({ ...editedItem, sections: [...editedItem.sections, newSection] });
  };

  const handleUpdateSection = (id: string, field: 'title' | 'content', value: string) => {
    setEditedItem({
      ...editedItem,
      sections: editedItem.sections.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const handleDeleteSection = (id: string) => {
    setEditedItem({
      ...editedItem,
      sections: editedItem.sections.filter(s => s.id !== id)
    });
  };

  const handleChangeImage = () => {
    const newUrl = prompt('Enter new image URL (or leave empty for random):', editedItem.image);
    if (newUrl !== null) {
      setEditedItem({ ...editedItem, image: newUrl || `https://picsum.photos/seed/${Date.now()}/800/400` });
    }
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#1b7d36]">Edit {item.name}</h2>
        <button onClick={onCancel} className="p-2 hover:bg-black/5 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-lg space-y-6">
        <div className="space-y-2">
          <label className="text-[#1b7d36] font-bold text-sm block">పేరు</label>
          <input 
            type="text" 
            value={editedItem.name}
            onChange={e => setEditedItem({ ...editedItem, name: e.target.value })}
            className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[#1b7d36] font-bold text-sm block">మీడియా</label>
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-video bg-stone-100 group">
            {editedItem.image ? (
              <img src={editedItem.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">No Image</div>
            )}
            <button 
              onClick={handleChangeImage}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2"
            >
              <Upload size={32} />
              <span className="font-bold">Change Image</span>
            </button>
          </div>
          {editedItem.image && (
            <button 
              onClick={() => setEditedItem({ ...editedItem, image: undefined })}
              className="text-rose-500 text-xs font-bold"
            >
              Remove Image
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[#1b7d36] font-bold text-sm">ఉప శీర్షికలు (Sections)</label>
            <button 
              onClick={handleAddSection}
              className="text-[#1b7d36] text-sm font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-lg"
            >
              + కొత్తది జోడించు
            </button>
          </div>

          <div className="space-y-4">
            {editedItem.sections.map((section, idx) => (
              <div key={section.id} className="bg-[#f8f9fa] rounded-2xl p-4 border border-black/5 relative space-y-4">
                <button 
                  onClick={() => handleDeleteSection(section.id)}
                  className="absolute top-2 right-2 bg-rose-100 text-rose-500 p-1 rounded-full hover:bg-rose-200"
                >
                  <X size={12} />
                </button>
                <div className="space-y-1">
                  <label className="text-stone-900 font-bold text-sm block">Title</label>
                  <input 
                    type="text" 
                    value={section.title}
                    onChange={e => handleUpdateSection(section.id, 'title', e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm" 
                    placeholder="e.g. తయారీ విధానం"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-400 text-sm block">Content</label>
                  <textarea 
                    value={section.content}
                    onChange={e => handleUpdateSection(section.id, 'content', e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm h-24 resize-none" 
                    placeholder="Enter details here..."
                  />
                </div>
              </div>
            ))}
            {editedItem.sections.length === 0 && (
              <p className="text-center text-stone-400 text-sm py-4 italic">No sections added yet.</p>
            )}
          </div>
        </div>

        <button 
          onClick={() => onSave(catId, editedItem)}
          className="w-full bg-[#1b7d36] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#16652b] transition-colors"
        >
          Save & Sync
        </button>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'prakruthimithra2026@gmail.com' && password === 'Ravi@1985') {
      onLogin();
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-lg w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-[#f0fdf4] w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="text-[#1b7d36]" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-stone-800">Admin Login</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-stone-600 ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-stone-600 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-[#1b7d36] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#16652b] transition-colors"
          >
            Login
          </button>
        </form>
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

function HandbookScreen({ onNavigate, categories }: { onNavigate: (s: Screen) => void, categories: HandbookCategory[] }) {
  const [selectedItem, setSelectedItem] = useState<HandbookItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HandbookCategory | null>(null);

  if (selectedItem) {
    return (
      <div className="p-4 space-y-6 pb-20">
        <button 
          onClick={() => setSelectedItem(null)}
          className="flex items-center gap-2 text-[#1b7d36] font-bold mb-4"
        >
          <ChevronLeft size={20} /> వెనుకకు
        </button>

        <div className="bg-white rounded-[40px] overflow-hidden shadow-lg border border-black/5">
          {selectedItem.image && (
            <img src={selectedItem.image} alt={selectedItem.name} className="w-full aspect-video object-cover" referrerPolicy="no-referrer" />
          )}
          <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold text-[#1b7d36]">{selectedItem.name}</h2>
            
            <div className="space-y-8">
              {selectedItem.sections.map((section) => (
                <div key={section.id} className="space-y-2">
                  <h4 className="text-xl font-bold text-stone-800 border-l-4 border-[#1b7d36] pl-3">{section.title}</h4>
                  <div className="text-stone-600 leading-relaxed whitespace-pre-wrap pl-4">
                    {section.content}
                  </div>
                </div>
              ))}
              {selectedItem.sections.length === 0 && (
                <p className="text-stone-500 italic">No details available for this item yet.</p>
              )}
            </div>

            <button 
              onClick={() => onNavigate(selectedItem.screen)}
              className="w-full bg-[#1b7d36] text-white py-4 rounded-2xl font-bold shadow-md hover:bg-[#16652b] transition-colors mt-8"
            >
              మరింత సమాచారం కోసం వెళ్ళండి
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    return (
      <div className="p-4 space-y-6 pb-20">
        <button 
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-[#1b7d36] font-bold mb-4"
        >
          <ChevronLeft size={20} /> వెనుకకు
        </button>
        
        <h2 className="text-3xl font-bold text-[#1b7d36] mb-8">{selectedCategory.name}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {selectedCategory.items.map((item) => (
            <button 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all text-center"
            >
              <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 font-bold text-sm">
                    No Media
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="text-sm font-bold text-[#1b7d36] line-clamp-2">{item.name}</span>
              </div>
            </button>
          ))}
          {selectedCategory.items.length === 0 && (
            <div className="col-span-2 text-center text-stone-400 py-10 italic">
              No subcategories found.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <h2 className="text-3xl font-bold text-[#1b7d36] mb-8">హ్యాండ్ బుక్</h2>
      <div className="space-y-4">
        {categories.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat)}
            className="w-full bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
          >
            <span className="text-xl font-bold text-stone-800">{cat.name}</span>
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
