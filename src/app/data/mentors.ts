// The people who helped along the way. One per chapter, in the same order as CHAPTERS.
// In the game, the ride stops at each city and Ikrame has a short chat with them.
// Edit the lines freely: "them" = the mentor speaking, "me" = Ikrame.

export type HairStyle = "short" | "messy" | "quiff" | "side" | "crop";

export type MentorLook = {
  height: number; // 1 = average, 1.25 = very tall
  girth: number; // 1 = slim, 1.5 = round
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  pants: string;
  shoes: string;
  jacket?: string;
  glasses?: boolean;
  shades?: boolean;
  scarf?: string;
  lanyard?: boolean;
  hoodie?: boolean;
};

export type Mentor = {
  name: string;
  look: MentorLook;
  lines: { who: "them" | "me"; text: string }[];
};

export const MENTORS: Mentor[] = [
  {
    name: "Pascal",
    look: { height: 1, girth: 1.5, skin: "#f3cfb3", hair: "#5a3d2b", hairStyle: "short", top: "#2f4f7f", pants: "#c2ad86", shoes: "#4a3527", glasses: true },
    lines: [
      { who: "them", text: "Ikrame! First day at Alstef? Welcome to Rennes. Grab a coffee, then we'll open the code together." },
      { who: "me", text: "Thank you, Pascal. I'm a little nervous…" },
      { who: "them", text: "Everybody is on day one. Ask every question you have, that's how good engineers are made." },
      { who: "me", text: "Then I'll ask a lot! Thank you for showing me the ropes." },
    ],
  },
  {
    name: "Tim",
    look: { height: 1.28, girth: 0.95, skin: "#f6d7c0", hair: "#d9b46a", hairStyle: "messy", top: "#5f7a6a", pants: "#34445e", shoes: "#e9e6df", hoodie: true },
    lines: [
      { who: "them", text: "Hey, up here! Welcome to Guardsquare. Ready to protect some apps?" },
      { who: "me", text: "Hi Tim! Ready. ProGuard looks a bit scary from the inside though." },
      { who: "them", text: "One class at a time. You'll be shrinking and obfuscating like a pro before you know it." },
      { who: "me", text: "Thank you for being so patient with me, Tim." },
    ],
  },
  {
    name: "Antoine",
    look: { height: 1.08, girth: 1, skin: "#e9c19f", hair: "#1f1a1c", hairStyle: "quiff", top: "#f4f2ee", pants: "#2a2d3a", shoes: "#f4f2ee", jacket: "#1d1d24", shades: true },
    lines: [
      { who: "them", text: "Salut Ikrame, welcome to Microsoft! Datacenters never sleep… but don't worry, neither does the coffee machine." },
      { who: "me", text: "Haha, merci Antoine! Where do I start?" },
      { who: "them", text: "Stay calm, follow the runbook, and trust yourself. You've got this." },
      { who: "me", text: "Thank you for always keeping it cool. I learned so much with you." },
    ],
  },
  {
    name: "Tobias",
    look: { height: 1.12, girth: 1.05, skin: "#f5d5bf", hair: "#8a6440", hairStyle: "side", top: "#d8c3a0", pants: "#3b3f4c", shoes: "#5a4232", scarf: "#b4485a" },
    lines: [
      { who: "them", text: "Willkommen in Frankfurt, Ikrame! It's cold outside, but the team is warm, I promise." },
      { who: "me", text: "Danke, Tobias! It's freezing!" },
      { who: "them", text: "Then let's keep you busy. Infra ops is easier when we do it together." },
      { who: "me", text: "Thank you for making me feel at home, so far from home." },
    ],
  },
  {
    name: "Ludovic",
    look: { height: 1.04, girth: 1.1, skin: "#eac6a6", hair: "#2b2422", hairStyle: "crop", top: "#a9c7e6", pants: "#5b6070", shoes: "#2b2b33", lanyard: true },
    lines: [
      { who: "them", text: "Hello Ikrame, I'm Ludovic. Welcome aboard! Here, hospitals count on systems that never go down." },
      { who: "me", text: "That's exactly why I'm here. Let's keep them running." },
      { who: "them", text: "With everything you learned on the road, I think you're ready." },
      { who: "me", text: "Thanks, Ludovic. Every person on this road helped me get here." },
    ],
  },
];
