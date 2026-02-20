export interface Crop {
  id: string;
  name: string;
  teluguName: string;
  description: string;
  sowingTime: string;
  pestManagement: string[];
}

export interface NaturalInput {
  id: string;
  name: string;
  teluguName: string;
  ingredients: string[];
  preparation: string;
  usage: string;
}

export const CROPS: Crop[] = [
  {
    id: "rice",
    name: "Rice",
    teluguName: "వరి",
    description: "వరి సాగులో ప్రకృతి వ్యవసాయ పద్ధతులు.",
    sowingTime: "ఖరీఫ్ మరియు రబీ",
    pestManagement: ["కాండం తొలిచే పురుగు", "ఆకు ముడత పురుగు", "సుడి దోమ"]
  },
  {
    id: "groundnut",
    name: "Groundnut",
    teluguName: "వేరుశనగ",
    description: "వేరుశనగ సాగులో ప్రకృతి వ్యవసాయ పద్ధతులు.",
    sowingTime: "ఖరీఫ్",
    pestManagement: ["ఎర్ర గొంగళి పురుగు", "వేరు పురుగు"]
  },
  {
    id: "cotton",
    name: "Cotton",
    teluguName: "పత్తి",
    description: "పత్తి సాగులో ప్రకృతి వ్యవసాయ పద్ధతులు.",
    sowingTime: "ఖరీఫ్",
    pestManagement: ["గులాబీ రంగు పురుగు", "శనగ పచ్చ పురుగు"]
  }
];

export const NATURAL_INPUTS: NaturalInput[] = [
  {
    id: "beejamrutham",
    name: "Beejamrutham",
    teluguName: "బీజామృతం",
    ingredients: ["ఆవు పేడ", "ఆవు మూత్రం", "సున్నం", "మట్టి", "నీరు"],
    preparation: "విత్తన శుద్ధి కోసం ఉపయోగిస్తారు. ఆవు పేడ, మూత్రం, సున్నం మరియు మట్టిని నీటిలో కలిపి 24 గంటలు ఉంచాలి.",
    usage: "విత్తనాలను ఈ ద్రావణంలో ముంచి ఆరబెట్టి నాటుకోవాలి."
  },
  {
    id: "jeevamrutham",
    name: "Jeevamrutham",
    teluguName: "జీవామృతం",
    ingredients: ["ఆవు పేడ", "ఆవు మూత్రం", "బెల్లం", "పిండి", "మట్టి", "నీరు"],
    preparation: "200 లీటర్ల నీటిలో 10 కిలోల ఆవు పేడ, 10 లీటర్ల మూత్రం, 2 కిలోల బెల్లం, 2 కిలోల పిండి మరియు గుప్పెడు మట్టి కలిపి 2-3 రోజులు మురగబెట్టాలి.",
    usage: "నీటితో కలిపి పొలానికి పారించాలి లేదా పిచికారీ చేయాలి."
  },
  {
    id: "neemastram",
    name: "Neemastram",
    teluguName: "నీమాస్త్రం",
    ingredients: ["ఆవు పేడ", "ఆవు మూత్రం", "వేప ఆకులు", "నీరు"],
    preparation: "వేప ఆకులను నూరి ఆవు పేడ, మూత్రంతో కలిపి 48 గంటలు ఉంచాలి.",
    usage: "రసం పీల్చే పురుగుల నివారణకు పిచికారీ చేయాలి."
  }
];
