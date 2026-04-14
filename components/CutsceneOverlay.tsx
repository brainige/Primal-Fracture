import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ───────────────────────────────────────────────────────────
export interface CutsceneBeat {
  speaker?: string;
  text: string;
  duration?: number;
  mood?: 'tense' | 'calm' | 'combat' | 'dark' | 'hopeful';
  // Visual scene description — rendered as the main visual panel
  visual: string;
  // Context/explanation — shown on the right side
  context: string;
}

export interface CutsceneData {
  id: string;
  title?: string;
  skipToChapter?: number;   // auto-advance to this chapter when cutscene ends
  beats: CutsceneBeat[];
}

// ─── Cutscene scripts with visuals ───────────────────────────────────
export const CUTSCENES: Record<number, CutsceneData> = {
  1: {
    id: 'ch1_ambush',
    title: 'KORRATH ISLANDS — DAWN',
    skipToChapter: 2,       // Skip "30 Minutes of Wonder" — go straight to Ch2
    beats: [
      {
        text: 'The Korrath Islands appeared out of morning fog like something remembered rather than discovered.',
        mood: 'calm',
        visual: 'A small charter boat cuts through calm turquoise waters. Mist clings to volcanic peaks ahead. Tropical birds circle overhead. Marcus stands at the bow with a camera around his neck, squinting against the morning sun.',
        context: 'Marcus Harlow — war photographer and journalist — hired a charter boat to photograph the Korrath Archipelago. He believed it was an uninhabited nature preserve.'
      },
      {
        speaker: 'Marcus',
        text: '"Beautiful..."',
        mood: 'calm',
        duration: 2800,
        visual: 'Close-up of Marcus\'s face, eyes wide, reflecting green jungle and blue sea. Behind him, the charter boat captain checks instruments nervously. The camera hangs around Marcus\'s neck.',
        context: 'Marcus doesn\'t know it yet, but the islands are controlled by Ironclad Solutions — a private military contractor operating an illegal varantite mining operation.'
      },
      {
        text: 'Dense green walls of jungle rising sheer from the water. The smell of wet earth and tropical flowers.',
        mood: 'calm',
        visual: 'Panoramic view of the coastline — towering cliffs draped in emerald vegetation, waterfalls threading down volcanic rock faces. Schools of fish flash silver beneath the surface.',
        context: 'The Korrath Islands are volcanic in origin, rich in varantite — a rare mineral worth billions. The international community believes the islands are abandoned.'
      },
      {
        text: 'He had thirty minutes of this.',
        mood: 'tense',
        duration: 3200,
        visual: 'Wide shot — the charter boat now appears tiny against the vast island. A thin dark object emerges around the northern headland. Marcus doesn\'t see it yet.',
        context: 'Ironclad maintains an exclusion zone. No civilian vessel has reached the inner islands in three years. Marcus\'s boat was tracked from the moment it entered range.'
      },
      {
        text: 'Then the Ironclad patrol boat came from behind the northern headland — grey-hulled and low in the water.',
        mood: 'combat',
        visual: 'An armoured patrol boat roars into view — matte grey hull, .50 calibre mounted on the bow. Three soldiers in black tactical gear aim assault rifles. A loudspeaker blares a warning. The charter captain raises his hands.',
        context: 'The patrol boat is part of Ironclad\'s naval perimeter. Standard procedure: detain, interrogate, eliminate witnesses. The charter captain will later be found dead.'
      },
      {
        text: 'Marcus was handcuffed with a cable tie and put in the patrol boat\'s hold.',
        mood: 'dark',
        visual: 'Marcus is forced to his knees on the deck. A soldier zip-ties his wrists behind his back. His camera is thrown overboard. He\'s shoved down metal stairs into a dark hold.',
        context: 'Marcus is taken to Camp Blackbay — a detention facility on the southern island. He will spend 72 hours in a concrete cell before finding an opportunity to escape.'
      },
    ]
  },

  3: {
    id: 'ch3_escape',
    title: 'CAMP BLACKBAY — 2:00 AM',
    beats: [
      {
        text: 'Private Hewitt stopped outside Marcus\'s cell — twenty-two years old, visibly exhausted.',
        mood: 'tense',
        visual: 'A dimly lit concrete corridor. A young soldier leans against the wall outside a steel cell door, his rifle propped beside him. His eyes are half-closed. Rain hammers the tin roof above.',
        context: 'Private Hewitt has been on guard duty for 14 hours. Camp Blackbay runs on skeleton crews at night — most soldiers are stationed at the mining sites.'
      },
      {
        text: 'Nine minutes of careful work on the bolt mechanism.',
        mood: 'tense',
        visual: 'Inside the cell — Marcus crouches by the door, working a bent metal wire into the bolt housing. His hands are bleeding. The only light comes from a flickering bulb in the corridor.',
        context: 'Marcus spent two tours embedded with military units in conflict zones. He learned basic lock manipulation from a combat engineer in Syria.'
      },
      {
        text: 'He took Hewitt\'s keys and sidearm — a scratched pistol with a crack running through the grip.',
        mood: 'tense',
        visual: 'Marcus stands over the unconscious guard. He takes a keyring and a battered M1911 pistol — the grip is cracked and held together with electrical tape. He checks the magazine: seven rounds.',
        context: 'The M1911 is standard issue for Ironclad\'s lower-rank guards. It\'s poorly maintained but functional. Seven rounds — Marcus will need to make every shot count.'
      },
      {
        speaker: 'Lena',
        text: '"Can you shoot?"',
        mood: 'dark',
        visual: 'A handheld radio crackles in the guardhouse. A woman\'s voice — calm, precise, with a slight local accent. Marcus holds it to his ear, crouching behind a concrete barrier. Searchlights sweep the compound.',
        context: 'Lena — whose real name Marcus won\'t learn for weeks — is a resistance operative who has been monitoring Ironclad\'s radio frequencies. She saw Marcus arrive.'
      },
      {
        speaker: 'Marcus',
        text: '"Yes."',
        duration: 2000,
        visual: 'Close-up of Marcus\'s face, lit by the radio\'s green glow. Rain runs down his face. Behind him, the compound\'s main gate is visible — two guards, one spotlight. His jaw is set.',
        context: 'Marcus\'s journalist career took him to Afghanistan, Syria, and the Congo. He\'s been shot at before, but never shot back. Tonight that changes.'
      },
      {
        speaker: 'Lena',
        text: '"Good enough. Head north through the drainage channel. My people will find you."',
        mood: 'tense',
        duration: 3000,
        visual: 'Marcus moves through rain-slicked concrete corridors. He passes a drainage grate — beyond it, thick jungle. He squeezes through the gap, the rusted metal scraping his shoulders. Ahead: darkness and the sound of insects.',
        context: 'The resistance operates in small cells across the islands. Lena coordinates from a hidden safehouse. Getting to her means crossing two kilometers of hostile jungle.'
      },
    ]
  },

  7: {
    id: 'ch7_briefing',
    title: 'RESISTANCE SAFEHOUSE — THE BRIEFING',
    beats: [
      {
        text: 'Lena explained Voss methodically, without emotion.',
        mood: 'tense',
        visual: 'A cramped underground room lit by a single oil lamp. Maps cover every wall — hand-drawn, annotated in red ink. Photos of soldiers are pinned with thumbtacks. Lena stands at the wall, pointing to a large map of the archipelago.',
        context: 'The safehouse is built into an old lava tube beneath the jungle floor. Ironclad has searched for it for two years without success.'
      },
      {
        speaker: 'Lena',
        text: '"Director Harlan Voss. Fifty-one years old. Built Ironclad Solutions over fifteen years."',
        mood: 'dark',
        visual: 'Lena taps a photograph — a man in his fifties with cropped grey hair and a tailored field jacket. Sharp eyes. Behind him in the photo: a mahogany desk and floor-to-ceiling windows overlooking a volcanic caldera.',
        context: 'Voss was a decorated military intelligence officer before founding Ironclad. He discovered varantite on the islands and used his connections to keep the find classified.'
      },
      {
        speaker: 'Lena',
        text: '"He controls the archipelago through three sector lieutenants."',
        mood: 'dark',
        visual: 'Three photographs pinned to the wall in a triangle formation. Red string connects them to the central image of Voss. Each photo has a sector of the island map outlined beneath it.',
        context: 'The three-sector system ensures no single lieutenant knows everything. Even if one falls, Voss retains control through the other two. A deliberate redundancy.'
      },
      {
        speaker: 'Lena',
        text: '"Mako runs the rainforest interior. A former mercenary built for violence."',
        mood: 'combat',
        visual: 'Photo: a massive man with burn scars across his left arm, holding an assault rifle in each hand. Behind him — thick jungle, a makeshift fortress of corrugated metal and sandbags.',
        context: 'Lieutenant Mako — real name unknown. Former private military contractor. He controls Sector C: the central rainforest, where the main varantite deposits are located.'
      },
      {
        speaker: 'Lena',
        text: '"Serrin controls the volcanic highlands. A tactician who wins through patience."',
        mood: 'tense',
        visual: 'Photo: a thin man in wire-rimmed glasses studying a topographic map. His camp is on a ridgeline — from his position, he can see three valleys. Trip wires and sensors line every approach.',
        context: 'Lieutenant Serrin — a former intelligence analyst. He doesn\'t fight directly. He positions his forces to create kill zones. Every path is monitored. Every approach is mined.'
      },
      {
        speaker: 'Lena',
        text: '"Pryce holds Voss Port\'s outer approaches. A true believer — the most dangerous kind."',
        mood: 'dark',
        visual: 'Photo: a woman with close-cropped black hair in full combat dress, standing on the bow of a gunboat. She salutes toward the port. Her soldiers mirror the gesture behind her.',
        context: 'Lieutenant Pryce is the only one who believes in Voss\'s vision. Not the money — the mission. She\'ll fight to the death, and her soldiers will too.'
      },
      {
        speaker: 'Lena',
        text: '"To reach Voss, you go through all three."',
        mood: 'tense',
        duration: 3500,
        visual: 'Wide shot of the map wall. Three red X marks over the three sector bases. Dotted lines lead from each to Voss Port at the center. Marcus studies them in silence, the oil lamp flickering across his face.',
        context: 'The campaign will take weeks. Marcus — a photographer who has never killed anyone — must dismantle the most efficient private military operation in the Pacific.'
      },
    ]
  },

  12: {
    id: 'ch12_mako_down',
    title: 'SECTOR C — ENFORCER BASE',
    beats: [
      {
        text: 'Lieutenant Mako went down fighting, which was consistent with who he was.',
        mood: 'combat',
        visual: 'A burning military compound. Mako lies face-down amid overturned tables and spent shell casings. Marcus stands at the entrance, weapon lowered, breathing hard. Smoke rises from every building.',
        context: 'Mako refused to surrender. He fired until his last round, then charged. Marcus put two bullets in his chest. It was the first time Marcus killed someone he\'d studied.'
      },
      {
        text: 'The enforcer base fell silent for the first time in months.',
        mood: 'calm',
        visual: 'Wide shot of the base from above — fires dying, jungle reclaiming the edges. A bird lands on a guard tower. The silence is absolute.',
        context: 'With Mako gone, Sector C\'s supply lines collapse. Sixty-three soldiers will desert within 48 hours. The varantite mines go silent.'
      },
      {
        speaker: 'Lena',
        text: '"One sector broken. Two remaining."',
        mood: 'tense',
        visual: 'Marcus clicks the radio. Lena\'s voice, steady as always. In the safehouse, she crosses out Mako\'s photo with a red marker. Two photos remain on the wall.',
        context: 'Lena doesn\'t celebrate. She marks progress and moves on. The hardest sectors are still ahead — Serrin\'s highland traps and Pryce\'s fanatical defense.'
      },
    ]
  },

  13: {
    id: 'ch13_serrin_down',
    title: 'SERRIN\'S TACTICAL CAMP — VOLCANIC HIGHLANDS',
    beats: [
      {
        text: 'Serrin fell to patience — his own strength turned against him.',
        mood: 'tense',
        visual: 'A highland camp in ruins. Serrin\'s wire-rimmed glasses lie cracked on a map table. His complex network of sensors and trip wires — all disconnected. Marcus bypassed them over three days of careful observation.',
        context: 'Marcus spent 72 hours studying Serrin\'s patterns. A tactician relies on predictability. Marcus found the blind spot in Serrin\'s surveillance grid and used it.'
      },
      {
        speaker: 'Lena',
        text: '"Two sectors broken. One stands between us and Voss Port."',
        mood: 'tense',
        visual: 'Marcus sits exhausted on a rock, the volcanic highlands spreading out below him. In the distance — Voss Port, a concrete fortress on the coast. Smoke rises from its chimneys.',
        context: 'Pryce\'s sector is the final barrier. She controls the approaches to the port with naval patrols, shore batteries, and the most loyal soldiers on the islands.'
      },
    ]
  },

  14: {
    id: 'ch14_pryce_down',
    title: 'PRYCE\'S JUNGLE OUTPOST',
    beats: [
      {
        text: 'Pryce fell to decisiveness — her fanaticism made her predictable at the critical moment.',
        mood: 'combat',
        visual: 'A jungle clearing. Pryce\'s outpost is overrun — sandbag walls breached, her flag torn down. Pryce herself lies against a tree, bleeding but still reaching for her sidearm. Her eyes are defiant.',
        context: 'Pryce\'s loyalty to Voss was absolute. She committed every soldier to a frontal defense, leaving no reserves. When Marcus flanked, there was nothing left to stop him.'
      },
      {
        text: 'With all three sectors broken, Voss pulled inward.',
        mood: 'dark',
        visual: 'Aerial view of the archipelago. Three columns of smoke rise from the fallen sector bases. At the center, Voss Port bristles with activity — vehicles moving, soldiers fortifying walls.',
        context: 'Voss consolidates his remaining 200 soldiers into the port compound. The walls are reinforced. The mining equipment is weaponized. He knows Marcus is coming.'
      },
      {
        speaker: 'Lena',
        text: '"This is it. Everything converges on the port."',
        mood: 'tense',
        duration: 3500,
        visual: 'The safehouse. Lena places the last X on the map — all three lieutenants gone. Only the central fortress remains. She looks at Marcus. For the first time, there\'s uncertainty in her eyes.',
        context: 'The final assault will require everything. The resistance has 23 fighters left. Voss has 200 professional soldiers, fortified positions, and a contingency plan Marcus doesn\'t yet know about.'
      },
    ]
  },

  20: {
    id: 'ch20_last_conversation',
    title: 'LAVA TUBE — VOLCANIC MOUNTAIN',
    beats: [
      {
        text: 'The lava tube had been known to the Korrath people for generations.',
        mood: 'calm',
        visual: 'A natural tunnel carved by ancient lava flows — smooth black walls that shimmer with mineral deposits. Battery-powered lanterns line the floor. At the entrance, jungle vines hang like curtains.',
        context: 'The lava tube connects the jungle to the volcanic interior — a route Ironclad has never discovered. The indigenous Korrath people used it for centuries before Voss arrived.'
      },
      {
        text: 'Lena was waiting at the entrance. Behind her: four resistance fighters and everything the resistance had left.',
        mood: 'tense',
        visual: 'Lena stands with four armed fighters — each carrying everything they own. Ammunition is rationed. Two have bandaged wounds. They look at Marcus with a mixture of hope and exhaustion.',
        context: 'Twenty-three fighters started. Four remain. The rest are dead, captured, or scattered. This is the last operation the resistance can mount.'
      },
      {
        speaker: 'Lena',
        text: '"The detonation chamber is at the lowest level. The chain reaction would take four to six minutes."',
        mood: 'dark',
        visual: 'Lena points to a hand-drawn blueprint of Voss\'s underground facility. At the bottom level: a chamber marked "VARANTITE CORE." Around it, a network of explosives connected by detonation wiring.',
        context: 'Voss has rigged the varantite deposits with explosives. If he can\'t control the islands, he\'ll destroy them. The blast would level the entire archipelago and poison the surrounding ocean.'
      },
      {
        speaker: 'Lena',
        text: '"The entire archipelago."',
        mood: 'dark',
        duration: 3500,
        visual: 'Marcus stares at the blueprint. The scale of destruction is marked in concentric circles — the blast radius covers every island. Everything they\'ve fought to save would be vaporized.',
        context: 'Voss\'s dead-man switch: if the facility is breached, the detonation sequence begins automatically. Marcus must reach the chamber and disable it before the countdown completes.'
      },
      {
        speaker: 'Lena',
        text: '"Come back first. Then we\'ll argue about the shotgun."',
        mood: 'hopeful',
        duration: 4000,
        visual: 'Lena\'s hand briefly touches Marcus\'s arm. A rare moment. The four fighters look away. Marcus nods once, chambers a round, and walks into the darkness of the lava tube. Lena watches him go.',
        context: 'An inside joke — Lena disapproves of Marcus carrying Voss\'s shotgun, a gun he took from a dead lieutenant. It represents what Marcus is becoming. She wants him to come back as he was.'
      },
    ]
  },

  24: {
    id: 'ch24_voss_defeated',
    title: 'VOSS\'S OFFICE — THE CORE',
    beats: [
      {
        text: 'Floor-to-ceiling glass. A mahogany desk carried down at considerable logistical effort.',
        mood: 'dark',
        visual: 'An underground office that looks transplanted from a corporate headquarters. Glass walls look out over the varantite processing facility. A mahogany desk. A leather chair. A crystal glass of whiskey, still half-full.',
        context: 'Voss built his office to feel like civilization. While his soldiers lived in barracks, he maintained the illusion of legitimacy. The desk cost more than his guards earn in a year.'
      },
      {
        text: 'On the north wall: a custom-engraved shotgun with "V.O.S.S." worked into the metal.',
        mood: 'tense',
        visual: 'A glass display case mounted on the wall — inside, a polished shotgun with gold inlays. The letters V.O.S.S. are engraved along the barrel. Below it: a plaque reading "ORDER THROUGH STRENGTH."',
        context: 'The Woodcutter — Voss\'s personal weapon. Custom-built, never fired in combat. A symbol of authority, not a tool of war. Marcus will take it.'
      },
      {
        speaker: 'Voss',
        text: '"You disabled it. Do you understand what varantite actually represents?"',
        mood: 'dark',
        visual: 'Voss sits behind his desk, hands folded. He\'s calm. Behind him, through the glass, the detonation system blinks red — disabled. Marcus stands in the doorway, weapon raised, covered in dust and blood.',
        context: 'Voss expected Marcus to fail. The detonation system was his insurance. Without it, he has nothing. But he asks the question as though the answer matters.'
      },
      {
        speaker: 'Marcus',
        text: '"I understand that you killed people for it. That\'s the relevant part."',
        mood: 'combat',
        duration: 4000,
        visual: 'Marcus steps forward. His voice is flat — no anger, no triumph. Just fact. The glass behind Voss shows the facility shutting down. Emergency lights cast red across both men\'s faces.',
        context: 'This is who Marcus has become. Not a photographer. Not a journalist. Someone who reduces complex situations to their essential moral calculation.'
      },
      {
        text: 'Then Voss reached for his sidearm.',
        mood: 'combat',
        duration: 2800,
        visual: 'A frozen moment — Voss\'s hand moves to his belt. Marcus\'s finger tightens on the trigger. The whiskey glass vibrates on the desk. Through the glass wall, the facility\'s lights go out, one by one.',
        context: 'Voss chose to die on his feet. Marcus gave him exactly what he asked for.'
      },
    ]
  },

  25: {
    id: 'ch25_epilogue',
    title: 'KORRATH ISLANDS — AFTER',
    beats: [
      {
        text: 'The facility\'s emergency access tunnel came out on the eastern slope of the volcano.',
        mood: 'hopeful',
        visual: 'Dawn light floods through a cave mouth. Marcus emerges — silhouetted against the sunrise, weapons slung across his back, dust still settling around him. Below, the ocean shimmers gold.',
        context: 'The facility is secure. The detonation system is permanently disabled. Ironclad\'s command structure has been destroyed. It\'s over.'
      },
      {
        speaker: 'Lena',
        text: '"The detonation system?"',
        mood: 'calm',
        visual: 'Lena stands at the jungle\'s edge, arms crossed. Her radio is silent for the first time in weeks. The four surviving fighters sit nearby, too exhausted to celebrate.',
        context: 'Lena has been waiting for hours. She heard the gunfire stop. She needed to hear Marcus say it.'
      },
      {
        speaker: 'Marcus',
        text: '"Disabled."',
        duration: 2200,
        visual: 'Close-up of Marcus\'s face in morning light. He\'s aged. Cuts and bruises. But his eyes are clear.',
        context: 'One word. The islands will survive.'
      },
      {
        speaker: 'Lena',
        text: '"Voss?"',
        mood: 'calm',
        visual: 'Lena\'s face — searching Marcus\'s expression for the answer before he gives it.',
        context: 'She needs to know it\'s finished.'
      },
      {
        speaker: 'Marcus',
        text: '"Gone."',
        duration: 2500,
        visual: 'Marcus looks away, toward the ocean. The word carries weight. Below them, the first fishing boats in years are visible on the horizon.',
        context: 'Gone. Not killed. Not eliminated. Gone. Marcus chooses his word carefully.'
      },
      {
        text: 'The Ironclad garrison, leaderless and cut off, began its own disintegration.',
        mood: 'hopeful',
        visual: 'Montage — soldiers dropping weapons. Guard towers abandoned. Gates swinging open. Local people walking freely through areas that were forbidden for years.',
        context: 'Without Voss, without lieutenants, without purpose — 200 soldiers become 200 men looking for a way home. Most will surrender within 48 hours.'
      },
      {
        text: 'Marcus stayed for two months — photographing the rebuilding, the reef, the jungle.',
        mood: 'calm',
        visual: 'Marcus with a new camera — photographing children playing on a beach that used to be a military dock. Lena stands behind him, arms crossed, almost smiling. The jungle grows over the ruins of a checkpoint.',
        context: 'The photographer came back. Marcus picks up his camera again. The images he takes will eventually reach the international press and expose everything Ironclad did.'
      },
      {
        text: 'When he finally left, he left the pistols at the safehouse and the Woodcutter in Kova-Sael.',
        mood: 'hopeful',
        visual: 'A wooden table in the safehouse — two pistols, an assault rifle, and the engraved shotgun laid out neatly. Marcus\'s hand pulls away. He picks up only his camera bag.',
        context: 'Marcus leaves every weapon behind. He arrived as a photographer and he leaves as one. The weapons belong to the islands now.'
      },
      {
        text: 'The islands were real. They were still here.',
        mood: 'calm',
        duration: 3500,
        visual: 'Final shot — the Korrath archipelago from the air, exactly as Marcus first saw it. Green peaks rising from blue water. Dawn mist. No patrol boats. No smoke. Just islands.',
        context: 'The Korrath Islands survive. The reef begins to heal. The varantite stays in the ground. Some things are worth more unmined.'
      },
      {
        text: 'That was not nothing.',
        mood: 'hopeful',
        duration: 5000,
        visual: 'Fade to black. A single photograph on a gallery wall — the Korrath Islands at dawn. Beneath it: "Untitled — M. Harlow, Korrath Archipelago." A red dot on the frame indicates it\'s been sold.',
        context: 'Marcus Harlow\'s Korrath photographs will win the Pulitzer Prize for Feature Photography. He will decline the award.'
      },
    ]
  },
};

