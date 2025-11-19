export const SYNONYMS: Record<string, string> = {
  // British / Indian / US variants
  aubergine: "eggplant",
  brinjal: "eggplant",
  courgette: "zucchini",
  coriander: "kothimbir",
  curd: "yogurt",
  ladyfinger: "okra",
  "lady finger": "okra",
  capsicum: "bell pepper",
  scallion: "spring onion",
  greens: "spinach",

  // Spelling/variants
  chilli: "chili",
  chillies: "chili",
  chilis: "chili",
  cukes: "cucumber",

  // Pluralization and common forms
  tomatoes: "tomato",
  onions: "onion",
  potatoes: "potato",
  carrots: "carrot",
  radishes: "radish",
  chilies: "chili",
  eggs: "egg",
  chickpeas: "chickpea",
  lentils: "lentil",
  beans: "bean",
  salts: "salt",
  sugars: "sugar",

  // Brand-y words stripped (full phrases)
  "amul cheese": "cheese",
  "amul butter": "butter",
  "basa fish": "fish",
  "everest pav bhaji masala": "pav bhaji masala",
  "suhana pav bhaji masala": "pav bhaji masala",
  "shan pav bhaji masala": "pav bhaji masala",
  "tata salt": "salt",
  "aashirvaad salt": "salt",

  // Common mistakes
  raddish: "radish",
  raddist: "radish",
  reddish: "radish",
};

// Add a few small locality / item mappings
export const LOCAL_SYNONYMS: Record<string,string> = {
  pav: 'bread',
  'pav bhaji': 'pav bhaji masala',
};

// merge local synonyms into SYNONYMS for runtime use (keeps single export shape)
Object.assign(SYNONYMS, LOCAL_SYNONYMS);
