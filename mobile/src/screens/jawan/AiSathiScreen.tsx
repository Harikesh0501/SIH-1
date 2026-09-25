import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import { MonochromeButton, MonochromeBadge, MonochromeCard } from '../../components/common';
import { apiClient } from '../../api/client';
import { formatISTTime } from '../../utils/time';

interface ChatMessage {
  id: string;
  sender: 'sathi' | 'jawan';
  text: string;
  time: string;
  isCrisis?: boolean;
}

export const AiSathiScreen: React.FC = () => {
  const { user, t, lang } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'pranayama'>('chat');

  // -------------------------------------------------------------
  // Conversational Sathi State
  // -------------------------------------------------------------
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'sathi',
      text: t('aiSathiIntro'),
      time: formatISTTime(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  // Quick Chips
  const promptChips = lang === 'hi' ? [
    'रात की गश्त से थकान',
    'घर की याद आ रही है',
    'नींद नहीं आ रही',
    '4-7-8 प्राणायाम शुरू करें',
  ] : [
    'Night patrol exhaustion',
    'Missing family back home',
    'Trouble falling asleep',
    'Start 4-7-8 Pranayama',
  ];

  // -------------------------------------------------------------
  // Tactical 4-7-8 Pranayama State
  // -------------------------------------------------------------
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [countdown, setCountdown] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);

  const circleScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  // Auto scroll chat to bottom when messages update
  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, activeTab]);

  // Clean up pranayama timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // -------------------------------------------------------------
  // Pranayama Engine (4s Inhale -> 7s Hold -> 8s Exhale)
  // -------------------------------------------------------------
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {
        // Ignore haptics error on unsupported devices
      }
    }
  };

  const startPranayama = () => {
    setBreathingActive(true);
    runPhase('inhale', 4);
  };

  const stopPranayama = () => {
    setBreathingActive(false);
    setBreathingPhase('idle');
    setCountdown(0);
    if (timerRef.current) clearInterval(timerRef.current);
    Animated.timing(circleScale, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const runPhase = (phase: 'inhale' | 'hold' | 'exhale', durationSecs: number) => {
    setBreathingPhase(phase);
    setCountdown(durationSecs);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);

    // Animate visual circle
    if (phase === 'inhale') {
      Animated.timing(circleScale, {
        toValue: 1.55,
        duration: durationSecs * 1000,
        useNativeDriver: true,
      }).start();
    } else if (phase === 'exhale') {
      Animated.timing(circleScale, {
        toValue: 1.0,
        duration: durationSecs * 1000,
        useNativeDriver: true,
      }).start();
    }

    if (timerRef.current) clearInterval(timerRef.current);

    let remaining = durationSecs;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        // Transition to next phase
        if (phase === 'inhale') {
          runPhase('hold', 7);
        } else if (phase === 'hold') {
          runPhase('exhale', 8);
        } else if (phase === 'exhale') {
          setCompletedCycles((c) => c + 1);
          // Loop into next inhale cycle
          runPhase('inhale', 4);
        }
      }
    }, 1000);
  };

  // -------------------------------------------------------------
  // Chat Messaging Engine
  // -------------------------------------------------------------
  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend || inputText).trim();
    if (!msg) return;

    const jawanMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'jawan',
      text: msg,
      time: formatISTTime(),
    };

    setMessages((prev) => [...prev, jawanMsg]);
    setInputText('');
    setLoadingReply(true);

    // If message is asking for pranayama, switch to tab
    if (msg.includes('प्राणायाम') || msg.toLowerCase().includes('pranayama') || msg.toLowerCase().includes('breathing')) {
      setTimeout(() => {
        setLoadingReply(false);
        setActiveTab('pranayama');
        startPranayama();
      }, 500);
      return;
    }

    try {
      const res = await apiClient.post('/api/jawan/ai-sathi/chat', { message: msg });
      const data = res.data;

      const replyText = lang === 'hi' ? data.reply_hi : data.reply_en;
      const isCrisis = !!data.crisis_detected;

      if (isCrisis) {
        setCrisisAlert(true);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'sathi',
          text: replyText || (lang === 'hi' ? 'मैं आपकी बात समझ रहा हूँ।' : 'I hear you, comrade.'),
          time: formatISTTime(),
          isCrisis,
        },
      ]);
    } catch (err: any) {
      // Offline fallback responses tailored for field jawans
      console.log('Backend chat unreachable, generating offline empathetic response...');
      let fallbackReply = '';
      const lower = msg.toLowerCase();

      if (lower.includes('मरना') || lower.includes('suicide') || lower.includes('जान देनी') || lower.includes('help')) {
        setCrisisAlert(true);
        fallbackReply = lang === 'hi'
          ? 'प्रिय साथी, आपका जीवन अत्यंत महत्वपूर्ण है। कृपया गहरी सांस लें, आप अकेले नहीं हैं। तुरंत नीचे दिए गए बटन पर टैप करके 14416 (टेली-मानस) पर निःशुल्क बात करें।'
          : 'Comrade, your life is precious to your comrades and family. You are not alone. Please tap below to speak with Tele-MANAS (14416) immediately.';
      } else if (lower.includes('थकान') || lower.includes('patrol') || lower.includes('fatigue')) {
        fallbackReply = lang === 'hi'
          ? 'लगातार गश्त और ऑपरेशनल ड्यूटी से शारीरिक थकान होना स्वाभाविक है। अपनी गैर-ड्यूटी अवधि में पर्याप्त जल पिएं और 10 मिनट के लिए प्राणायाम का अभ्यास करें।'
          : 'Operational patrol duty takes a heavy toll. Ensure proper hydration and practice 10 minutes of tactical 4-7-8 breathing during downtime.';
      } else if (lower.includes('घर') || lower.includes('family') || lower.includes('याद')) {
        fallbackReply = lang === 'hi'
          ? 'दूरदराज अग्रिम चौकियों पर घर-परिवार की चिंता होना स्वाभाविक है। अपनी यूनिट में साथियों से बात करें और शाम को बेस फोन से संपर्क करने का प्रयास करें।'
          : 'Being deployed far from family is challenging. Connect with your barrack comrades and request a scheduled call window from base comms.';
      } else {
        fallbackReply = lang === 'hi'
          ? 'जय हिंद! मैं आपकी बात समझ रहा हूँ। मानसिक एकाग्रता और आंतरिक संतुलन बनाए रखने के लिए आप कभी भी प्राणायाम अभ्यास कर सकते हैं।'
          : 'Jai Hind, comrade! I understand. Maintain your mental composure and practice the guided tactical breathing session whenever feeling strained.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'sathi',
          text: fallbackReply,
          time: formatISTTime(),
        },
      ]);
    } finally {
      setLoadingReply(false);
    }
  };

  const handleCallTeleManas = () => {
    Linking.openURL('tel:14416');
  };

  const handleCallMedicalOfficer = () => {
    Linking.openURL('tel:104');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Institutional Header Block */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t('aiSathiTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('aiSathiSubtitle')}</Text>
        </View>

        <View style={styles.headerRight}>
          <MonochromeBadge label="APAR QUARANTINED" variant="gold" />
        </View>
      </View>

      {/* Segmented Dual Sub-Tab Switcher */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('chat')}
          style={[styles.subTabItem, activeTab === 'chat' && styles.subTabItemActive]}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={16}
            color={activeTab === 'chat' ? '#0F172A' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.subTabText, activeTab === 'chat' && styles.subTabTextActive]}>
            {t('chatTab')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('pranayama')}
          style={[styles.subTabItem, activeTab === 'pranayama' && styles.subTabItemActive]}
        >
          <Ionicons
            name="flower-outline"
            size={16}
            color={activeTab === 'pranayama' ? '#0F172A' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.subTabText, activeTab === 'pranayama' && styles.subTabTextActive]}>
            {t('pranayamaTab')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: CONVERSATIONAL SATHI COMPANION */}
      {activeTab === 'chat' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.chatContainer}
        >
          {/* Emergency Crisis Interceptor Banner */}
          {crisisAlert && (
            <View style={styles.crisisBanner}>
              <View style={styles.crisisHeaderRow}>
                <Ionicons name="warning" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.crisisTitle}>
                  {lang === 'hi' ? 'आपातकालीन सहायता उपलब्ध है' : 'EMERGENCY CRISIS SUPPORT ACTIVE'}
                </Text>
              </View>
              <Text style={styles.crisisText}>
                {lang === 'hi'
                  ? 'आप अकेले नहीं हैं। सैन्य परामर्शदाता एवं टेली-मानस 24/7 निःशुल्क सहायता के लिए उपलब्ध हैं।'
                  : 'You do not have to carry this alone. Tele-MANAS is available 24/7 free of cost.'}
              </Text>

              <View style={styles.crisisActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCallTeleManas}
                  style={styles.crisisCallBtn}
                >
                  <Ionicons name="call" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.crisisCallText}>TELE-MANAS (14416)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCallMedicalOfficer}
                  style={styles.crisisDoctorBtn}
                >
                  <Ionicons name="medkit" size={14} color="#92400E" style={{ marginRight: 4 }} />
                  <Text style={styles.crisisDoctorText}>
                    {lang === 'hi' ? 'चिकित्सा अधिकारी' : 'MEDICAL OFFICER'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Chat Messages Scroll */}
          <ScrollView
            ref={chatScrollRef}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((item) => {
              const isJawan = item.sender === 'jawan';
              return (
                <View
                  key={item.id}
                  style={[styles.messageBubbleWrapper, isJawan ? styles.msgJawanWrap : styles.msgSathiWrap]}
                >
                  {!isJawan && (
                    <View style={styles.sathiAvatar}>
                      <Ionicons name="shield" size={14} color="#0F172A" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isJawan ? styles.msgJawanBubble : styles.msgSathiBubble,
                      item.isCrisis && styles.msgCrisisBubble,
                    ]}
                  >
                    <Text style={[styles.messageText, isJawan ? styles.msgJawanText : styles.msgSathiText]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.messageTime, isJawan ? styles.msgJawanTime : styles.msgSathiTime]}>
                      {item.time}
                    </Text>
                  </View>
                </View>
              );
            })}

            {loadingReply && (
              <View style={[styles.messageBubbleWrapper, styles.msgSathiWrap]}>
                <View style={styles.sathiAvatar}>
                  <Ionicons name="shield" size={14} color="#0F172A" />
                </View>
                <View style={[styles.messageBubble, styles.msgSathiBubble, { paddingVertical: 10 }]}>
                  <ActivityIndicator size="small" color="#0F172A" />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Prompt Chips */}
          <View style={styles.chipsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              {promptChips.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={styles.chatChip}
                  onPress={() => handleSendMessage(chip)}
                >
                  <Text style={styles.chatChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Message Input Box */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.chatInput}
              placeholder={t('typeMessage')}
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSendMessage()}
              disabled={loadingReply || !inputText.trim()}
              style={[styles.sendButton, (!inputText.trim() || loadingReply) && styles.sendButtonDisabled]}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* TAB 2: ANIMATED TACTICAL 4-7-8 PRANAYAMA GUIDE */
        <ScrollView contentContainerStyle={styles.pranayamaContainer} showsVerticalScrollIndicator={false}>
          {/* Tactical Breathing Instructions Card */}
          <MonochromeCard highlight>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <Ionicons name="fitness" size={18} color="#0F172A" />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.pranayamaCardTitle}>
                  {lang === 'hi' ? '4-7-8 ऑटोनॉमिक रिकवरी प्राणायाम' : '4-7-8 AUTONOMIC RECOVERY'}
                </Text>
                <Text style={styles.pranayamaCardSub}>
                  {lang === 'hi'
                    ? '2 मिनट में तंत्रिका तंत्र को शांत एवं युद्ध तनाव (Adrenaline) को संतुलित करता है।'
                    : 'Calms nervous system & lowers operational adrenaline in 2 minutes.'}
                </Text>
              </View>
            </View>

            <View style={styles.protocolRow}>
              <View style={styles.protocolStep}>
                <Text style={styles.protocolNum}>4s</Text>
                <Text style={styles.protocolLabel}>{lang === 'hi' ? 'सांस लें' : 'INHALE'}</Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
              <View style={styles.protocolStep}>
                <Text style={styles.protocolNum}>7s</Text>
                <Text style={styles.protocolLabel}>{lang === 'hi' ? 'रोकें' : 'HOLD'}</Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
              <View style={styles.protocolStep}>
                <Text style={styles.protocolNum}>8s</Text>
                <Text style={styles.protocolLabel}>{lang === 'hi' ? 'छोड़ें' : 'EXHALE'}</Text>
              </View>
            </View>
          </MonochromeCard>

          {/* Animated Expanding Circle Arena */}
          <View style={styles.arenaContainer}>
            <View style={styles.circleOuterWrapper}>
              <Animated.View
                style={[
                  styles.animatedCircle,
                  {
                    transform: [{ scale: circleScale }],
                    borderColor: breathingPhase === 'inhale'
                      ? '#16A34A'
                      : breathingPhase === 'hold'
                      ? '#D97706'
                      : '#0F172A',
                  },
                ]}
              >
                <View style={styles.circleInner}>
                  <Text style={styles.phaseCountdown}>
                    {breathingActive ? countdown : '4-7-8'}
                  </Text>
                  <Text style={styles.phaseLabel}>
                    {breathingPhase === 'inhale'
                      ? (lang === 'hi' ? 'सांस अंदर लें' : 'BREATHE IN')
                      : breathingPhase === 'hold'
                      ? (lang === 'hi' ? 'सांस रोकें' : 'HOLD BREATH')
                      : breathingPhase === 'exhale'
                      ? (lang === 'hi' ? 'सांस छोड़ें' : 'EXHALE SLOWLY')
                      : (lang === 'hi' ? 'तैयार' : 'READY')}
                  </Text>
                </View>
              </Animated.View>
            </View>

            {/* Tactical Darkness Notice */}
            <View style={styles.hapticNotice}>
              <Ionicons name="pulse" size={14} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.hapticNoticeText}>
                {lang === 'hi'
                  ? 'हैप्टिक कंपन सक्रिय: अंधेरी चौकियों में आंखें बंद करके अभ्यास कर सकते हैं।'
                  : 'Haptic feedback active: Practice with eyes closed in pitch darkness.'}
              </Text>
            </View>

            {/* Completed Cycles Counter */}
            <View style={styles.cyclesTallyBox}>
              <Text style={styles.cyclesTallyLabel}>{t('cycleCount')}</Text>
              <Text style={styles.cyclesTallyValue}>{completedCycles} / 4</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.pranayamaControls}>
              {!breathingActive ? (
                <MonochromeButton
                  title={t('startPranayama')}
                  variant="solid"
                  onPress={startPranayama}
                  icon={<Ionicons name="play" size={16} color="#FFFFFF" />}
                  style={{ flex: 1 }}
                />
              ) : (
                <MonochromeButton
                  title={t('stopPranayama')}
                  variant="outline"
                  onPress={stopPranayama}
                  icon={<Ionicons name="stop" size={16} color="#0F172A" />}
                  style={{ flex: 1 }}
                />
              )}

              {completedCycles > 0 && !breathingActive && (
                <MonochromeButton
                  title={lang === 'hi' ? 'रीसेट' : 'RESET'}
                  variant="secondary"
                  onPress={() => setCompletedCycles(0)}
                  style={{ width: 80 }}
                />
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  headerRight: {
    marginLeft: 8,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabItemActive: {
    borderBottomColor: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  subTabTextActive: {
    color: '#0F172A',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  crisisBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    margin: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 8,
  },
  crisisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  crisisTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.4,
  },
  crisisText: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  crisisActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  crisisCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  crisisCallText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  crisisDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  crisisDoctorText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '800',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  msgJawanWrap: {
    justifyContent: 'flex-end',
  },
  msgSathiWrap: {
    justifyContent: 'flex-start',
  },
  sathiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 10,
  },
  msgJawanBubble: {
    backgroundColor: '#0F172A',
    borderBottomRightRadius: 2,
  },
  msgSathiBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  msgCrisisBubble: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgJawanText: {
    color: '#FFFFFF',
  },
  msgSathiText: {
    color: '#0F172A',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgJawanTime: {
    color: '#94A3B8',
  },
  msgSathiTime: {
    color: '#94A3B8',
  },
  chipsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
  },
  chipsScroll: {
    paddingHorizontal: 12,
    gap: 6,
  },
  chatChip: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  chatChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  pranayamaContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pranayamaCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  pranayamaCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  protocolStep: {
    alignItems: 'center',
  },
  protocolNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  protocolLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  arenaContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  circleOuterWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  circleInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseCountdown: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  phaseLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.6,
  },
  hapticNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 24,
  },
  hapticNoticeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  cyclesTallyBox: {
    alignItems: 'center',
    marginVertical: 14,
  },
  cyclesTallyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  cyclesTallyValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  pranayamaControls: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingHorizontal: 16,
  },
});