// ─── Mood-based styling ────────────────────────────────────────────
const MOOD_COLORS: Record<string, { accent: string; bg: string; text: string; border: string; visualBg: string }> = {
  calm:    { accent: '#14b8a6', bg: 'from-teal-950/90 via-black to-black',    text: 'text-teal-50',     border: 'border-teal-800/40',   visualBg: 'from-teal-950/60 to-black/80' },
  tense:   { accent: '#f59e0b', bg: 'from-amber-950/90 via-black to-black',   text: 'text-amber-50',    border: 'border-amber-800/40',  visualBg: 'from-amber-950/60 to-black/80' },
  combat:  { accent: '#ef4444', bg: 'from-red-950/90 via-black to-black',     text: 'text-red-50',      border: 'border-red-800/40',    visualBg: 'from-red-950/60 to-black/80' },
  dark:    { accent: '#64748b', bg: 'from-slate-950/95 via-black to-black',   text: 'text-slate-100',   border: 'border-slate-700/40',  visualBg: 'from-slate-950/60 to-black/80' },
  hopeful: { accent: '#34d399', bg: 'from-emerald-950/85 via-black to-black', text: 'text-emerald-50',  border: 'border-emerald-800/40', visualBg: 'from-emerald-950/60 to-black/80' },
};

// ─── Typewriter hook ───────────────────────────────────────────────
function useTypewriter(text: string, speed: number = 28) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { setDone(true); clearInterval(id); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  const skip = () => { setDisplayed(text); setDone(true); };
  return { displayed, done, skip };
}

