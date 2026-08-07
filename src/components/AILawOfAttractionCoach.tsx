import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Loader2, Orbit } from 'lucide-react';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AILawOfAttractionCoach({ 
  profileContext,
  desiresContext,
}: { 
  profileContext: any;
  desiresContext: any[];
}) {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: "Greetings. I am your Quantum Manifestation Coach. I'm here to help you align your frequency, refine your desires, and remove subconscious blocks. What specific reality are we shifting into today?"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch("/api/manifestation/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          profileContext,
          desiresContext
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "My apologies, the quantum link is currently distorted. Let's ground ourselves and try again."
      }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm unable to connect to the source right now. Please take a deep breath and try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full rounded-[32px] bg-black border border-white/5 overflow-hidden relative shadow-2xl">
      {/* Dynamic Cosmic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(77,234,255,0.03)_0%,rgba(0,0,0,0)_50%)]"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.03)_0%,rgba(0,0,0,0)_40%)]"
        />
      </div>
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between relative z-10 bg-black">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 rounded-full border border-dashed border-accent-cyan/30 opacity-70"
            />
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-purple/20 to-accent-cyan/20 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(77,234,255,0.15)] relative z-10">
              <Orbit size={24} className="text-accent-cyan" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              Quantum Coach
              <span className="relative flex h-2 w-2">
                <span className=" absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan"></span>
              </span>
            </h2>
            <p className="text-[10px] font-mono text-accent-purple uppercase tracking-widest">Universal Intelligence</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-none z-10 relative">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className="relative shrink-0">
                {msg.role === 'assistant' && (
                  <motion.div 
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut"} }}
                    className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple opacity-20"
                  />
                )}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 ${
                  msg.role === 'user' 
                    ? 'bg-white/10 border border-white/20 text-white' 
                    : 'bg-black border border-accent-cyan/30 text-accent-cyan shadow-[0_0_15px_rgba(77,234,255,0.3)]'
                }`}>
                  {msg.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
                </div>
              </div>
              
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                msg.role === 'user'
                  ? 'bg-white/10 border border-white/5 text-white ml-auto'
                  : 'bg-black border border-accent-cyan/20 text-text-secondary leading-relaxed  shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="markdown-body text-sm text-text-secondary prose prose-invert prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 max-w-none">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-start gap-4"
            >
              <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
                {/* Black hole event horizon & accretion disk */}
                <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ rotate: { duration: 3, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut"} }}
                  className="absolute inset-0 rounded-full border-[3px] border-b-transparent border-l-transparent border-accent-cyan/70"
                />
                <motion.div 
                  animate={{ rotate: -360, scale: [1.1, 0.9, 1.1] }}
                  transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity, ease: "easeInOut"} }}
                  className="absolute -inset-1 rounded-full border-[2px] border-t-transparent border-r-transparent border-accent-purple/80"
                />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2 rounded-full border border-dashed border-white/20"
                />
                {/* Singularity center */}
                <div className="w-8 h-8 rounded-full bg-black shadow-[inset_0_0_10px_rgba(0,0,0,1),0_0_15px_rgba(168,85,247,0.6)] flex items-center justify-center relative z-10 overflow-hidden">
                  <motion.div 
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-accent-cyan/20 to-transparent"
                  />
                  <Sparkles size={14} className="text-white/80 relative z-10" />
                </div>
              </div>
              <div className="bg-black border border-accent-cyan/20 rounded-2xl px-5 py-4 flex items-center gap-3  shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="flex gap-1.5">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-accent-pink" />
                </div>
                <span className="text-xs font-mono text-accent-cyan uppercase tracking-widest">Materializing frequency...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 border-t border-white/5 bg-black relative z-10">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-3xl p-2 pl-6 focus-within:border-accent-cyan/50 focus-within:bg-white/10 focus-within:shadow-[0_0_20px_rgba(77,234,255,0.1)] transition-all">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Transmit intention to the universe..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-text-muted"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple hover:opacity-90 disabled:opacity-50 disabled:grayscale transition-all text-white shadow-[0_0_15px_rgba(77,234,255,0.4)] shrink-0 group relative overflow-hidden"
          >
            <motion.div 
              className="absolute inset-0 bg-white/20"
              initial={{ scale: 0 }} 
              whileTap={{ scale: 2 }} 
              transition={{ duration: 0.4 }} 
            />
            <Send size={18} className={`relative z-10 transition-transform ${input.trim() ? "group-hover:translate-x-1 group-hover:-translate-y-1" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
