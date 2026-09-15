// Central SEO content registry. Each guide targets one keyword cluster.
// Add a new guide = add a file + import it here. No app code involved.
import manifestation from "./manifestation.mjs";
import lawOfAttraction from "./law-of-attraction.mjs";
import identityShifting from "./identity-shifting.mjs";
import method369 from "./369-method.mjs";
import affirmations from "./affirmations.mjs";
import betterVersion from "./better-version-of-yourself.mjs";
import neuroscience from "./neuroscience-of-manifestation.mjs";
import rpgGame from "./gamify-your-life-rpg.mjs";
import gratitude from "./gratitude-journal.mjs";
import pricing from "./pricing.mjs";

export const SITE = {
  url: "https://www.menifestos.com",
  name: "Menifest OS",
};

export const HUB = {
  title: "Manifestation Guides — 369 Method, Law of Attraction, Identity Shifting & More | Menifest OS",
  description:
    "Free, practical guides on manifestation: the 369 method, law of attraction, identity shifting, affirmations that work, the neuroscience behind it, and how to gamify your life like an RPG.",
  h1: "Manifestation, explained like a system",
  keywords: ["manifestation guide", "how to manifest", "law of attraction guide", "369 method", "identity shifting", "affirmations", "neuroscience of manifestation"],
  intro: [
    "Most manifestation content is either pure fluff or pure skepticism. These guides sit in the middle: the actual techniques, what the psychology and neuroscience say about why they work, and a daily protocol you can follow — with or without our app.",
    "Start anywhere. Each guide is self-contained, takes 5–9 minutes, and ends with a routine you can begin today.",
  ],
};

export const PAGES = [
  manifestation,
  lawOfAttraction,
  identityShifting,
  method369,
  affirmations,
  betterVersion,
  neuroscience,
  rpgGame,
  gratitude,
  pricing,
];
