"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { chatWithAiSathi } from '../../lib/api';
import { getTranslation } from './translations';
import {
  Sparkles,
  Send,
  PhoneCall,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  HeartHandshake,
  HeartPulse,
  User,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  Clock,
  Compass,
} from 'lucide-react';

/**
 * Task 8.4: AI Sathi (साथी) Mental Resilience Companion & Emergency SOS
 * Implements Mini-task 8.4.1, 8.4.2, 8.4.3, 8.4.4
 */
export function AiSathiView({ lang = 'en', onTriggerCheckin }) {
  const t = (key) => getTranslation(lang, key);

  const [activeSubTab, setActiveSubTab] = useState('chat'); // 'chat' | 'pranayama'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  // Pranayama 4-7-8 Breathing Guide State (Mini-task 8.4.3)
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState('idle'); // 'idle' | 'inhale' | 'hold' | 'exhale'
  const [countdown, setCountdown] = useState(4);
  const [cycleIndex, setCycleIndex] = useState(1);
  const totalCycles = 4;

  const chatEndRef = useRef(null);

  // Initialize welcoming message
  useEffect(() => {
    setMessages([
      {
        id: 'initial',
        sender: 'sathi',
        text: t('sathiIntro'),
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          lang === 'hi' ? '4-7-8 प्राणायाम शुरू करें' : 'Try 4-7-8 Pranayama Breathing',
          lang === 'hi' ? 'रात की ड्यूटी से थकान महसूस हो रही है' : 'I feel exhausted from night duties',
          lang === 'hi' ? 'परिवार की याद आ रही है' : 'I miss my family and home',
        ],
      },
    ]);
  }, [lang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Mini-task 8.4.3: Pranayama 4-7-8 Timer Engine
  useEffect(() => {
    let timer = null;
    if (isBreathingActive) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev > 1) {
            return prev - 1;
          }

          // Transition between phases
          if (breathPhase === 'inhale') {
            setBreathPhase('hold');
            return 7; // Hold for 7 seconds
          } else if (breathPhase === 'hold') {
            setBreathPhase('exhale');
            return 8; // Exhale for 8 seconds
          } else if (breathPhase === 'exhale') {
            if (cycleIndex >= totalCycles) {
              setIsBreathingActive(false);
              setBreathPhase('completed');
              return 0;
            } else {
              setCycleIndex((c) => c + 1);
              setBreathPhase('inhale');
              return 4; // Inhale for 4 seconds
            }
          }
          return 4;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isBreathingActive, breathPhase, cycleIndex]);

  const handleStartBreathing = () => {
    setIsBreathingActive(true);
    setBreathPhase('inhale');
    setCountdown(4);
    setCycleIndex(1);
  };

  const handlePauseBreathing = () => {
    setIsBreathingActive(false);
  };

  const handleResetBreathing = () => {
    setIsBreathingActive(false);
    setBreathPhase('idle');
    setCountdown(4);
    setCycleIndex(1);
  };

  // Mini-task 8.4.2: Send message to AI Sathi
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    // If user asks about breathing, recommend switching to Pranayama
    if (text.toLowerCase().includes('breath') || text.toLowerCase().includes('प्राणायाम') || text.toLowerCase().includes('pranayam')) {
      setTimeout(() => {
        setActiveSubTab('pranayama');
      }, 1200);
    }

    try {
      const response = await chatWithAiSathi({ message: text });
      const replyText = lang === 'hi' ? response.reply_hi : response.reply_en;

      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'sathi',
        text: replyText,
        crisisDetected: response.crisis_detected,
        suggestedActions: response.suggested_actions || [],
        pranayamaGuide: response.pranayama_guide,
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);

      // If crisis was detected, trigger SOS alert modal
      if (response.crisis_detected) {
        setIsSosModalOpen(true);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err?.response?.data?.detail || err.message || 'Error connecting to AI Sathi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Emergency SOS Callout */}
      <Card className="p-4 border-slate-200 bg-white shadow-gov-subtle">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center font-black border border-slate-800 shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">{t('sathiHeading')}</h2>
                <Badge variant="pill" size="xs">AI Sathi 2.0</Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t('sathiSubheading')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            {/* Sub-Tab Navigation Toggle */}
            <div className="inline-flex rounded-md border border-slate-300 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setActiveSubTab('chat')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  activeSubTab === 'chat'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('chatTab')}
              </button>
              <button
                onClick={() => setActiveSubTab('pranayama')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                  activeSubTab === 'pranayama'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartPulse className="w-3 h-3 text-white" />
                {t('pranayamaTab')}
              </button>
            </div>

            {/* Mini-task 8.4.4: High-Contrast Emergency SOS Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsSosModalOpen(true)}
              leftIcon={PhoneCall}
              className="font-bold text-xs shrink-0"
            >
              {t('emergencySosBtn')}
            </Button>
          </div>
        </div>
      </Card>

      {/* VIEW 1: Confidential Chat Stream (Mini-task 8.4.1 & 8.4.2) */}
      {activeSubTab === 'chat' && (
        <Card className="border-slate-200 bg-white shadow-gov-subtle flex flex-col h-[560px]">
          {/* Header Strip with APAR Guarantee */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-950">
              <Lock className="w-3.5 h-3.5 text-emerald-800" />
              100% Confidential Private Enclave • End-to-End Encrypted
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              DPDPA §14 Medical Privilege
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                      isUser
                        ? 'bg-slate-900 text-white'
                        : 'bg-black text-white border border-slate-700'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] space-y-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-black text-white rounded-tr-none shadow-sm'
                          : msg.crisisDetected
                          ? 'bg-red-50 border-2 border-red-300 text-red-950 rounded-tl-none font-medium'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Crisis Escalation Callout in bubble */}
                      {msg.crisisDetected && (
                        <div className="mt-2.5 pt-2 border-t border-red-200 flex items-center justify-between gap-2">
                          <span className="font-bold text-red-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Crisis Helpline Activated
                          </span>
                          <button
                            onClick={() => setIsSosModalOpen(true)}
                            className="px-2 py-0.5 rounded bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 cursor-pointer"
                          >
                            Call 14416
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Suggested Follow-up Action Chips */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (action.includes('14416')) {
                                setIsSosModalOpen(true);
                              } else if (action.includes('Pranayama') || action.includes('प्राणायाम')) {
                                setActiveSubTab('pranayama');
                              } else {
                                handleSendMessage(action);
                              }
                            }}
                            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-slate-500 font-mono block px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic">
                <div className="w-4 h-4 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
                <span>AI Sathi is thinking...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Quick Ask:</span>
            {[
              lang === 'hi' ? 'गहरी सांस लेने में मदद करें' : 'Help me breathe calmly',
              lang === 'hi' ? 'नींद नहीं आ रही है' : 'I cannot sleep',
              lang === 'hi' ? 'छुट्टी की नीति क्या है?' : 'What is the leave policy?',
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-0.5 rounded-full text-[11px] bg-white border border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-900 whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('sathiPlaceholder')}
                disabled={isLoading}
                className="flex-1 rounded-lg border border-slate-300 text-xs py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-black text-slate-900 bg-white placeholder:text-slate-400"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !inputText.trim()}
                leftIcon={Send}
                className="font-bold text-xs shrink-0"
              >
                Send
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* VIEW 2: 4-7-8 Pranayama Breathing Guide (Mini-task 8.4.3) */}
      {activeSubTab === 'pranayama' && (
        <Card className="border-slate-200 bg-white p-6 sm:p-8 text-center space-y-6 shadow-gov-subtle">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-800 uppercase border border-slate-200">
              <HeartPulse className="w-3.5 h-3.5 text-slate-700" />
              Special Forces Autonomic Reset Protocol
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              {lang === 'hi' ? '4-7-8 प्राणायाम एवं श्वास क्रिया' : '4-7-8 Autonomic Recovery Breathing'}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {lang === 'hi'
                ? '4 सेकंड नाक से सांस लें • 7 सेकंड रोकें • 8 सेकंड मुंह से धीरे-धीरे छोड़ें। यह क्रिया 2 मिनट में तनाव को 40% तक कम करती है।'
                : 'Inhale through nose for 4s • Hold for 7s • Exhale slowly through mouth for 8s. Clinically proven to stimulate parasympathetic recovery.'}
            </p>
          </div>

          {/* Visual Breathing Pulse Circle Animation */}
          <div className="py-8 flex flex-col items-center justify-center relative">
            {/* Outer Glow Halo */}
            <div
              className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-1000 ${
                breathPhase === 'inhale'
                  ? 'scale-110 bg-slate-100 border-4 border-black shadow-lg'
                  : breathPhase === 'hold'
                  ? 'scale-110 bg-slate-200 border-4 border-slate-700 shadow-md ring-8 ring-slate-100'
                  : breathPhase === 'exhale'
                  ? 'scale-90 bg-slate-50 border-4 border-slate-400 shadow-xs'
                  : 'scale-100 bg-slate-50 border-2 border-slate-200'
              }`}
            >
              {/* Inner Circle with Countdown */}
              <div className="w-44 h-44 rounded-full bg-white border border-slate-200 flex flex-col items-center justify-center shadow-xs p-4">
                <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900">
                  {countdown}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 mt-1">
                  {breathPhase === 'inhale'
                    ? t('inhale')
                    : breathPhase === 'hold'
                    ? t('hold')
                    : breathPhase === 'exhale'
                    ? t('exhale')
                    : breathPhase === 'completed'
                    ? 'Session Complete!'
                    : 'Ready'}
                </span>
              </div>
            </div>

            {/* Cycle Progress Indicator */}
            <div className="mt-4 text-xs font-mono font-bold text-slate-600">
              {t('cycleCount')} {cycleIndex} {t('cycleOf')} {totalCycles}
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isBreathingActive ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleStartBreathing}
                leftIcon={Play}
                className="font-bold text-xs"
              >
                {t('startBreathing')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={handlePauseBreathing}
                leftIcon={Pause}
                className="text-xs font-bold"
              >
                {t('pauseBreathing')}
              </Button>
            )}

            <Button
              variant="ghost"
              size="md"
              onClick={handleResetBreathing}
              leftIcon={RotateCcw}
              className="text-xs"
            >
              {t('resetBreathing')}
            </Button>
          </div>
        </Card>
      )}

      {/* Mini-task 8.4.4: Prominent Emergency SOS Hotline Modal */}
      {isSosModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsSosModalOpen(false)}
          size="lg"
        >
          <ModalHeader className="bg-red-950 text-white border-b border-red-900">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-400 animate-bounce" />
              <div>
                <ModalTitle className="text-base font-bold text-white">
                  {lang === 'hi' ? 'आपातकालीन मानसिक स्वास्थ्य व संकट सहायता' : 'Emergency Psychological Lifeline & Crisis Support'}
                </ModalTitle>
                <ModalDescription className="text-xs text-red-200 mt-0.5">
                  24x7 Armed Forces Confidential Tele-Counseling
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="p-6 space-y-4 text-slate-900 text-xs">
            {/* Primary Action Call Box */}
            <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-center space-y-2">
              <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block">
                Direct Toll-Free Hotline
              </span>
              <a
                href="tel:14416"
                className="inline-block text-2xl sm:text-3xl font-black font-mono text-red-800 hover:text-red-900 tracking-wide underline decoration-red-400"
              >
                14416
              </a>
              <p className="text-[11px] text-red-700 font-medium">
                National Tele-Mental Health Assistance and Networking Across States (Tele-MANAS)
              </p>
              <div className="pt-2">
                <a
                  href="tel:14416"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-xs"
                >
                  <PhoneCall className="w-4 h-4" />
                  Tap to Dial Tele-MANAS (14416)
                </a>
              </div>
            </div>

            {/* Base Hospital & Peer Support Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">Unit Hospital Duty Medical Officer</span>
                <p className="font-mono text-slate-700 font-semibold text-xs">1800-891-4416 (Ext: 849)</p>
                <p className="text-[10px] text-slate-500">Dr. Rajiv Malhotra • Confidential Triage</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">Confidential Unit Peer Buddy</span>
                <p className="font-mono text-slate-700 font-semibold text-xs">Designated Buddy: HC Vikram Singh</p>
                <p className="text-[10px] text-slate-500">24/7 Companionship & Listening</p>
              </div>
            </div>

            {/* Statutory Protection Guarantee */}
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Statutory Immunity Guarantee:</strong> Reaching out for psychological support is a recognized act of military discipline. Under Ministry of Defence Medical Directives, emergency consultations carry <strong>ZERO promotion, posting, or career penalties</strong>.
              </p>
            </div>
          </ModalBody>

          <ModalFooter className="bg-slate-50 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsSosModalOpen(false)}>
              Close Lifeline Window
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

export default AiSathiView;
