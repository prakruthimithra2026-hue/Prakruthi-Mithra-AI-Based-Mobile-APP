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
  Info, 
  Menu, 
  X, 
  ChevronRight, 
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
  Cloud,
  CloudRain,
  CloudSun,
  CloudOff,
  Wind,
  Video,
  Play,
  Share2,
  AlertTriangle,
  Megaphone,
  ArrowUp,
  ArrowDown,
  Mail,
  Bot,
  MessageSquare
} from 'lucide-react';
import { CROPS, NATURAL_INPUTS, Crop, NaturalInput } from './data';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';

import AIAdvisor from './components/AIAdvisor';
import Forum from './components/Forum';
import PlantDoctor from './components/PlantDoctor';

type Screen = 'home' | 'crops' | 'inputs' | 'handbook' | 'admin' | 'videos' | 'privacy' | 'terms' | 'advisor' | 'forum' | 'doctor';

interface PageContent {
  id: string;
  title: string;
  content: string;
}

interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
}

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

const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

interface HandbookCategory {
  id: string;
  name: string;
  items: HandbookItem[];
  order?: number;
}

interface CalculatorRow {
  id: string;
  label: string;
  sublabel: string;
  ratio: number;
}

interface Calculator {
  id: string;
  title: string;
  baseRate: number;
  rows: CalculatorRow[];
}

interface SignUpField {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'tel' | 'email';
  required: boolean;
  order: number;
}

const INITIAL_HANDBOOK: HandbookCategory[] = [
  {
    id: '1',
    name: 'PMDS విధానం',
    order: 0,
    items: [
      { id: '1-1', name: 'PMDS', screen: 'home', sections: [], image: 'https://picsum.photos/seed/pmds/800/400' },
      { id: '1-2', name: 'విత్తన గుళికలు', screen: 'home', sections: [], image: 'https://picsum.photos/seed/seeds/800/400' }
    ]
  },
  {
    id: '2',
    name: 'కషాయాలు',
    order: 1,
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
    order: 2,
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

const INITIAL_CALCULATORS: Calculator[] = [
  {
    id: 'pmds-seed',
    title: 'PMDS విత్తన క్యాలిక్యులేటర్',
    baseRate: 13,
    rows: [
      { id: '1', label: 'ధాన్యాలు (Cereals)', sublabel: 'సజ్జలు, జొన్నలు, రాగులు, కొర్రలు, ఆరికలు', ratio: 3.9 },
      { id: '2', label: 'పప్పు దినుసులు (Pulses)', sublabel: 'కందులు, పెసలు, మినుములు, అలసందలు, శనగలు', ratio: 3.9 },
      { id: '3', label: 'నూనె గింజలు (Oil Seeds)', sublabel: 'వేరుశనగ, నువ్వులు, కుసుమలు, ఆముదాలు, ఆవాలు', ratio: 2.6 },
      { id: '4', label: 'పశుగ్రాసం (Fodder)', sublabel: 'పిల్లిపెసర, అలసంద, గడ్డి రకాలు', ratio: 1.3 },
      { id: '5', label: 'కూరగాయలు (Vegetables)', sublabel: 'బెండ, గోరుచిక్కుడు, సొరకాయ, టమోటా', ratio: 1.3 },
    ]
  }
];

const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: '1',
    title: 'ప్రకృతి వ్యవసాయం పరిచయం',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://picsum.photos/seed/video1/800/400'
  }
];

