// A few pages from BREATH I — Quarter of a century, shown in the "Art" section.
// Edit freely: keep each page short enough to fit on one card.

export type BookPage = { chapter: string; title: string; page: number; text: string[] };

export const BOOK_PAGES: BookPage[] = [
  {
    chapter: "Introduction",
    title: "The Start of an Atom",
    page: 1,
    text: [
      "I've always wanted to understand the chaotic lines of a human life, so I looked up; at the massive space we are traveling through.",
      "If the universe is that vast, then in the grand design, very little truly matters. And within that nothingness lies your freedom. You are never locked into a rigid destiny, you are free to change your shape at any moment.",
    ],
  },
  {
    chapter: "Introduction",
    title: "Δx · Δp ≥ ħ/2",
    page: 2,
    text: [
      "If you focus all your energy on pinning down your exact position within your past, you lose the momentum needed to move forward.",
      "To break the cycles of a past, you have to let go of the need for a perfect blueprint and just start moving into the unknown.",
    ],
  },
  {
    chapter: "Chapter II",
    title: "Life ? Surf it",
    page: 5,
    text: [
      "We are wave-riders; we surf the crests and valleys until there are no waves left to ride. Problems and issues are not design flaws; they mean you are existing.",
      "A calm, flat sea is profoundly boring. Let us fight this life and surf the waves with intention.",
    ],
  },
  {
    chapter: "Chapter III",
    title: "Money = Options to live",
    page: 8,
    text: [
      "Happiness cannot be captured by brute force; it is indeed a butterfly, she lands softly only when you are looking away.",
      "Take the option that challenges your brain the most. Comfort should feel uncomfortable. For a star to shine, it must burn.",
    ],
  },
  {
    chapter: "Chapter V",
    title: "Feather",
    page: 10,
    text: [
      "My soul has always been guided by a feather.",
      "We are particles in transit. Let us keep our systems clean, our calculations precise, and our souls free.",
    ],
  },
  {
    chapter: "Conclusion",
    title: "The Ledger of Light",
    page: 11,
    text: [
      "Energy is not simply erased. It changes form. The grief became discernment. The anger became boundaries. The loneliness became a room in which I could finally hear my own voice.",
      "Nobody hands you a key. You forge yours from the values you need the most.",
    ],
  },
  {
    chapter: "Conclusion",
    title: "Becoming",
    page: 12,
    text: [
      "Put your hand over your heart. Feel the small, stubborn rhythm continuing without applause. That is not nothing.",
      "Becoming is not a destination. It is the quiet courage to choose life, and then to choose it again tomorrow.",
    ],
  },
];

/** little ideas floating around the pages; `page` = index in BOOK_PAGES it comes from */
export const BOOK_IDEAS: { text: string; page: number }[] = [
  { text: "Energy is never lost. It changes form; and so do we.", page: 5 },
  { text: "Happiness is a butterfly.", page: 3 },
  { text: "For a star to shine, it must burn.", page: 3 },
  { text: "A calm, flat sea is profoundly boring.", page: 2 },
  { text: "We are particles in transit.", page: 4 },
  { text: "Comfort should feel uncomfortable.", page: 3 },
  { text: "You are free to change your shape at any moment.", page: 0 },
  { text: "Becoming is not a destination.", page: 6 },
];