// ─── Main CutsceneOverlay ──────────────────────────────────────────
export const CutsceneOverlay = ({ cutscene, onComplete }: {
  cutscene: CutsceneData;
  onComplete: () => void;
}) => {
  const [beatIndex, setBeatIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const beat = cutscene.beats[beatIndex];
  const mood = beat?.mood || 'dark';
  const colors = MOOD_COLORS[mood] || MOOD_COLORS.dark;

  const { displayed: dialogueText, done: dialogueDone, skip: skipDialogue } = useTypewriter(beat?.text || '', 28);
  const { displayed: visualText, done: visualDone } = useTypewriter(beat?.visual || '', 18);

  // Auto-advance
  useEffect(() => {
    if (!dialogueDone || !beat) return;
    const dur = beat.duration || Math.max(3000, beat.text.length * 50);
    timerRef.current = setTimeout(() => {
      if (beatIndex < cutscene.beats.length - 1) setBeatIndex(i => i + 1);
      else onComplete();
    }, dur);
    return () => clearTimeout(timerRef.current);
  }, [dialogueDone, beatIndex, cutscene.beats.length, onComplete, beat]);

  const advance = useCallback(() => {
    if (!dialogueDone) { skipDialogue(); return; }
    clearTimeout(timerRef.current);
    if (beatIndex < cutscene.beats.length - 1) setBeatIndex(i => i + 1);
    else onComplete();
  }, [dialogueDone, skipDialogue, beatIndex, cutscene.beats.length, onComplete]);

  const skipAll = useCallback(() => { clearTimeout(timerRef.current); onComplete(); }, [onComplete]);

  if (!beat) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[200] select-none cursor-pointer"
      onClick={advance}
    >
      {/* BG Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${colors.bg}`} />

      {/* Letterbox top */}
      <div className="absolute top-0 left-0 right-0 h-[8%] bg-black z-30" />
      {/* Letterbox bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-black z-30" />

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pt-[9%] pb-[9%] flex flex-col z-20">

        {/* Title beacon */}
        {cutscene.title && beatIndex === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="flex-shrink-0 text-center mb-4"
          >
            <div className="font-display tracking-[0.5em] text-sm" style={{ color: colors.accent }}>
              {cutscene.title}
            </div>
          </motion.div>
        )}

        {/* ── Content: visual area + context sidebar ──────────────── */}
        <div className="flex-1 flex gap-5 px-8 min-h-0">

          {/* LEFT — Visual Scene Panel (70%) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`visual-${beatIndex}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.6 }}
              className={`flex-[7] rounded-lg border ${colors.border} overflow-hidden flex flex-col`}
              style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.9))` }}
            >
              {/* Visual description as the "scene" */}
              <div className="flex-1 p-8 flex items-center justify-center overflow-y-auto custom-scrollbar">
                <p className="font-narrative italic text-lg leading-relaxed text-white/80 max-w-xl text-center">
                  {visualText}
                  {!visualDone && <span className="inline-block w-0.5 h-5 bg-white/40 ml-1 animate-pulse" />}
                </p>
              </div>

              {/* Mood indicator bar at bottom of visual */}
              <div className="h-1 flex-shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }} />
            </motion.div>
          </AnimatePresence>

          {/* RIGHT — Context/Explanation Panel (30%) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`ctx-${beatIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={`flex-[3] rounded-lg border ${colors.border} p-6 flex flex-col gap-3 overflow-y-auto custom-scrollbar`}
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <div className="font-ui text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: colors.accent }}>
                Intel Brief
              </div>
              <p className="font-ui text-sm leading-relaxed text-white/60">
                {beat.context}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom: Speaker + Dialogue ──────────────────────────── */}
        <div className="flex-shrink-0 px-8 pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={`dlg-${beatIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto"
            >
              {/* Speaker tag */}
              {beat.speaker && (
                <div className="font-display text-sm tracking-[0.3em] mb-2" style={{ color: colors.accent }}>
                  {beat.speaker.toUpperCase()}
                </div>
              )}
              {/* Dialogue line */}
              <p className={`font-narrative text-xl leading-relaxed ${beat.speaker ? 'italic' : ''} ${colors.text}`}>
                {dialogueText}
                {!dialogueDone && <span className="inline-block w-0.5 h-5 bg-white/50 ml-1 animate-pulse" />}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom bar UI ──────────────────────────────────────────── */}
      <div className="absolute bottom-[8.5%] left-0 right-0 z-40 px-8 flex items-center justify-between">
        {/* Progress */}
        <div className="flex gap-1">
          {cutscene.beats.map((_, i) => (
            <div
              key={i}
              className="h-0.5 rounded-full transition-all duration-300"
              style={{
                width: i <= beatIndex ? 20 : 8,
                background: i <= beatIndex ? colors.accent : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-ui text-white/20 text-[9px] tracking-widest uppercase">Click to advance</span>
          <button
            onClick={e => { e.stopPropagation(); skipAll(); }}
            className="font-ui text-white/25 text-[9px] tracking-widest uppercase px-3 py-1 border border-white/10 rounded hover:text-white/60 hover:border-white/30 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-[8%] left-0 right-0 h-px bg-white/5 z-40">
        <motion.div className="h-full" style={{ background: colors.accent }} animate={{ width: `${((beatIndex + 1) / cutscene.beats.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>
    </motion.div>
  );
};

export function getCutsceneForChapter(chapterId: number): CutsceneData | null {
  return CUTSCENES[chapterId] || null;
}