const INITIAL_SIGNUP_FIELDS: SignUpField[] = [
  { id: 'name', label: 'Full Name', placeholder: 'Enter your full name', type: 'text', required: true, order: 1 },
  { id: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', type: 'tel', required: true, order: 2 },
  { id: 'location', label: 'Location/Village', placeholder: 'Enter your village name', type: 'text', required: true, order: 3 },
];

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('embed/')) return url;
  
  let videoId = '';
  if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [user, setUser] = useState<User | null>(null);
  const [handbookData, setHandbookData] = useState<HandbookCategory[]>(INITIAL_HANDBOOK);
  const [calculators, setCalculators] = useState<Calculator[]>(INITIAL_CALCULATORS);
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [privacyPolicy, setPrivacyPolicy] = useState<PageContent>({ id: 'privacy', title: 'Privacy Policy', content: '' });
  const [termsConditions, setTermsConditions] = useState<PageContent>({ id: 'terms', title: 'Terms and Conditions', content: '' });
  const [signUpFields, setSignUpFields] = useState<SignUpField[]>(INITIAL_SIGNUP_FIELDS);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [selectedInput, setSelectedInput] = useState<NaturalInput | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Allow all users to access the app for now to fix access issues on other devices
      // We still track if they are admin for the admin panel
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore listeners
  useEffect(() => {
    const unsubSignUpFields = onSnapshot(collection(db, 'signup_fields'), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SignUpField));
        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setSignUpFields(data);
      }
    }, (error) => {
      console.warn("Firestore: signup_fields access restricted. Using defaults.", error.message);
    });

    if (!user) return () => unsubSignUpFields();

    const unsubHandbook = onSnapshot(collection(db, 'handbook'), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HandbookCategory));
        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setHandbookData(data);
      }
    }, (error) => console.error("Firestore: handbook access restricted.", error.message));

    const unsubCalculators = onSnapshot(collection(db, 'calculators'), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Calculator));
        setCalculators(data);
      }
    }, (error) => console.error("Firestore: calculators access restricted.", error.message));

    const unsubVideos = onSnapshot(collection(db, 'videos'), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoItem));
        setVideos(data);
      }
    }, (error) => console.error("Firestore: videos access restricted.", error.message));

    const unsubPages = onSnapshot(collection(db, 'pages'), (snapshot) => {
      snapshot.docs.forEach(doc => {
        const data = doc.data() as PageContent;
        if (doc.id === 'privacy') setPrivacyPolicy({ id: 'privacy', ...data });
        if (doc.id === 'terms') setTermsConditions({ id: 'terms', ...data });
      });
    }, (error) => console.error("Firestore: pages access restricted.", error.message));

    return () => {
      unsubSignUpFields();
      unsubHandbook();
      unsubCalculators();
      unsubVideos();
      unsubPages();
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentScreen('home');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const renderScreen = () => {
    if (!user) {
      return <LoginScreen onLogin={() => {}} signUpFields={signUpFields} />;
    }

    switch (currentScreen) {
      case 'home': return <HomeScreen onNavigate={setCurrentScreen} calculators={calculators} />;
      case 'crops': return <CropsScreen onSelectCrop={setSelectedCrop} />;
      case 'inputs': return <InputsScreen onSelectInput={setSelectedInput} />;
      case 'handbook': return <HandbookScreen onNavigate={setCurrentScreen} categories={handbookData} />;
      case 'videos': return <VideosScreen videos={videos} />;
      case 'advisor': return <AIAdvisor />;
      case 'forum': return <Forum user={user} />;
      case 'doctor': return <PlantDoctor />;
      case 'privacy': return <PageScreen content={privacyPolicy} onBack={() => setCurrentScreen('home')} />;
      case 'terms': return <PageScreen content={termsConditions} onBack={() => setCurrentScreen('home')} />;
      case 'admin': 
        if (user.email === 'prakruthimithra2026@gmail.com') {
          return (
            <AdminScreen 
              onLogout={handleLogout} 
              categories={handbookData}
              setCategories={setHandbookData}
              calculators={calculators}
              setCalculators={setCalculators}
              videos={videos}
              setVideos={setVideos}
              privacyPolicy={privacyPolicy}
              setPrivacyPolicy={setPrivacyPolicy}
              termsConditions={termsConditions}
              setTermsConditions={setTermsConditions}
            />
          );
        }
        return <div className="p-10 text-center font-bold text-rose-500">Access Denied. Only administrators can access this panel.</div>;
      default: return <HomeScreen onNavigate={setCurrentScreen} calculators={calculators} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8f9fa] overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-[#1b5e20] px-4 py-3 flex items-center justify-between sticky top-0 z-50 text-white shadow-md">
        <div className="flex items-center gap-3">
          {currentScreen !== 'home' && (
            <button onClick={() => setCurrentScreen('home')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
          )}
          <h1 className="text-xl font-bold tracking-tight">Prakruthi Mithra</h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Menu"
            >
              <Menu size={24} />
            </button>
          )}
        </div>
      </header>

      {/* Sidebar Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-72 bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between bg-[#1b7d36] text-white">
                <h2 className="font-bold text-lg">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 py-4">
                <button 
                  onClick={() => { setCurrentScreen('home'); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <Home size={20} />
                  <span className="font-medium">Home</span>
                </button>

                <button 
                  onClick={() => { setCurrentScreen('forum'); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <MessageSquare size={20} />
                  <span className="font-medium">Community Forum</span>
                </button>

                <button 
                  onClick={() => { setCurrentScreen('doctor'); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <ShieldCheck size={20} />
                  <span className="font-medium">Plant Doctor (AI)</span>
                </button>
                
                {user?.email === 'prakruthimithra2026@gmail.com' && (
                  <button 
                    onClick={() => { setCurrentScreen('admin'); setIsMenuOpen(false); }}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-stone-50 text-stone-700 transition-colors"
                  >
                    <ShieldCheck size={20} />
                    <span className="font-medium">Admin Panel</span>
                  </button>
                )}

                <div className="my-2 border-t border-stone-100" />
                
                <button 
                  onClick={() => { setCurrentScreen('privacy'); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <ShieldCheck size={20} />
                  <span className="font-medium">Privacy Policy</span>
                </button>
                
                <button 
                  onClick={() => { setCurrentScreen('terms'); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <Book size={20} />
                  <span className="font-medium">Terms & Conditions</span>
                </button>
              </div>

              <div className="p-4 border-t bg-stone-50">
                <button 
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-rose-50 text-rose-600 rounded-2xl transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-bold">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
      <footer className="bg-white border-t border-black/5 px-4 py-2 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.05)] sticky bottom-0 z-50">
        <BottomNavButton 
          icon={<Home size={24} />} 
          label="హోమ్" 
          active={currentScreen === 'home'} 
          onClick={() => setCurrentScreen('home')} 
        />
        <BottomNavButton 
          icon={<MessageSquare size={24} />} 
          label="ఫోరమ్" 
          active={currentScreen === 'forum'} 
          onClick={() => setCurrentScreen('forum')} 
        />
        <BottomNavButton 
          icon={<Bot size={24} />} 
          label="సలహాదారు" 
          active={currentScreen === 'advisor'} 
          onClick={() => setCurrentScreen('advisor')} 
        />
        <BottomNavButton 
          icon={<ShieldCheck size={24} />} 
          label="డాక్టర్" 
          active={currentScreen === 'doctor'} 
          onClick={() => setCurrentScreen('doctor')} 
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

function PageScreen({ content, onBack }: { content: PageContent, onBack: () => void }) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b flex items-center gap-4 sticky top-0 bg-white z-10">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-600">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-stone-800">{content.title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-stone max-w-none markdown-body text-justify">
          <ReactMarkdown>{content.content || '*No content yet. Please add content in the Admin Panel.*'}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ onNavigate, calculators }: { onNavigate: (s: Screen) => void, calculators: Calculator[] }) {
  const [acres, setAcres] = useState(1);
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [showForecast, setShowForecast] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [locationName, setLocationName] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async (lat: number, lon: number) => {
      setLoadingWeather(true);
      try {
        // Fetch Weather - Simplified to avoid header issues
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=10`
        );
        
        if (!weatherResponse.ok) {
          throw new Error(`Weather API responded with status: ${weatherResponse.status}`);
        }
        
        const weatherData = await weatherResponse.json();

        // Fetch Location Name (Reverse Geocoding)
        // Note: Removed User-Agent as it's a forbidden header in browsers
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12&accept-language=te`
        ).catch(() => null);
        
        const geoData = geoResponse && geoResponse.ok ? await geoResponse.json() : null;
        
        if (!isMounted) return;

        if (weatherData && weatherData.current) {
          setWeather(weatherData.current);
          const daily = weatherData.daily;
          if (daily && daily.time) {
            const forecastData = daily.time.map((time: string, i: number) => ({
              date: time,
              code: daily.weather_code[i],
              max: daily.temperature_2m_max[i],
              min: daily.temperature_2m_min[i]
            }));
            setForecast(forecastData);
          }
        }
        
        if (geoData) {
          const addr = geoData.address;
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || addr.county || 'ప్రస్తుత ప్రాంతం';
          setLocationName(city);
        } else {
          setLocationName(lat.toFixed(2) === '16.51' ? 'విజయవాడ' : 'ప్రస్తుత ప్రాంతం');
        }
      } catch (error) {
        console.error('Weather fetch failed:', error);
      } finally {
        if (isMounted) setLoadingWeather(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(16.5062, 80.6480) // Default to Vijayawada if denied
      );
    } else {
      fetchWeather(16.5062, 80.6480);
    }

    return () => { isMounted = false; };
  }, []);

  const getWeatherIcon = (code: number, size = 24) => {
    if (code === 0) return <Sun className="text-amber-400" size={size} />;
    if (code <= 3) return <CloudSun className="text-stone-400" size={size} />;
    if (code <= 48) return <Cloud className="text-stone-400" size={size} />;
    if (code <= 67) return <CloudRain className="text-blue-400" size={size} />;
    return <CloudRain className="text-blue-500" size={size} />;
  };

  const getWeatherText = (code: number) => {
    if (code === 0) return 'ఎండగా ఉంది';
    if (code <= 3) return 'పాక్షికంగా మేఘావృతమై ఉంది';
    if (code <= 48) return 'మేఘావృతమై ఉంది';
    if (code <= 67) return 'వర్షం';
    return 'తుఫాను';
  };

  const handleShare = async (calc: Calculator) => {
    const element = document.getElementById(`calc-${calc.id}`);
    if (!element) return;

    try {
      // Create a canvas from the element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, Math.floor(canvas.width / 2), Math.floor(canvas.height / 2));
      
      const pdfBlob = pdf.output('blob');
      const fileName = `${calc.title.replace(/\s+/g, '_')}_Report.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: calc.title,
          text: `Check out this ${calc.title} report generated via Prakruthi Mithra AI.`,
        });
      } else {
        // Fallback: Download the PDF
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      console.error('Error generating/sharing PDF:', err);
      // Fallback to text share if PDF fails
      const total = (acres * calc.baseRate).toFixed(1);
      let text = `*${calc.title}*\n`;
      text += `ఎకరాల సంఖ్య: ${acres}\n`;
      text += `మొత్తం: ${total} kg\n\n`;
      
      calc.rows.forEach(row => {
        const amount = (acres * row.ratio).toFixed(2);
        text += `• ${row.label}: ${amount} kg\n`;
      });
      text += `\nShared via Prakruthi Mithra AI`;

      if (navigator.share) {
        await navigator.share({
          title: calc.title,
          text: text,
        });
      }
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Hero Section */}
      <section className="bg-[#1b7d36] text-white p-8 rounded-[40px] shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-[26px] font-bold mb-3 leading-tight">నమస్కారం రైతు సోదరా!</h2>
          <p className="opacity-90 mb-8 text-sm leading-relaxed max-w-[280px]">
            APCNF ప్రకృతి వ్యవసాయంతో భూమిని రక్షించండి, ఆరోగ్యాన్ని కాపాడండి.
          </p>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-10">
          <Sprout size={200} />
        </div>
      </section>

      {/* Weather Section */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-stone-800 px-2">రోజువారీ వాతావరణ సమాచారం</h3>
        <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex items-center justify-between">
          {loadingWeather ? (
            <div className="w-full flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-[#1b7d36] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {locationName && (
                  <div className="flex items-center gap-1 text-[#1b7d36]">
                    <span className="text-[18px] font-bold">{locationName}</span>
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  {weather ? (
                    <span className="text-xl font-bold text-stone-800">{weather.temperature_2m}°C</span>
                  ) : (
                    <span className="text-sm text-stone-400">డేటా అందుబాటులో లేదు</span>
                  )}
                </div>
                <p className="text-stone-500 font-medium text-sm">
                  {weather ? getWeatherText(weather.weather_code) : 'వాతావరణ సమాచారం లోడ్ కాలేదు'}
                </p>
              </div>
              <div className="flex flex-col items-center">
                {weather ? getWeatherIcon(weather.weather_code, 40) : <CloudOff className="text-stone-300" size={40} />}
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-stone-400">తేమ: {weather ? weather.relative_humidity_2m : '--'}%</p>
                <p className="text-sm text-emerald-600 font-bold">✓ ప్రకృతి వ్యవసాయానికి అనుకూలం</p>
                <button 
                  onClick={() => setShowForecast(true)}
                  className="text-sm text-stone-300 italic underline"
                >
                  10 రోజుల నివేదిక చూడటానికి క్లిక్ చేయండి
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Community Forum CTA */}
      <section 
        onClick={() => onNavigate('forum')}
        className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex items-center gap-4 cursor-pointer hover:border-[#1b7d36]/30 transition-all group"
      >
        <div className="w-14 h-14 bg-[#e8f5e9] rounded-2xl flex items-center justify-center text-[#1b7d36] group-hover:scale-110 transition-transform">
          <MessageSquare size={28} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-stone-800">రైతు చర్చా వేదిక (Forum)</h3>
          <p className="text-xs text-stone-500">మీ అనుభవాలను పంచుకోండి, ఇతరుల నుండి నేర్చుకోండి.</p>
        </div>
        <ChevronRight className="text-stone-300 group-hover:text-[#1b7d36] transition-colors" size={20} />
      </section>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('doctor')}
          className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex flex-col items-center text-center gap-3 hover:border-[#1b7d36]/30 transition-all group"
        >
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-sm">మొక్కల డాక్టర్</h4>
            <p className="text-[10px] text-stone-400">Plant Doctor (AI)</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('advisor')}
          className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex flex-col items-center text-center gap-3 hover:border-[#1b7d36]/30 transition-all group"
        >
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <Bot size={24} />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-sm">AI సలహాదారు</h4>
            <p className="text-[10px] text-stone-400">AI Advisor</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('crops')}
          className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex flex-col items-center text-center gap-3 hover:border-[#1b7d36]/30 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <Leaf size={24} />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-sm">పంటలు</h4>
            <p className="text-[10px] text-stone-400">Crops</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('inputs')}
          className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex flex-col items-center text-center gap-3 hover:border-[#1b7d36]/30 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <Droplets size={24} />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-sm">కషాయాలు</h4>
            <p className="text-[10px] text-stone-400">Inputs</p>
          </div>
        </button>
      </div>

      {/* Forecast Modal */}
      <AnimatePresence>
        {showForecast && (
          <Modal title="10 రోజుల వాతావరణ నివేదిక" onClose={() => setShowForecast(false)}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {forecast.map((day, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-black/5">
                  <div className="w-24">
                    <p className="text-sm font-bold text-stone-800">
                      {i === 0 ? 'నేడు' : new Date(day.date).toLocaleDateString('te-IN', { weekday: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    {getWeatherIcon(day.code, 20)}
                    <span className="text-xs text-stone-500">{getWeatherText(day.code)}</span>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-sm font-bold text-stone-800">{day.max}°</span>
                    <span className="text-xs text-stone-400 ml-1">/ {day.min}°</span>
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Calculators Section */}
      {calculators.map(calc => (
        <div key={calc.id} className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-base font-bold text-[#1b7d36]">{calc.title}</h3>
            <button 
              onClick={() => handleShare(calc)}
              className="p-2 bg-[#f0fdf4] text-[#1b7d36] rounded-full hover:bg-[#dcfce7] transition-colors"
            >
              <Share2 size={16} />
            </button>
          </div>
          
          <div id={`calc-${calc.id}`} className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm space-y-8">
            <div className="flex items-center justify-between bg-[#1b7d36] p-5 rounded-3xl border border-black/5">
              <label className="text-white font-bold text-sm">ఎకరాల సంఖ్య:</label>
              <input 
                type="number" 
                value={acres}
                onChange={e => setAcres(Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-white text-[#1b7d36] rounded-2xl px-4 py-2 border border-[#1b7d36] w-[100px] text-center font-bold text-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
              />
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-stone-50 pb-4">
                <p className="text-stone-600 font-bold text-sm">మొత్తం (per acre):</p>
                <p className="text-xl font-bold text-[#1b7d36]">{(acres * calc.baseRate).toFixed(1)} kg</p>
              </div>

              {calc.rows.map(row => (
                <div key={row.id} className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[#1b7d36] font-bold text-sm">{row.label}</p>
                    <p className="text-sm text-stone-400">{row.sublabel}</p>
                  </div>
                  <p className="font-bold text-stone-700 text-sm">{(acres * row.ratio).toFixed(2)} kg</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Important Note Section */}
      <section className="bg-[#fff7ed] p-8 rounded-[40px] border border-orange-100 shadow-sm relative mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 p-2 rounded-xl">
            <AlertTriangle className="text-orange-600 w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-stone-800">ముఖ్య గమనిక</h3>
        </div>
        <p className="text-stone-700 text-sm leading-relaxed pr-16 text-justify">
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
        <h4 className="font-bold text-stone-900 text-sm">{title}</h4>
        <p className="text-sm text-stone-500">{desc}</p>
      </div>
    </button>
  );
}

function AdminScreen({ 
  onLogout, 
  categories, 
  setCategories, 
  calculators, 
  setCalculators, 
  videos, 
  setVideos,
  privacyPolicy,
  setPrivacyPolicy,
  termsConditions,
  setTermsConditions
}: { 
  onLogout: () => void, 
  categories: HandbookCategory[],
  setCategories: React.Dispatch<React.SetStateAction<HandbookCategory[]>>,
  calculators: Calculator[],
  setCalculators: React.Dispatch<React.SetStateAction<Calculator[]>>,
  videos: VideoItem[],
  setVideos: React.Dispatch<React.SetStateAction<VideoItem[]>>,
  privacyPolicy: PageContent,
  setPrivacyPolicy: React.Dispatch<React.SetStateAction<PageContent>>,
  termsConditions: PageContent,
  setTermsConditions: React.Dispatch<React.SetStateAction<PageContent>>
}) {
  const [activeTab, setActiveTab] = useState<'handbook' | 'calculators' | 'videos' | 'pages'>('handbook');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingItem, setEditingItem] = useState<{ catId: string, item: HandbookItem } | null>(null);
  const [editingCategory, setEditingCategory] = useState<HandbookCategory | null>(null);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [editingCalculator, setEditingCalculator] = useState<Calculator | null>(null);
  
  // Video management state
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoThumbnail, setNewVideoThumbnail] = useState('');
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resized = await resizeImage(reader.result as string);
        callback(resized);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all data? This will clear Firestore and re-seed with initial data.')) {
      setIsResetting(true);
      try {
        // Clear and re-seed Handbook
        for (const cat of INITIAL_HANDBOOK) {
          await setDoc(doc(db, 'handbook', cat.id), cat);
        }
        // Clear and re-seed Calculators
        for (const calc of INITIAL_CALCULATORS) {
          await setDoc(doc(db, 'calculators', calc.id), calc);
        }
        // Clear and re-seed Videos
        for (const video of INITIAL_VIDEOS) {
          await setDoc(doc(db, 'videos', video.id), video);
        }
        // Clear and re-seed Pages
        await setDoc(doc(db, 'pages', 'privacy'), { title: 'Privacy Policy', content: '' });
        await setDoc(doc(db, 'pages', 'terms'), { title: 'Terms and Conditions', content: '' });
        
        alert('Data reset successfully!');
      } catch (error) {
        console.error("Reset error", error);
        alert('Error resetting data. Check console.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleAddVideo = async () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return;
    const id = Date.now().toString();
    const newVideo: VideoItem = {
      id,
      title: newVideoTitle,
      url: getYouTubeEmbedUrl(newVideoUrl),
      thumbnail: newVideoThumbnail.trim() || `https://picsum.photos/seed/${id}/800/400`
    };
    await setDoc(doc(db, 'videos', id), newVideo);
    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoThumbnail('');
  };

  const handleDeleteVideo = async (id: string) => {
    if (confirm('Delete this video?')) {
      await deleteDoc(doc(db, 'videos', id));
    }
  };

  const handleSaveVideo = async () => {
    if (!editingVideo || !editingVideo.title.trim() || !editingVideo.url.trim()) return;
    const updatedVideo = { ...editingVideo, url: getYouTubeEmbedUrl(editingVideo.url) };
    await setDoc(doc(db, 'videos', updatedVideo.id), updatedVideo);
    setEditingVideo(null);
  };

  const handleAddCalculator = async () => {
    const id = Date.now().toString();
    const newCalc: Calculator = {
      id,
      title: 'కొత్త క్యాలిక్యులేటర్',
      baseRate: 10,
      rows: []
    };
    await setDoc(doc(db, 'calculators', id), newCalc);
    setEditingCalculator(newCalc);
  };

  const handleDeleteCalculator = async (id: string) => {
    if (confirm('Delete this calculator?')) {
      await deleteDoc(doc(db, 'calculators', id));
    }
  };

  const handleSaveCalculator = async (updated: Calculator) => {
    await setDoc(doc(db, 'calculators', updated.id), updated);
    setEditingCalculator(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const id = Date.now().toString();
    const newCat: HandbookCategory = {
      id,
      name: newCategoryName,
      items: [],
      order: categories.length
    };
    await setDoc(doc(db, 'handbook', id), newCat);
    setNewCategoryName('');
  };

  const handleMoveCategory = async (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

    // Update all categories with their new order in Firestore
    for (let i = 0; i < newCategories.length; i++) {
      await setDoc(doc(db, 'handbook', newCategories[i].id), { ...newCategories[i], order: i });
    }
  };

  const handleUpdateCategoryName = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    await setDoc(doc(db, 'handbook', editingCategory.id), editingCategory);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category and all its items?')) {
      await deleteDoc(doc(db, 'handbook', id));
    }
  };

  const handleAddItem = async (catId: string) => {
    if (!newItemName.trim()) return;
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    const newItem: HandbookItem = { 
      id: Date.now().toString(), 
      name: newItemName, 
      screen: 'handbook',
      sections: [],
      image: 'https://picsum.photos/seed/' + Date.now() + '/800/400'
    };

    const updatedCat = {
      ...cat,
      items: [...cat.items, newItem]
    };
    
    await setDoc(doc(db, 'handbook', catId), updatedCat);
    setNewItemName('');
    setAddingToCategory(null);
  };

  const handleDeleteItem = async (catId: string, itemId: string) => {
    if (confirm('Delete this subcategory?')) {
      const cat = categories.find(c => c.id === catId);
      if (!cat) return;

      const updatedCat = {
        ...cat,
        items: cat.items.filter(i => i.id !== itemId)
      };
      await setDoc(doc(db, 'handbook', catId), updatedCat);
    }
  };

  const handleSaveItem = async (catId: string, updatedItem: HandbookItem) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    const updatedCat = {
      ...cat,
      items: cat.items.map(i => i.id === updatedItem.id ? updatedItem : i)
    };
    await setDoc(doc(db, 'handbook', catId), updatedCat);
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

  if (editingCalculator) {
    return (
      <CalculatorEditor 
        calculator={editingCalculator}
        onSave={handleSaveCalculator}
        onCancel={() => setEditingCalculator(null)}
      />
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#1b7d36]">అడ్మిన్ ప్యానెల్</h2>
        <div className="flex gap-4 items-center">
          <button 
            onClick={handleReset} 
            disabled={isResetting}
            className={`text-xs transition-colors ${isResetting ? 'text-stone-300' : 'text-stone-400 hover:text-rose-500'}`}
            title="Reset App Data"
          >
            {isResetting ? 'Resetting...' : 'Reset Data'}
          </button>
          <button onClick={onLogout} className="text-rose-500 font-bold hover:opacity-80 transition-opacity">
            Logout
          </button>
        </div>
      </div>

      <div className="flex gap-2 bg-stone-100 p-1 rounded-2xl">
        <button 
          onClick={() => setActiveTab('handbook')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all ${activeTab === 'handbook' ? 'bg-white text-[#1b7d36] shadow-sm' : 'text-stone-400'}`}
        >
          Handbook
        </button>
        <button 
          onClick={() => setActiveTab('calculators')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all ${activeTab === 'calculators' ? 'bg-white text-[#1b7d36] shadow-sm' : 'text-stone-400'}`}
        >
          Calculators
        </button>
        <button 
          onClick={() => setActiveTab('videos')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all ${activeTab === 'videos' ? 'bg-white text-[#1b7d36] shadow-sm' : 'text-stone-400'}`}
        >
          Videos
        </button>
        <button 
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all ${activeTab === 'pages' ? 'bg-white text-[#1b7d36] shadow-sm' : 'text-stone-400'}`}
        >
          Pages
        </button>
      </div>

      {activeTab === 'handbook' ? (
        <>
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
                    <h4 className="text-base font-bold text-[#1b7d36]">{cat.name}</h4>
                    <div className="flex gap-4 items-center">
                      <div className="flex gap-1 mr-2">
                        <button 
                          onClick={() => handleMoveCategory(cat.id, 'up')}
                          disabled={categories.indexOf(cat) === 0}
                          className="p-1 text-[#1b7d36] disabled:opacity-20 hover:bg-[#1b7d36]/10 rounded"
                          title="Move Up"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button 
                          onClick={() => handleMoveCategory(cat.id, 'down')}
                          disabled={categories.indexOf(cat) === categories.length - 1}
                          className="p-1 text-[#1b7d36] disabled:opacity-20 hover:bg-[#1b7d36]/10 rounded"
                          title="Move Down"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
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
        </>
      ) : activeTab === 'pages' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm space-y-6">
            <h3 className="text-[#1b7d36] font-bold flex items-center gap-2">
              <ShieldCheck size={20} /> Privacy Policy
            </h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase">Content (Markdown supported)</label>
              <textarea 
                value={privacyPolicy.content}
                onChange={e => setPrivacyPolicy({ ...privacyPolicy, content: e.target.value })}
                rows={10}
                className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20 font-mono text-sm"
                placeholder="Enter privacy policy content..."
              />
            </div>
            <button 
              onClick={async () => {
                await setDoc(doc(db, 'pages', 'privacy'), { title: privacyPolicy.title, content: privacyPolicy.content });
                alert('Privacy Policy saved!');
              }}
              className="w-full bg-[#1b7d36] text-white py-3 rounded-2xl font-bold shadow-md"
            >
              Save Privacy Policy
            </button>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm space-y-6">
            <h3 className="text-[#1b7d36] font-bold flex items-center gap-2">
              <Book size={20} /> Terms & Conditions
            </h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase">Content (Markdown supported)</label>
              <textarea 
                value={termsConditions.content}
                onChange={e => setTermsConditions({ ...termsConditions, content: e.target.value })}
                rows={10}
                className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20 font-mono text-sm"
                placeholder="Enter terms and conditions content..."
              />
            </div>
            <button 
              onClick={async () => {
                await setDoc(doc(db, 'pages', 'terms'), { title: termsConditions.title, content: termsConditions.content });
                alert('Terms & Conditions saved!');
              }}
              className="w-full bg-[#1b7d36] text-white py-3 rounded-2xl font-bold shadow-md"
            >
              Save Terms & Conditions
            </button>
          </div>
        </div>
      ) : activeTab === 'calculators' ? (
        <div className="space-y-6">
          <button 
            onClick={handleAddCalculator}
            className="w-full bg-[#1b7d36] text-white py-4 rounded-2xl font-bold shadow-md flex items-center justify-center gap-2"
          >
            <Plus size={20} /> కొత్త క్యాలిక్యులేటర్ జోడించు
          </button>

          <div className="space-y-4">
            {calculators.map(calc => (
              <div key={calc.id} className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-800">{calc.title}</h4>
                  <p className="text-xs text-stone-400">{calc.rows.length} rows • {calc.baseRate} kg/acre</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setEditingCalculator(calc)}
                    className="text-blue-500 font-bold text-sm"
                  >
                    సవరించు
                  </button>
                  <button 
                    onClick={() => handleDeleteCalculator(calc.id)}
                    className="text-rose-500 font-bold text-sm"
                  >
                    తొలగించు
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Video Editor Modal-like section */}
          {editingVideo && (
            <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-200 shadow-sm space-y-4">
              <h3 className="text-blue-800 font-bold">వీడియో సవరించు</h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={editingVideo.title}
                  onChange={e => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  placeholder="వీడియో పేరు"
                  className="w-full bg-white border border-blue-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <input 
                  type="text" 
                  value={editingVideo.url}
                  onChange={e => setEditingVideo({ ...editingVideo, url: e.target.value })}
                  placeholder="వీడియో లింక్ (YouTube Embed URL)"
                  className="w-full bg-white border border-blue-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-400 uppercase">Thumbnail Image</label>
                  <div className="flex items-center gap-4">
                    {editingVideo.thumbnail && (
                      <img src={editingVideo.thumbnail} className="w-20 h-12 object-cover rounded-lg border border-blue-200" referrerPolicy="no-referrer" />
                    )}
                    <label className="flex-1 cursor-pointer bg-white border-2 border-dashed border-blue-200 rounded-2xl p-4 flex flex-col items-center justify-center hover:border-blue-400 transition-colors">
                      <Upload size={20} className="text-blue-400 mb-1" />
                      <span className="text-xs font-bold text-blue-500">Upload Thumbnail</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => handleFileUpload(e, (base64) => setEditingVideo({ ...editingVideo, thumbnail: base64 }))} 
                      />
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveVideo}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold shadow-md"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setEditingVideo(null)}
                    className="flex-1 bg-stone-200 text-stone-600 py-3 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Video Section */}
          {!editingVideo && (
            <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm space-y-4">
              <h3 className="text-[#1b7d36] font-bold">కొత్త వీడియోను జోడించు</h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={newVideoTitle}
                  onChange={e => setNewVideoTitle(e.target.value)}
                  placeholder="వీడియో పేరు"
                  className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
                />
                <input 
                  type="text" 
                  value={newVideoUrl}
                  onChange={e => setNewVideoUrl(e.target.value)}
                  placeholder="వీడియో లింక్ (YouTube Embed URL)"
                  className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase">Thumbnail Image</label>
                  <div className="flex items-center gap-4">
                    {newVideoThumbnail && (
                      <img src={newVideoThumbnail} className="w-20 h-12 object-cover rounded-lg border border-stone-200" referrerPolicy="no-referrer" />
                    )}
                    <label className="flex-1 cursor-pointer bg-[#f8f9fa] border-2 border-dashed border-stone-200 rounded-2xl p-4 flex flex-col items-center justify-center hover:border-[#1b7d36] transition-colors">
                      <Upload size={20} className="text-stone-400 mb-1" />
                      <span className="text-xs font-bold text-stone-500">Upload Thumbnail</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => handleFileUpload(e, (base64) => setNewVideoThumbnail(base64))} 
                      />
                    </label>
                  </div>
                </div>
                <button 
                  onClick={handleAddVideo}
                  className="w-full bg-[#1b7d36] text-white py-3 rounded-2xl font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> వీడియోను జోడించు
                </button>
              </div>
            </div>
          )}

          {/* Videos List */}
          <div className="space-y-4">
            {videos.map(video => (
              <div key={video.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-stone-100 rounded flex items-center justify-center">
                    <Video size={16} className="text-stone-400" />
                  </div>
                  <span className="font-bold text-stone-700 text-sm">{video.title}</span>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setEditingVideo(video)}
                    className="text-blue-500 font-bold text-sm"
                  >
                    సవరించు
                  </button>
                  <button 
                    onClick={() => handleDeleteVideo(video.id)}
                    className="text-rose-500 font-bold text-sm"
                  >
                    తొలగించు
                  </button>
                </div>
              </div>
            ))}
            {videos.length === 0 && (
              <p className="text-center text-stone-400 text-xs py-10 italic">No videos added yet.</p>
            )}
          </div>
        </div>
      )}
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resized = await resizeImage(reader.result as string);
        setEditedItem({ ...editedItem, image: resized });
      };
      reader.readAsDataURL(file);
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
          <label className="text-[#1b7d36] font-bold text-sm block">మీడియా (Image)</label>
          <div className="flex items-center gap-4 mb-2">
            <label className="flex-1 cursor-pointer bg-[#f8f9fa] border-2 border-dashed border-stone-200 rounded-2xl p-4 flex flex-col items-center justify-center hover:border-[#1b7d36] transition-colors">
              <Upload size={24} className="text-stone-400 mb-1" />
              <span className="text-sm font-bold text-stone-500">Upload Image</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </label>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-video bg-stone-100">
            {editedItem.image ? (
              <img src={editedItem.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">No Image</div>
            )}
          </div>
          {editedItem.image && (
            <button 
              onClick={() => setEditedItem({ ...editedItem, image: undefined })}
              className="text-rose-500 text-xs font-bold mt-2"
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

function LoginScreen({ onLogin, signUpFields }: { onLogin: () => void, signUpFields: SignUpField[] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccess('పాస్‌వర్డ్ రీసెట్ లింక్ మీ ఈమెయిల్‌కు పంపబడింది. (Password reset link sent to your email)');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save additional user data to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          ...formData,
          createdAt: new Date().toISOString()
        });

        // Optional: send verification but don't force it for now to fix access issues
        try {
          await sendEmailVerification(userCredential.user);
        } catch (e) {
          console.warn("Verification email failed", e);
        }
        
        onLogin();
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLogin();
      }
    } catch (err: any) {
      console.error("Auth error", err);
      const errorCode = err.code;
      
      if (errorCode === 'auth/email-already-in-use') {
        setError('ఈ ఈమెయిల్ ఇప్పటికే రిజిస్టర్ అయి ఉంది. దయచేసి లాగిన్ అవ్వండి. (User already exists. Please sign in)');
      } else if (errorCode === 'auth/user-not-found') {
        setError('ఈ ఈమెయిల్ తో ఎటువంటి ఖాతా లేదు. (No account found with this email)');
      } else if (
        errorCode === 'auth/invalid-credential' || 
        errorCode === 'auth/invalid-login-credentials' ||
        errorCode === 'auth/wrong-password'
      ) {
        setError('ఈమెయిల్ లేదా పాస్‌వర్డ్ తప్పుగా ఉంది. (Email or password is incorrect)');
      } else if (errorCode === 'auth/weak-password') {
        setError('పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి. (Password should be at least 6 characters)');
      } else if (errorCode === 'auth/invalid-email') {
        setError('సరైన ఈమెయిల్ అడ్రస్ ఇవ్వండి. (Please enter a valid email)');
      } else {
        setError('సమస్య ఏర్పడింది. దయచేసి మళ్ళీ ప్రయత్నించండి.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isForgotPassword) return 'Forgot Password';
    return isSignUp ? 'Sign Up' : 'Login';
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-lg w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-[#f0fdf4] w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <UserCircle className="text-[#1b7d36]" size={32} />
          </div>
          <h2 className="text-xl font-bold text-stone-800">{getTitle()}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-stone-600 ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
              placeholder="your@email.com"
              required
            />
          </div>
          {!isForgotPassword && (
            <div className="space-y-1">
              <label className="text-sm font-bold text-stone-600 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
                placeholder="••••••••"
                required={!isForgotPassword}
              />
            </div>
          )}
          
          {isSignUp && !isForgotPassword && signUpFields.map(field => (
            <div key={field.id} className="space-y-1">
              <label className="text-sm font-bold text-stone-600 ml-1">{field.label}</label>
              <input 
                type={field.type}
                value={formData[field.id] || ''}
                onChange={e => setFormData({ ...formData, [field.id]: e.target.value })}
                className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
                placeholder={field.placeholder}
                required={field.required}
              />
            </div>
          ))}

          {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
          {success && <p className="text-[#1b7d36] text-xs font-bold text-center">{success}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#1b7d36] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#16652b] transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Login'))}
          </button>
        </form>

        <div className="flex flex-col gap-3 text-center">
          {!isForgotPassword && !isSignUp && (
            <button 
              onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
              className="text-xs text-stone-400 font-bold hover:text-[#1b7d36] transition-colors"
            >
              Forgot Password?
            </button>
          )}
          
          <button 
            onClick={() => {
              if (isForgotPassword) {
                setIsForgotPassword(false);
              } else {
                setIsSignUp(!isSignUp);
              }
              setError('');
              setSuccess('');
            }}
            className="text-sm text-[#1b7d36] font-bold hover:underline"
          >
            {isForgotPassword ? 'Back to Login' : (isSignUp ? 'Already have an account? Login' : 'Don\'t have an account? Sign Up')}
          </button>
        </div>
      </div>
    </div>
  );
}

function CropsScreen({ onSelectCrop }: { onSelectCrop: (c: Crop) => void }) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-[#1b7d36] mb-4">పంటల సమాచారం</h2>
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
                <h4 className="font-bold text-base">{crop.teluguName}</h4>
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
      <h2 className="text-xl font-bold text-[#1b7d36] mb-4">ప్రకృతి కషాయాలు</h2>
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
              <h4 className="font-bold text-base">{input.teluguName}</h4>
              <p className="text-sm text-stone-500 truncate max-w-[200px]">{input.usage}</p>
            </div>
            <ChevronRight className="text-stone-300 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
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
            <h2 className="text-xl font-bold text-[#1b7d36]">{selectedItem.name}</h2>
            
            <div className="space-y-8">
              {selectedItem.sections.map((section) => (
                <div key={section.id} className="space-y-2">
                  <h4 className="text-base font-bold text-stone-800 border-l-4 border-[#1b7d36] pl-3">{section.title}</h4>
                  <div className="text-stone-600 leading-relaxed pl-4 text-justify">
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
        
        <h2 className="text-xl font-bold text-[#1b7d36] mb-8">{selectedCategory.name}</h2>
        
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
      <h2 className="text-xl font-bold text-[#1b7d36] mb-8">హ్యాండ్ బుక్</h2>
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

function VideosScreen({ videos }: { videos: VideoItem[] }) {
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);

  return (
    <div className="p-4 space-y-6 pb-20">
      <h2 className="text-xl font-bold text-[#1b7d36] mb-8">వీడియోలు</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden flex flex-col group">
            <div 
              className="aspect-video bg-stone-100 relative overflow-hidden cursor-pointer"
              onClick={() => setPlayingVideo(video)}
            >
              {video.thumbnail ? (
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-200">
                  <Video size={48} className="text-stone-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                <div className="bg-white/90 p-4 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                  <Play size={24} className="text-[#1b7d36] fill-[#1b7d36]" />
                </div>
              </div>
            </div>
            <div className="p-5 flex justify-between items-center">
              <h4 className="font-bold text-stone-800 text-sm">{video.title}</h4>
              <button 
                onClick={() => setPlayingVideo(video)}
                className="text-xs font-bold text-[#1b7d36] bg-emerald-50 px-4 py-2 rounded-full"
              >
                ప్లే చేయండి
              </button>
            </div>
          </div>
        ))}
        {videos.length === 0 && (
          <div className="text-center text-stone-400 py-20 italic">
            వీడియోలు ఏవీ లేవు.
          </div>
        )}
      </div>

      <AnimatePresence>
        {playingVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPlayingVideo(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setPlayingVideo(null)}
                className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
              >
                <X size={24} />
              </button>
              <iframe 
                src={getYouTubeEmbedUrl(playingVideo.url)} 
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CalculatorEditor({ calculator, onSave, onCancel }: {
  calculator: Calculator,
  onSave: (calc: Calculator) => void,
  onCancel: () => void
}) {
  const [edited, setEdited] = useState<Calculator>({ ...calculator });

  const handleAddRow = () => {
    const newRow: CalculatorRow = {
      id: Date.now().toString(),
      label: '',
      sublabel: '',
      ratio: 0
    };
    setEdited({ ...edited, rows: [...edited.rows, newRow] });
  };

  const handleUpdateRow = (id: string, field: keyof CalculatorRow, value: any) => {
    setEdited({
      ...edited,
      rows: edited.rows.map(r => r.id === id ? { ...r, [field]: value } : r)
    });
  };

  const handleDeleteRow = (id: string) => {
    setEdited({
      ...edited,
      rows: edited.rows.filter(r => r.id !== id)
    });
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="p-2 hover:bg-black/5 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-stone-800">క్యాలిక్యులేటర్ సవరించు</h2>
        <div className="w-10" />
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-400 uppercase">Title</label>
          <input 
            type="text" 
            value={edited.title}
            onChange={e => setEdited({ ...edited, title: e.target.value })}
            className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-400 uppercase">Base Rate (kg/acre)</label>
          <input 
            type="number" 
            value={edited.baseRate}
            onChange={e => setEdited({ ...edited, baseRate: parseFloat(e.target.value) || 0 })}
            className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#1b7d36]/20"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-bold text-stone-800">Rows</h3>
          <button 
            onClick={handleAddRow}
            className="text-[#1b7d36] font-bold text-sm flex items-center gap-1"
          >
            <Plus size={16} /> Add Row
          </button>
        </div>

        <div className="space-y-3">
          {edited.rows.map(row => (
            <div key={row.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-3">
              <div className="flex justify-between gap-2">
                <input 
                  type="text" 
                  placeholder="Label (e.g. Cereals)"
                  value={row.label}
                  onChange={e => handleUpdateRow(row.id, 'label', e.target.value)}
                  className="flex-1 bg-[#f8f9fa] border border-stone-100 rounded-xl px-3 py-2 text-sm"
                />
                <button 
                  onClick={() => handleDeleteRow(row.id)}
                  className="text-rose-500 p-2"
                >
                  <X size={16} />
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Sublabel (e.g. Paddy, Maize...)"
                value={row.sublabel}
                onChange={e => handleUpdateRow(row.id, 'sublabel', e.target.value)}
                className="w-full bg-[#f8f9fa] border border-stone-100 rounded-xl px-3 py-2 text-xs"
              />
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase">Ratio</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={row.ratio}
                  onChange={e => handleUpdateRow(row.id, 'ratio', parseFloat(e.target.value) || 0)}
                  className="w-24 bg-[#f8f9fa] border border-stone-100 rounded-xl px-3 py-2 text-sm"
                />
                <span className="text-xs text-stone-400">kg/acre</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => onSave(edited)}
        className="w-full bg-[#1b7d36] text-white py-4 rounded-2xl font-bold shadow-md hover:bg-[#16652b] transition-colors"
      >
        Save Calculator
      </button>
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
