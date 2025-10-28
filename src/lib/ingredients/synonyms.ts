export const SYNONYMS: Record<string, string> = {
  // British / Indian / US variants
  aubergine: "eggplant",
  brinjal: "eggplant",
  courgette: "zucchini",
  coriander: "cilantro",
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

  // Brand-y words stripped
  "amul cheese": "cheese",
  "amul butter": "butter",
  "basa fish": "fish",

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
