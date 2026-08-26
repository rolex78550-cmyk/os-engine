import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, X, BookOpen } from "lucide-react";

// iOS 17 + Solo Leveling ARISE design tokens
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.65)";
const TEXT_TERTIARY = "rgba(235,235,245,0.35)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_RED = "#ff453a";
const IOS_GREEN = "#34c759";

// ===================================================================
// AFFIRMATIONS — 100+ "I AM" + famous philosophy
// ===================================================================
type Affirmation = {
  text: string;
  author?: string;
  category: "i-am" | "stoic" | "nietzsche" | "rumi" | "buddha" | "growth" | "shadow" | "success" | "motivation" | "philosophy";
};

const AFFIRMATIONS: Affirmation[] = [
  // ===== I AM (50) =====
  { text: "I am the master of my fate, the captain of my soul.", author: "Invictus", category: "i-am" },
  { text: "I am disciplined when no one is watching.", category: "i-am" },
  { text: "I am the storm that others take shelter from.", category: "i-am" },
  { text: "I am worthy of every dream I have ever had.", category: "i-am" },
  { text: "I am becoming stronger with every challenge I face.", category: "i-am" },
  { text: "I am focused, I am relentless, I am unshakable.", category: "i-am" },
  { text: "I am the ruler of my own kingdom.", category: "i-am" },
  { text: "I am exactly where I need to be in this moment.", category: "i-am" },
  { text: "I am building an empire, one brick at a time.", category: "i-am" },
  { text: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey", category: "i-am" },
  { text: "I am the architect of my destiny.", category: "i-am" },
  { text: "I am powerful beyond measure.", category: "i-am" },
  { text: "I am silence in the middle of chaos.", category: "i-am" },
  { text: "I am rare. I am chosen. I am awakened.", category: "i-am" },
  { text: "I am the hunter, not the hunted.", category: "i-am" },
  { text: "I am a king in training.", category: "i-am" },
  { text: "I am greater than my doubts.", category: "i-am" },
  { text: "I am a magnet for miracles.", category: "i-am" },
  { text: "I am in charge of how I feel, and today I choose happiness.", category: "i-am" },
  { text: "I am the one I've been waiting for.", category: "i-am" },
  { text: "I am a creator, not a consumer.", category: "i-am" },
  { text: "I am fearless in the pursuit of what sets my soul on fire.", category: "i-am" },
  { text: "I am unbreakable.", category: "i-am" },
  { text: "I am aligned with the energy of abundance.", category: "i-am" },
  { text: "I am a vessel of light in this dark world.", category: "i-am" },
  { text: "I am the shadow monarch of my own life.", category: "i-am" },
  { text: "I am patient. I am persistent. I am powerful.", category: "i-am" },
  { text: "I am worthy of love, success, and joy.", category: "i-am" },
  { text: "I am rising like the sun, even on my darkest days.", category: "i-am" },
  { text: "I am designed for greatness.", category: "i-am" },
  { text: "I am not afraid of the storm. I am the storm.", category: "i-am" },
  { text: "I am a force of nature.", category: "i-am" },
  { text: "I am always becoming, never arriving.", category: "i-am" },
  { text: "I am aligned with my highest self.", category: "i-am" },
  { text: "I am the author of my own story.", category: "i-am" },
  { text: "I am free from the need for anyone's approval.", category: "i-am" },
  { text: "I am a warrior of light.", category: "i-am" },
  { text: "I am wise enough to know my worth.", category: "i-am" },
  { text: "I am brave enough to start over.", category: "i-am" },
  { text: "I am calm in the face of uncertainty.", category: "i-am" },
  { text: "I am full of ideas, talent, and creativity.", category: "i-am" },
  { text: "I am surrounded by opportunities.", category: "i-am" },
  { text: "I am the embodiment of focus and clarity.", category: "i-am" },
  { text: "I am chosen for a purpose greater than myself.", category: "i-am" },
  { text: "I am wealthy in mind, body, and spirit.", category: "i-am" },
  { text: "I am exactly who I needed as a child.", category: "i-am" },
  { text: "I am doing the best I can with what I have.", category: "i-am" },
  { text: "I am allowed to take up space.", category: "i-am" },
  { text: "I am rebuilding myself, stronger than before.", category: "i-am" },
  { text: "I am the energy I want to attract.", category: "i-am" },

  // ===== STOIC (15) =====
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", category: "stoic" },
  { text: "The obstacle on the path becomes the path.", author: "Marcus Aurelius", category: "stoic" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", category: "stoic" },
  { text: "Confine yourself to the present.", author: "Marcus Aurelius", category: "stoic" },
  { text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius", category: "stoic" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "stoic" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca", category: "stoic" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca", category: "stoic" },
  { text: "It is not the man who has too little, but the man who craves more, that is poor.", author: "Seneca", category: "stoic" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca", category: "stoic" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus", category: "stoic" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus", category: "stoic" },
  { text: "No man is free who is not master of himself.", author: "Epictetus", category: "stoic" },
  { text: "Man is condemned to be free.", author: "Jean-Paul Sartre", category: "stoic" },
  { text: "The unexamined life is not worth living.", author: "Socrates", category: "stoic" },

  // ===== NIETZSCHE (10) =====
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "Become who you are.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "You must have chaos within you to give birth to a dancing star.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "Whoever fights monsters should see to it that in the process he does not become a monster.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "Man is something that shall be overcome.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "There are no facts, only interpretations.", author: "Friedrich Nietzsche", category: "nietzsche" },

  // ===== RUMI (10) =====
  { text: "What you seek is seeking you.", author: "Rumi", category: "rumi" },
  { text: "The wound is the place where the Light enters you.", author: "Rumi", category: "rumi" },
  { text: "Don't grieve. Anything you lose comes round in another form.", author: "Rumi", category: "rumi" },
  { text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi", category: "rumi" },
  { text: "Set your life on fire. Seek those who fan your flames.", author: "Rumi", category: "rumi" },
  { text: "The lion is most handsome when looking for food.", author: "Rumi", category: "rumi" },
  { text: "Raise your words, not voice. It is rain that grows flowers, not thunder.", author: "Rumi", category: "rumi" },
  { text: "In your light, I learn how to love.", author: "Rumi", category: "rumi" },
  { text: "The moon stays bright when it doesn't avoid the night.", author: "Rumi", category: "rumi" },
  { text: "Be a lamp, or a lifeboat, or a ladder.", author: "Rumi", category: "rumi" },

  // ===== BUDDHA (8) =====
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: "buddha" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "buddha" },
  { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha", category: "buddha" },
  { text: "The only real failure in life is not to be true to the best one knows.", author: "Buddha", category: "buddha" },
  { text: "Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else.", author: "Buddha", category: "buddha" },
  { text: "If you light a lamp for someone else, it will also brighten your path.", author: "Buddha", category: "buddha" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", category: "buddha" },
  { text: "A man is but the product of his thoughts. What he thinks, he becomes.", author: "Mahatma Gandhi", category: "buddha" },

  // ===== GROWTH (12) =====
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "growth" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", category: "growth" },
  { text: "The successful warrior is the average person, with laser-like focus.", author: "Bruce Lee", category: "growth" },
  { text: "Do not pray for an easy life, pray for the strength to endure a difficult one.", author: "Bruce Lee", category: "growth" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Goethe", category: "growth" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "growth" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", category: "growth" },
  { text: "Smooth seas do not make skillful sailors.", author: "Franklin D. Roosevelt", category: "growth" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry", category: "growth" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso", category: "growth" },
  { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger", category: "growth" },
  { text: "There is no substitute for hard work.", author: "Thomas Edison", category: "growth" },

  // ===== SHADOW MONARCH (10) =====
  { text: "Arise.", author: "Shadow Monarch", category: "shadow" },
  { text: "Even the weakest light casts the darkest shadow.", category: "shadow" },
  { text: "Power isn't given. It's taken.", category: "shadow" },
  { text: "I will become a monarch, or I will die trying.", category: "shadow" },
  { text: "The only one who can defeat me is me.", category: "shadow" },
  { text: "Fear is not a weakness. It is information.", category: "shadow" },
  { text: "Every hunter must walk alone at some point.", category: "shadow" },
  { text: "Lone wolves die. The pack survives. I will lead the pack.", category: "shadow" },
  { text: "The dungeon chooses the hunter. The hunter chooses the legend.", category: "shadow" },
  { text: "Awakening is not a moment. It is a choice made every day.", category: "shadow" },

  // ===== SUCCESS (120) =====
  { text: "I am successful in everything I set my mind to.", category: "success" },
  { text: "Success flows to me effortlessly and consistently.", category: "success" },
  { text: "I attract wealth, opportunity, and achievement.", category: "success" },
  { text: "Every day I move closer to my goals.", category: "success" },
  { text: "I am a magnet for success and prosperity.", category: "success" },
  { text: "I turn obstacles into stepping stones.", category: "success" },
  { text: "My mind is sharp and my actions are aligned.", category: "success" },
  { text: "I am capable of achieving extraordinary results.", category: "success" },
  { text: "Money comes to me in expected and unexpected ways.", category: "success" },
  { text: "I deserve the success that is coming my way.", category: "success" },
  { text: "I am consistent, and consistency breeds success.", category: "success" },
  { text: "My income is constantly increasing.", category: "success" },
  { text: "I am surrounded by people who want to see me win.", category: "success" },
  { text: "I take massive action toward my dreams daily.", category: "success" },
  { text: "I am an unstoppable force of achievement.", category: "success" },
  { text: "Abundance is my birthright.", category: "success" },
  { text: "I am open to receiving all the wealth life offers.", category: "success" },
  { text: "My work creates value and value creates wealth.", category: "success" },
  { text: "I am the CEO of my own life.", category: "success" },
  { text: "I think like a winner, so I win.", category: "success" },
  { text: "Every rejection redirects me to something better.", category: "success" },
  { text: "I am disciplined in the pursuit of my goals.", category: "success" },
  { text: "My potential is limitless.", category: "success" },
  { text: "I am building a legacy that outlives me.", category: "success" },
  { text: "Success is my habit, not my exception.", category: "success" },
  { text: "I focus on progress, not perfection.", category: "success" },
  { text: "I am worthy of massive success.", category: "success" },
  { text: "I attract lucrative opportunities daily.", category: "success" },
  { text: "I am constantly leveling up in every area.", category: "success" },
  { text: "My dreams are valid and achievable.", category: "success" },
  { text: "I take risks that lead to rewards.", category: "success" },
  { text: "I am a problem solver, not a problem dweller.", category: "success" },
  { text: "I finish what I start.", category: "success" },
  { text: "I am richer than I was yesterday in every way.", category: "success" },
  { text: "I am deserving of all the good things coming to me.", category: "success" },
  { text: "My bank account grows every single day.", category: "success" },
  { text: "I am a natural leader and others follow my vision.", category: "success" },
  { text: "I create opportunities where none exist.", category: "success" },
  { text: "I am calm, confident, and unstoppable in business.", category: "success" },
  { text: "Success is attracted to my energy.", category: "success" },
  { text: "I am on the fast track to my dreams.", category: "success" },
  { text: "I handle pressure with grace and precision.", category: "success" },
  { text: "I am grateful for the wealth already in my life.", category: "success" },
  { text: "I am becoming financially free every day.", category: "success" },
  { text: "I win because I refuse to quit.", category: "success" },
  { text: "I am a high performer in everything I do.", category: "success" },
  { text: "My goals are clear and my path is certain.", category: "success" },
  { text: "I attract mentors and allies who accelerate my growth.", category: "success" },
  { text: "I am worthy of abundance in every form.", category: "success" },
  { text: "I monetize my skills and talents with ease.", category: "success" },
  { text: "I am a money magnet.", category: "success" },
  { text: "Every day I execute with excellence.", category: "success" },
  { text: "I am the hardest worker in the room.", category: "success" },
  { text: "My vision is big, and my execution is bigger.", category: "success" },
  { text: "I am successful because I am relentless.", category: "success" },
  { text: "I attract high-paying clients and customers.", category: "success" },
  { text: "I am building wealth that lasts generations.", category: "success" },
  { text: "I am a creator of abundance, not a victim of scarcity.", category: "success" },
  { text: "I am confident in my ability to succeed.", category: "success" },
  { text: "I turn my skills into income every day.", category: "success" },
  { text: "I am on top of my finances.", category: "success" },
  { text: "I make smart decisions with money.", category: "success" },
  { text: "I am worthy of a seven-figure life.", category: "success" },
  { text: "My success inspires others to succeed.", category: "success" },
  { text: "I am ahead of schedule on my goals.", category: "success" },
  { text: "I achieve more in a day than most do in a week.", category: "success" },
  { text: "I am a champion in my field.", category: "success" },
  { text: "I am compensated generously for my value.", category: "success" },
  { text: "I am the architect of my own fortune.", category: "success" },
  { text: "I am resilient, resourceful, and rich.", category: "success" },
  { text: "Success is my default state.", category: "success" },
  { text: "I am obsessed with winning, not with the win itself.", category: "success" },
  { text: "I am building an empire of value and impact.", category: "success" },
  { text: "I am fearless in business and in life.", category: "success" },
  { text: "I attract investors, partners, and opportunities.", category: "success" },
  { text: "I am disciplined with my time and money.", category: "success" },
  { text: "I am the first one to arrive and the last to leave.", category: "success" },
  { text: "I am destined for greatness and I know it.", category: "success" },
  { text: "I am worthy of every ounce of my success.", category: "success" },
  { text: "I am closing bigger deals every single week.", category: "success" },
  { text: "I am a master of my craft.", category: "success" },
  { text: "I am turning my passion into profit.", category: "success" },
  { text: "I am constantly improving my skills and income.", category: "success" },
  { text: "I am a finisher — I complete what I begin.", category: "success" },
  { text: "I am surrounded by abundance everywhere I look.", category: "success" },
  { text: "I am grateful for my growing success.", category: "success" },
  { text: "I am moving from success to significance.", category: "success" },
  { text: "I am a beacon of success and positivity.", category: "success" },
  { text: "I am making my mark on the world.", category: "success" },
  { text: "I am leveling up my income, impact, and influence.", category: "success" },
  { text: "I am the kind of person success follows.", category: "success" },
  { text: "I am worthy of luxury and freedom.", category: "success" },
  { text: "I am building a life most people only dream of.", category: "success" },
  { text: "I am unstoppable in the face of doubt.", category: "success" },
  { text: "I am proof that hard work pays off.", category: "success" },
  { text: "I am attracting success with every thought and action.", category: "success" },
  { text: "I am worthy of being paid well.", category: "success" },
  { text: "I am the master of my own economy.", category: "success" },
  { text: "I am reaching my full earning potential.", category: "success" },
  { text: "I am a success story in the making.", category: "success" },
  { text: "I am winning at the game of life.", category: "success" },
  { text: "I am abundant, prosperous, and thriving.", category: "success" },
  { text: "I am creating wealth with integrity and ease.", category: "success" },
  { text: "I am a natural closer.", category: "success" },
  { text: "I am worthy of the life I am building.", category: "success" },
  { text: "I am one decision away from a completely different life.", category: "success" },
  { text: "I am attracting everything I need to succeed.", category: "success" },
  { text: "I am bold, ambitious, and unstoppable.", category: "success" },
  { text: "I am the storm of success gathering on the horizon.", category: "success" },
  { text: "I am achieving my goals faster than I imagined.", category: "success" },
  { text: "I am wealthy, wise, and worthy.", category: "success" },
  { text: "I am committed to my own excellence.", category: "success" },
  { text: "I am a leader others are proud to follow.", category: "success" },
  { text: "I am turning my vision into reality daily.", category: "success" },
  { text: "I am successful, and it feels natural.", category: "success" },
  { text: "I am raising my standards every single day.", category: "success" },
  { text: "I am the go-to person in my industry.", category: "success" },
  { text: "I am always prepared for opportunity.", category: "success" },
  { text: "I am a magnet for the life I deserve.", category: "success" },

  // ===== MOTIVATION (130) =====
  { text: "Discipline is choosing what you want most over what you want now.", category: "motivation" },
  { text: "The pain of discipline is far less than the pain of regret.", category: "motivation" },
  { text: "Don't stop when you're tired. Stop when you're done.", category: "motivation" },
  { text: "Your future self is watching you right now through memories.", category: "motivation" },
  { text: "You don't need more time. You need more focus.", category: "motivation" },
  { text: "Small daily wins compound into massive results.", category: "motivation" },
  { text: "The comeback is always stronger than the setback.", category: "motivation" },
  { text: "Be stronger than your excuses.", category: "motivation" },
  { text: "You are one workout away from a better mood.", category: "motivation" },
  { text: "The best project you'll ever work on is yourself.", category: "motivation" },
  { text: "Do it tired. Do it scared. Do it anyway.", category: "motivation" },
  { text: "You have survived 100% of your worst days.", category: "motivation" },
  { text: "Hard choices, easy life. Easy choices, hard life.", category: "motivation" },
  { text: "Your only limit is the one you set for yourself.", category: "motivation" },
  { text: "Greatness is earned, never given.", category: "motivation" },
  { text: "Motivation gets you started. Habit keeps you going.", category: "motivation" },
  { text: "The best revenge is massive success.", category: "motivation" },
  { text: "Prove them wrong by proving yourself right.", category: "motivation" },
  { text: "You didn't come this far to only come this far.", category: "motivation" },
  { text: "The only easy day was yesterday.", category: "motivation" },
  { text: "Stay humble. Stay hungry. Stay focused.", category: "motivation" },
  { text: "Dream big. Start small. Act now.", category: "motivation" },
  { text: "You are stronger than you think, and braver than you feel.", category: "motivation" },
  { text: "Success is the sum of small efforts repeated daily.", category: "motivation" },
  { text: "The harder the battle, the sweeter the victory.", category: "motivation" },
  { text: "Don't wish for it. Work for it.", category: "motivation" },
  { text: "Discipline over motivation, every single day.", category: "motivation" },
  { text: "You become what you repeatedly do.", category: "motivation" },
  { text: "The grind is the glory.", category: "motivation" },
  { text: "One more rep. One more page. One more day.", category: "motivation" },
  { text: "Winners focus on winning. Losers focus on winners.", category: "motivation" },
  { text: "Do something today your future self will thank you for.", category: "motivation" },
  { text: "Your life is a reflection of your daily habits.", category: "motivation" },
  { text: "It's not about being the best. It's about being better than yesterday.", category: "motivation" },
  { text: "The distance between dreams and reality is called action.", category: "motivation" },
  { text: "Rise and grind — your dreams don't sleep.", category: "motivation" },
  { text: "If it doesn't challenge you, it won't change you.", category: "motivation" },
  { text: "You are exactly where you chose to be. Choose better.", category: "motivation" },
  { text: "Success is rented, and the rent is due every day.", category: "motivation" },
  { text: "Quiet the noise. Do the work.", category: "motivation" },
  { text: "Every master was once a beginner who refused to quit.", category: "motivation" },
  { text: "Your ceiling is someone else's floor. Keep climbing.", category: "motivation" },
  { text: "Don't count the days. Make the days count.", category: "motivation" },
  { text: "The fire you feed is the fire that grows.", category: "motivation" },
  { text: "You can't spell 'legendary' without 'leg day'.", category: "motivation" },
  { text: "Chase excellence, and success will chase you.", category: "motivation" },
  { text: "Comfort is the enemy of progress.", category: "motivation" },
  { text: "Pain is temporary. Pride is forever.", category: "motivation" },
  { text: "You miss 100% of the reps you don't do.", category: "motivation" },
  { text: "Nothing worth having comes easy.", category: "motivation" },
  { text: "The only bad workout is the one that didn't happen.", category: "motivation" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", category: "motivation" },
  { text: "Sweat is just fat crying.", category: "motivation" },
  { text: "A year from now you'll wish you had started today.", category: "motivation" },
  { text: "Start where you are. Use what you have. Do what you can.", category: "motivation" },
  { text: "The secret of getting ahead is getting started.", category: "motivation" },
  { text: "Focus on your goals, not your obstacles.", category: "motivation" },
  { text: "You are your only competition.", category: "motivation" },
  { text: "Make it happen. Shock everyone.", category: "motivation" },
  { text: "The pain you feel today is the strength you feel tomorrow.", category: "motivation" },
  { text: "Consistency beats intensity in the long run.", category: "motivation" },
  { text: "Show up when it's hard. That's what separates you.", category: "motivation" },
  { text: "You can have results or excuses. Not both.", category: "motivation" },
  { text: "Act like the person you want to become.", category: "motivation" },
  { text: "What you do today can improve all your tomorrows.", category: "motivation" },
  { text: "The wolf on the hill is never as hungry as the wolf climbing it.", category: "motivation" },
  { text: "Be the hardest worker you know.", category: "motivation" },
  { text: "No pressure, no diamonds.", category: "motivation" },
  { text: "Effort is the currency of dreams.", category: "motivation" },
  { text: "You owe it to yourself to become everything you're capable of.", category: "motivation" },
  { text: "Discipline is the bridge between goals and accomplishment.", category: "motivation" },
  { text: "Stay ready so you don't have to get ready.", category: "motivation" },
  { text: "The grind doesn't stop when the motivation fades.", category: "motivation" },
  { text: "Run your own race at your own pace.", category: "motivation" },
  { text: "Your habits decide your future.", category: "motivation" },
  { text: "Wake up with determination. Sleep with satisfaction.", category: "motivation" },
  { text: "You're stronger than every excuse you've ever made.", category: "motivation" },
  { text: "Fear kills more dreams than failure ever will.", category: "motivation" },
  { text: "Be the person who shows up when no one is watching.", category: "motivation" },
  { text: "Little by little, a little becomes a lot.", category: "motivation" },
  { text: "The only way out is through.", category: "motivation" },
  { text: "Relentless forward progress.", category: "motivation" },
  { text: "Win the morning, win the day.", category: "motivation" },
  { text: "Don't wait for opportunity. Create it.", category: "motivation" },
  { text: "The harder you work, the luckier you get.", category: "motivation" },
  { text: "You are one decision away from changing everything.", category: "motivation" },
  { text: "Excuses are the nails that build the house of failure.", category: "motivation" },
  { text: "Be obsessed with getting better, not being better.", category: "motivation" },
  { text: "The mountain is climbed one step at a time.", category: "motivation" },
  { text: "Success loves speed. Move now.", category: "motivation" },
  { text: "Doubt kills more dreams than failure ever will.", category: "motivation" },
  { text: "You either suffer the pain of discipline or the pain of regret.", category: "motivation" },
  { text: "Outwork your yesterday.", category: "motivation" },
  { text: "Your effort is the only thing you can control. Control it fiercely.", category: "motivation" },
  { text: "Stop waiting for the right time. The time is now.", category: "motivation" },
  { text: "Champions are made when no one is watching.", category: "motivation" },
  { text: "The struggle you're in today is developing the strength you need tomorrow.", category: "motivation" },
  { text: "Just start. The rest will follow.", category: "motivation" },
  { text: "You don't find time. You make time.", category: "motivation" },
  { text: "Average is the enemy of great.", category: "motivation" },
  { text: "Be so good they can't ignore you.", category: "motivation" },
  { text: "The price of greatness is responsibility.", category: "motivation" },
  { text: "Your mindset is your greatest weapon.", category: "motivation" },
  { text: "Fall in love with the process, and the results will come.", category: "motivation" },
  { text: "Nothing changes if nothing changes.", category: "motivation" },
  { text: "You are the only person who can hold yourself back.", category: "motivation" },
  { text: "Let your work ethic do the talking.", category: "motivation" },
  { text: "The best time to start was yesterday. The next best is now.", category: "motivation" },
  { text: "Obstacles are what you see when you take your eyes off the goal.", category: "motivation" },
  { text: "Attack the day before it attacks you.", category: "motivation" },
  { text: "You were born to stand out, not to fit in.", category: "motivation" },
  { text: "Stay consistent. Results will follow.", category: "motivation" },
  { text: "The only limits that exist are the ones you accept.", category: "motivation" },
  { text: "Every expert was once a beginner who didn't quit.", category: "motivation" },
  { text: "Do the work others won't, to live the life others can't.", category: "motivation" },
  { text: "Your only bad day is the day you give up.", category: "motivation" },
  { text: "Momentum is everything. Start now and keep going.", category: "motivation" },
  { text: "A river cuts through rock not by power, but by persistence.", category: "motivation" },
  { text: "You can't climb the ladder of success with your hands in your pockets.", category: "motivation" },
  { text: "The universe rewards the bold.", category: "motivation" },
  { text: "Earn your morning. Earn your day. Earn your life.", category: "motivation" },
  { text: "Be the energy you want to attract.", category: "motivation" },
  { text: "Your dreams are not too big. Your doubts are too loud.", category: "motivation" },
  { text: "Never give up on a dream just because of the time it will take.", category: "motivation" },
  { text: "Success is not final, failure is not fatal.", author: "Winston Churchill", category: "motivation" },
  { text: "Whether you think you can or you can't, you're right.", author: "Henry Ford", category: "motivation" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker", category: "motivation" },
  { text: "If you're going through hell, keep going.", author: "Winston Churchill", category: "motivation" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", category: "motivation" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin", category: "motivation" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "motivation" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar", category: "motivation" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "motivation" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", category: "motivation" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin", category: "motivation" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", category: "motivation" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle", category: "motivation" },

  // ===== PHILOSOPHY (150) =====
  { text: "The unexamined life is not worth living.", author: "Socrates", category: "philosophy" },
  { text: "I know that I know nothing.", author: "Socrates", category: "philosophy" },
  { text: "To find yourself, think for yourself.", author: "Socrates", category: "philosophy" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", category: "philosophy" },
  { text: "Beware the barrenness of a busy life.", author: "Socrates", category: "philosophy" },
  { text: "He who is not contented with what he has, would not be contented with what he would like to have.", author: "Socrates", category: "philosophy" },
  { text: "The greatest wealth is to live content with little.", author: "Plato", category: "philosophy" },
  { text: "Courage is knowing what not to fear.", author: "Plato", category: "philosophy" },
  { text: "The first and greatest victory is to conquer yourself.", author: "Plato", category: "philosophy" },
  { text: "Reality is created by the mind. We can change our reality by changing our mind.", author: "Plato", category: "philosophy" },
  { text: "We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.", author: "Plato", category: "philosophy" },
  { text: "The measure of a man is what he does with power.", author: "Plato", category: "philosophy" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "philosophy" },
  { text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", author: "Aristotle", category: "philosophy" },
  { text: "Happiness depends upon ourselves.", author: "Aristotle", category: "philosophy" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle", category: "philosophy" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", category: "philosophy" },
  { text: "The more you know, the more you know you don't know.", author: "Aristotle", category: "philosophy" },
  { text: "Patience is bitter, but its fruit is sweet.", author: "Aristotle", category: "philosophy" },
  { text: "Excellence is never an accident.", author: "Aristotle", category: "philosophy" },
  { text: "The whole is greater than the sum of its parts.", author: "Aristotle", category: "philosophy" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: "philosophy" },
  { text: "The energy of the mind is the essence of life.", author: "Aristotle", category: "philosophy" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", category: "philosophy" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", category: "philosophy" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", category: "philosophy" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", category: "philosophy" },
  { text: "Very little is needed to make a happy life; it is all within yourself.", author: "Marcus Aurelius", category: "philosophy" },
  { text: "When you arise in the morning, think of what a precious privilege it is to be alive.", author: "Marcus Aurelius", category: "philosophy" },
  { text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius", category: "philosophy" },
  { text: "Confine yourself to the present.", author: "Marcus Aurelius", category: "philosophy" },
  { text: "The universe is change; our life is what our thoughts make it.", author: "Marcus Aurelius", category: "philosophy" },
  { text: "Accept the things to which fate binds you.", author: "Marcus Aurelius", category: "philosophy" },
  { text: "He who fears death will never do anything worth of a man who is alive.", author: "Seneca", category: "philosophy" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca", category: "philosophy" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca", category: "philosophy" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca", category: "philosophy" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "philosophy" },
  { text: "The whole future lies in uncertainty: live immediately.", author: "Seneca", category: "philosophy" },
  { text: "Associate with people who are likely to improve you.", author: "Seneca", category: "philosophy" },
  { text: "Every new beginning comes from some other beginning's end.", author: "Seneca", category: "philosophy" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca", category: "philosophy" },
  { text: "No man is free who is not master of himself.", author: "Epictetus", category: "philosophy" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus", category: "philosophy" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus", category: "philosophy" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus", category: "philosophy" },
  { text: "He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.", author: "Epictetus", category: "philosophy" },
  { text: "The key is to keep company only with people who uplift you.", author: "Epictetus", category: "philosophy" },
  { text: "Don't explain your philosophy. Embody it.", author: "Epictetus", category: "philosophy" },
  { text: "Any person capable of angering you becomes your master.", author: "Epictetus", category: "philosophy" },
  { text: "Circumstances don't make the man, they only reveal him to himself.", author: "Epictetus", category: "philosophy" },
  { text: "How long are you going to wait before you demand the best for yourself?", author: "Epictetus", category: "philosophy" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", category: "philosophy" },
  { text: "What does not kill me makes me stronger.", author: "Friedrich Nietzsche", category: "philosophy" },
  { text: "Become who you are.", author: "Friedrich Nietzsche", category: "philosophy" },
  { text: "The individual has always had to struggle to keep from being overwhelmed by the tribe.", author: "Friedrich Nietzsche", category: "philosophy" },
  { text: "You must have chaos within you to give birth to a dancing star.", author: "Friedrich Nietzsche", category: "philosophy" },
  { text: "The true man wants two things: danger and play.", author: "Friedrich Nietzsche", category: "philosophy" },
  { text: "There are no beautiful surfaces without a terrible depth.", author: "Friedrich Nietzsche", category: "philosophy" },
  { text: "In the mountains of truth, you never climb in vain.", author: "Friedrich Nietzsche", category: "philosophy" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu", category: "philosophy" },
  { text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu", category: "philosophy" },
  { text: "When I let go of what I am, I become what I might be.", author: "Lao Tzu", category: "philosophy" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu", category: "philosophy" },
  { text: "The best fighter is never angry.", author: "Lao Tzu", category: "philosophy" },
  { text: "He who conquers others is strong; he who conquers himself is mighty.", author: "Lao Tzu", category: "philosophy" },
  { text: "New beginnings are often disguised as painful endings.", author: "Lao Tzu", category: "philosophy" },
  { text: "A man with outward courage dares to die; a man with inner courage dares to live.", author: "Lao Tzu", category: "philosophy" },
  { text: "Silence is a source of great strength.", author: "Lao Tzu", category: "philosophy" },
  { text: "Care about what other people think and you will always be their prisoner.", author: "Lao Tzu", category: "philosophy" },
  { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius", category: "philosophy" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "philosophy" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius", category: "philosophy" },
  { text: "Wherever you go, go with all your heart.", author: "Confucius", category: "philosophy" },
  { text: "The will to win, the desire to succeed, the urge to reach your full potential — these are the keys that will unlock the door to personal excellence.", author: "Confucius", category: "philosophy" },
  { text: "Real knowledge is to know the extent of one's ignorance.", author: "Confucius", category: "philosophy" },
  { text: "He who conquers himself is the mightiest warrior.", author: "Confucius", category: "philosophy" },
  { text: "The superior man is modest in his speech, but exceeds in his actions.", author: "Confucius", category: "philosophy" },
  { text: "Everything has beauty, but not everyone sees it.", author: "Confucius", category: "philosophy" },
  { text: "Choose a job you love, and you will never have to work a day in your life.", author: "Confucius", category: "philosophy" },
  { text: "Victorious warriors win first and then go to war.", author: "Sun Tzu", category: "philosophy" },
  { text: "Know thy self, know thy enemy. A thousand battles, a thousand victories.", author: "Sun Tzu", category: "philosophy" },
  { text: "Opportunities multiply as they are seized.", author: "Sun Tzu", category: "philosophy" },
  { text: "In the midst of chaos, there is also opportunity.", author: "Sun Tzu", category: "philosophy" },
  { text: "The supreme art of war is to subdue the enemy without fighting.", author: "Sun Tzu", category: "philosophy" },
  { text: "Great results can be achieved with small forces.", author: "Sun Tzu", category: "philosophy" },
  { text: "If you know the enemy and know yourself, you need not fear the result of a hundred battles.", author: "Sun Tzu", category: "philosophy" },
  { text: "What you seek is seeking you.", author: "Rumi", category: "philosophy" },
  { text: "The wound is the place where the light enters you.", author: "Rumi", category: "philosophy" },
  { text: "You were born with wings. Why prefer to crawl through life?", author: "Rumi", category: "philosophy" },
  { text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi", category: "philosophy" },
  { text: "Raise your words, not your voice. It is rain that grows flowers, not thunder.", author: "Rumi", category: "philosophy" },
  { text: "Wherever you are, and whatever you do, be in love.", author: "Rumi", category: "philosophy" },
  { text: "The quieter you become, the more you are able to hear.", author: "Rumi", category: "philosophy" },
  { text: "Why do you stay in prison when the door is so wide open?", author: "Rumi", category: "philosophy" },
  { text: "Do not be satisfied with the stories that come before you. Unfold your own myth.", author: "Rumi", category: "philosophy" },
  { text: "Let yourself be silently drawn by the stronger pull of what you truly love.", author: "Rumi", category: "philosophy" },
  { text: "You are the universe in ecstatic motion.", author: "Rumi", category: "philosophy" },
  { text: "It is better to conquer yourself than to win a thousand battles.", author: "Buddha", category: "philosophy" },
  { text: "What you think, you become.", author: "Buddha", category: "philosophy" },
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: "philosophy" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "philosophy" },
  { text: "Thousands of candles can be lighted from a single candle, and the life of the candle will not be shortened.", author: "Buddha", category: "philosophy" },
  { text: "The only real failure in life is not to be true to the best one knows.", author: "Buddha", category: "philosophy" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", category: "philosophy" },
  { text: "Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else.", author: "Buddha", category: "philosophy" },
  { text: "The secret of health for both mind and body is not to mourn for the past, not to worry about the future, but to live the present moment wisely.", author: "Buddha", category: "philosophy" },
  { text: "There is no path to happiness; happiness is the path.", author: "Buddha", category: "philosophy" },
  { text: "I think, therefore I am.", author: "René Descartes", category: "philosophy" },
  { text: "The reading of all good books is like a conversation with the finest minds of past centuries.", author: "René Descartes", category: "philosophy" },
  { text: "Happiness is not an ideal of reason but of imagination.", author: "Immanuel Kant", category: "philosophy" },
  { text: "Dare to know. Have the courage to use your own understanding.", author: "Immanuel Kant", category: "philosophy" },
  { text: "Man is born free, and everywhere he is in chains.", author: "Jean-Jacques Rousseau", category: "philosophy" },
  { text: "Patience is bitter, but its fruit is sweet.", author: "Jean-Jacques Rousseau", category: "philosophy" },
  { text: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein", category: "philosophy" },
  { text: "Life can only be understood backwards; but it must be lived forwards.", author: "Søren Kierkegaard", category: "philosophy" },
  { text: "Anxiety is the dizziness of freedom.", author: "Søren Kierkegaard", category: "philosophy" },
  { text: "To dare is to lose one's footing momentarily. Not to dare is to lose oneself.", author: "Søren Kierkegaard", category: "philosophy" },
  { text: "Existence precedes essence.", author: "Jean-Paul Sartre", category: "philosophy" },
  { text: "Man is condemned to be free.", author: "Jean-Paul Sartre", category: "philosophy" },
  { text: "The struggle itself toward the heights is enough to fill a man's heart.", author: "Albert Camus", category: "philosophy" },
  { text: "In the depth of winter, I finally learned that within me there lay an invincible summer.", author: "Albert Camus", category: "philosophy" },
  { text: "You will never be happy if you continue to search for what happiness consists of.", author: "Albert Camus", category: "philosophy" },
  { text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", author: "Albert Camus", category: "philosophy" },
  { text: "The unexamined life is not worth living — so examine it daily.", author: "Socrates", category: "philosophy" },
  { text: "Give me a lever long enough and a fulcrum on which to place it, and I shall move the world.", author: "Archimedes", category: "philosophy" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", category: "philosophy" },
  { text: "The noblest pleasure is the joy of understanding.", author: "Leonardo da Vinci", category: "philosophy" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci", category: "philosophy" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe", category: "philosophy" },
  { text: "Whatever you can do, or dream you can, begin it. Boldness has genius, power, and magic in it.", author: "Johann Wolfgang von Goethe", category: "philosophy" },
  { text: "As soon as you trust yourself, you will know how to live.", author: "Johann Wolfgang von Goethe", category: "philosophy" },
  { text: "Character develops itself in the stream of life.", author: "Johann Wolfgang von Goethe", category: "philosophy" },
  { text: "I am not what happened to me, I am what I choose to become.", author: "Carl Jung", category: "philosophy" },
  { text: "Who looks outside, dreams; who looks inside, awakes.", author: "Carl Jung", category: "philosophy" },
  { text: "Your vision will become clear only when you can look into your own heart.", author: "Carl Jung", category: "philosophy" },
  { text: "I am the master of my fate: I am the captain of my soul.", author: "William Ernest Henley", category: "philosophy" },
  { text: "The unexamined life is not worth living.", author: "Socrates", category: "philosophy" },
  { text: "An unexamined goal is just a wish.", category: "philosophy" },
];



// Anime card background images — user's 12 new + existing
const CARD_IMAGES = [
  "/images/anime_dragon_facing.jpg",
  "/images/anime_ice_lion.jpg",
  "/images/anime_purple_hero.jpg",
  "/images/anime_shadow_army_rubble.jpg",
  "/images/anime_red_tree_wolf.jpg",
  "/images/anime_dark_hero_purple.jpg",
  "/images/anime_dark_monarch_throne.jpg",
  "/images/anime_eminence_shadow.jpg",
  "/images/anime_neutrality.jpg",
  "/images/anime_shadow_monarch_dark.jpg",
  "/images/anime_solo_standing.jpg",
  "/images/anime_igris_armor.jpg",
];

interface AffirmationHubProps {
  profile?: any;
  [k: string]: any;
}

export const AffirmationHub: React.FC<AffirmationHubProps> = (props) => {
  const { profile } = props;
  const userName = profile?.name || "Hunter";

  // ----- STATE -----
  const [currentIdx, setCurrentIdx] = useState(() => Math.floor(Math.random() * AFFIRMATIONS.length));
  const [cardImageIdx, setCardImageIdx] = useState(() => Math.floor(Math.random() * CARD_IMAGES.length));
  const [likedSet, setLikedSet] = useState<Set<number>>(() => {
    try {
      const raw = typeof window !== "undefined"
        ? window.localStorage.getItem("manifest_affirmation_likes_v1")
        : null;
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [seenCount, setSeenCount] = useState<number>(() => {
    try {
      const raw = typeof window !== "undefined"
        ? window.localStorage.getItem("manifest_affirmation_seen_v1")
        : null;
      return raw ? Number(raw) : 0;
    } catch { return 0; }
  });
  // Today's flips (for Solo Dominion task progress — refresh on mount + when date changes)
  const todayStr = new Date().toLocaleDateString("en-CA");
  const FLIP_KEY = `manifest_affirmation_flips_${todayStr}`;
  const [todayFlips, setTodayFlips] = useState<number>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(FLIP_KEY) : null;
      return raw ? Number(raw) : 0;
    } catch { return 0; }
  });
  const [showInfo, setShowInfo] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // ----- PERSIST -----
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "manifest_affirmation_likes_v1",
        JSON.stringify(Array.from(likedSet))
      );
    } catch {}
  }, [likedSet]);

  useEffect(() => {
    try {
      window.localStorage.setItem("manifest_affirmation_seen_v1", String(seenCount));
    } catch {}
  }, [seenCount]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FLIP_KEY, String(todayFlips));
      // Persist task progress to manifest_task_progress_v1 (so Solo Dominion sees it)
      const raw = window.localStorage.getItem("manifest_task_progress_v1");
      const progress = raw ? JSON.parse(raw) : {};
      const prev = Number(progress.affirmation) || 0;
      // Use the larger of the two values to handle parallel updates
      progress.affirmation = Math.max(prev, todayFlips);
      window.localStorage.setItem("manifest_task_progress_v1", JSON.stringify(progress));
    } catch {}
  }, [todayFlips, FLIP_KEY]);

  // Listen for midnight reset
  useEffect(() => {
    const onReset = () => {
      setTodayFlips(0);
      setSeenCount(0);
    };
    window.addEventListener("manifest_tasks_reset", onReset as EventListener);
    return () => window.removeEventListener("manifest_tasks_reset", onReset as EventListener);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Listen for XP-awarded toast from App.tsx
  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setToast({ msg: detail.msg, type: detail.type || "ok" });
      }
    };
    window.addEventListener("manifest_toast", onToast as EventListener);
    return () => window.removeEventListener("manifest_toast", onToast as EventListener);
  }, []);

  const showToast = (msg: string, type: "ok" | "err" = "ok") =>
    setToast({ msg, type });

  // ----- TAP → NEXT RANDOM -----
  const showRandomCard = useCallback(() => {
    let nextAff = Math.floor(Math.random() * AFFIRMATIONS.length);
    if (AFFIRMATIONS.length > 1) {
      let safety = 0;
      while (nextAff === currentIdx && safety < 10) {
        nextAff = Math.floor(Math.random() * AFFIRMATIONS.length);
        safety++;
      }
    }
    let nextImg = Math.floor(Math.random() * CARD_IMAGES.length);
    let safety2 = 0;
    while (nextImg === cardImageIdx && safety2 < 10) {
      nextImg = Math.floor(Math.random() * CARD_IMAGES.length);
      safety2++;
    }
    setCurrentIdx(nextAff);
    setCardImageIdx(nextImg);
    setSeenCount((c) => c + 1);
    // Synchronously increment today flips + persist (so bridge listener reads correct value)
    setTodayFlips((c) => {
      const next = c + 1;
      try {
        const todayStr = new Date().toLocaleDateString("en-CA");
        window.localStorage.setItem(`manifest_affirmation_flips_${todayStr}`, String(next));
        // Also persist to Solo Dominion task progress
        const raw = window.localStorage.getItem("manifest_task_progress_v1");
        const progress = raw ? JSON.parse(raw) : {};
        const prev = Number(progress.affirmation) || 0;
        progress.affirmation = Math.max(prev, next);
        window.localStorage.setItem("manifest_task_progress_v1", JSON.stringify(progress));
      } catch {}
      return next;
    });
    // Dispatch global event so App.tsx can award 50 XP on every 10th flip
    window.dispatchEvent(new CustomEvent("manifest_affirmation_flip"));
    window.dispatchEvent(new CustomEvent("manifest_sfx_whoosh"));
  }, [currentIdx, cardImageIdx]);

  // ----- LIKE -----
  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentIdx)) {
        newSet.delete(currentIdx);
        showToast("Removed", "ok");
      } else {
        newSet.add(currentIdx);
        showToast("Saved", "ok");
        window.dispatchEvent(new CustomEvent("manifest_sfx_notify"));
      }
      return newSet;
    });
  };

  const current = AFFIRMATIONS[currentIdx];
  const cardImage = CARD_IMAGES[cardImageIdx];
  const isLiked = likedSet.has(currentIdx);

  return (
    <div
      className="min-h-dvh relative font-sans flex flex-col"
      style={{ backgroundColor: "#000", color: TEXT_PRIMARY }}
    >
      {/* =================== FULL OPACITY BG IMAGE (JINWOO warrior sunset) =================== */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url(/images/affirmation_jinwoo_bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          opacity: 1,
        }}
      />

      {/* =================== DARK GRADIENT OVER BG (so card + text pop) =================== */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.70) 100%)",
        }}
      />

      {/* =================== MINIMAL TOP STRIP =================== */}
      <div
        className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2"
        style={{ minHeight: 56 }}
      >
        <div
          className="px-3 py-1.5 rounded-full text-[10.5px] font-extrabold tracking-[0.2em] uppercase tabular-nums"
          style={{
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.78)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {seenCount} witnessed
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
          style={{
            backgroundColor: "rgba(0,0,0,0.78)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(14px)",
            color: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <BookOpen size={14} />
        </button>
      </div>

      {/* =================== MAIN: TAP-TO-CHANGE CARD =================== */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center px-4 py-2"
      >
        <div
          className="w-full max-w-[420px] cursor-pointer"
          onClick={showRandomCard}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIdx}-${cardImageIdx}`}
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -6 }}
              transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "9 / 14",
                maxHeight: "min(58dvh, 540px)",
                width: "100%",
                backgroundColor: "#0a0a0a",
                borderRadius: 24,
                border: `1px solid ${HAIRLINE_STRONG}`,
              }}
            >
              {/* ============== ANIME BG (FULL OPACITY) ============== */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${cardImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              {/* ============== TEXT-AREA GRADIENT ONLY (top + bottom for legibility) ============== */}
              <div
                className="absolute inset-x-0 top-0 h-24 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.0) 100%)",
                }}
              />

              {/* ============== TOP HEART BUTTON ============== */}
              <button
                onClick={toggleLike}
                className="absolute top-4 right-4 z-20 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition"
                style={{
                  backgroundColor: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(14px)",
                  border: `1px solid ${isLiked ? IOS_RED : "rgba(255,255,255,0.22)"}`,
                }}
              >
                <Heart
                  size={20}
                  fill={isLiked ? IOS_RED : "transparent"}
                  color={isLiked ? IOS_RED : "#fff"}
                  strokeWidth={2.2}
                />
              </button>

              {/* ============== BOTTOM TEXT BLOCK ============== */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7">
                <div
                  className="text-[10px] font-extrabold tracking-[0.3em] uppercase mb-3"
                  style={{ color: ORANGE }}
                >
                  Tap to reveal
                </div>
                <h2
                  className="font-extrabold tracking-tight leading-[1.05]"
                  style={{
                    color: "#fff",
                    fontSize: "clamp(22px, 5.8vw, 30px)",
                    letterSpacing: "-0.03em",
                    textShadow: "0 2px 18px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  {current.text}
                </h2>
                {current.author && (
                  <div
                    className="mt-3 text-[12px] font-semibold italic"
                    style={{
                      color: "rgba(255,255,255,0.75)",
                      textShadow: "0 1px 8px rgba(0,0,0,0.8)",
                    }}
                  >
                    — {current.author}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* =================== BOTTOM TASK PROGRESS (Solo Dominion link) =================== */}
      <div className="relative z-10 px-5 pb-8 pt-3 space-y-2.5">
        {/* Progress bar */}
        <div
          className="mx-auto max-w-[420px] px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: "rgba(0,0,0,0.78)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div
              className="text-[10px] font-extrabold tracking-[0.2em] uppercase"
              style={{ color: "#ffffff" }}
            >
              📖 Affirmation Reading
            </div>
            <div
              className="text-[10px] font-extrabold tabular-nums"
              style={{ color: todayFlips >= 10 ? "#34c759" : ORANGE }}
            >
              {Math.min(todayFlips, 10)} / 10
            </div>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (todayFlips / 10) * 100)}%`,
                background:
                  todayFlips >= 10
                    ? "linear-gradient(90deg, #34c759, #2da44e)"
                    : `linear-gradient(90deg, ${ORANGE_DARK || "#ff7a00"}, ${ORANGE})`,
              }}
            />
          </div>
          <div
            className="text-[10px] mt-1.5 font-medium"
            style={{ color: todayFlips >= 10 ? "#34c759" : "rgba(235,235,245,0.6)" }}
          >
            {todayFlips >= 10
              ? "✓ Task complete — 50 XP awarded. Keep flipping for more truth."
              : `Flip ${10 - todayFlips} more card${10 - todayFlips === 1 ? "" : "s"} to complete the task + 50 XP`}
          </div>
        </div>
        <div
          className="text-center text-[10px] font-extrabold tracking-[0.3em] uppercase"
          style={{ color: TEXT_TERTIARY }}
        >
          Tap card · next truth
        </div>
      </div>

      {/* =================== INFO MODAL =================== */}
      {showInfo && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowInfo(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] font-extrabold tracking-widest uppercase"
                style={{ color: ORANGE }}
              >
                About
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 rounded-lg"
                style={{ color: TEXT_TERTIARY }}
              >
                <X size={16} />
              </button>
            </div>
            <h2
              className="font-extrabold text-2xl mb-2 tracking-tight"
              style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}
            >
              The Power of Affirmation
            </h2>
            <p
              className="text-[12.5px] mb-4 leading-relaxed"
              style={{ color: TEXT_SECONDARY }}
            >
              {AFFIRMATIONS.length} declarations from world-class philosophers,
              warriors, and awakened masters. Tap the card to receive the next
              truth the universe has for you.
            </p>
            <div className="space-y-2 mb-4">
              <h3
                className="text-[10px] font-extrabold tracking-widest uppercase"
                style={{ color: TEXT_TERTIARY }}
              >
                How to use
              </h3>
              {[
                "Tap the card to reveal a new affirmation",
                "Heart the ones that resonate with your soul",
                "Read them aloud, three times, with conviction",
                "Flip 10 cards → Affirmation Reading task complete (+50 XP)",
                `${seenCount} truths witnessed · ${likedSet.size} saved · ${todayFlips} today`,
              ].map((tip) => (
                <div
                  key={tip}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ORANGE }}
                  />
                  <span className="text-[12px] font-medium" style={{ color: TEXT_PRIMARY }}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="text-center text-[10px] font-bold tracking-widest uppercase py-2"
              style={{ color: TEXT_TERTIARY }}
            >
              Arise.
            </div>
          </div>
        </div>
      )}

      {/* =================== TOAST =================== */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-2xl text-[12px] font-bold flex items-center gap-2"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)",
            backgroundColor:
              toast.type === "ok" ? "rgba(52,199,89,0.95)" : "rgba(255,69,58,0.95)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: 140,
          }}
        >
          {toast.type === "ok" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default AffirmationHub;
