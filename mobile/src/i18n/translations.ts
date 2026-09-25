/**
 * Multi-lingual Defense Dictionary (Hindi & English)
 * Specially adapted for Indian Armed Forces (CRPF, BSF, ITBP & Army Jawans).
 */

export const TRANSLATIONS = {
  en: {
    // App Header & Branding
    systemName: 'RAKSHAK-AAYUSH',
    systemSubtitle: 'OPERATIONAL RESILIENCE & SOVEREIGN PRIVACY',
    unit: '104 BN CRPF / SPECIAL OPERATIONS',

    // Roles
    roleJawan: 'Field Jawan',
    roleWelfare: 'Medical & Welfare Officer',
    roleCommander: 'Commanding Officer',
    roleAudit: 'Audit Administrator',

    // Login & Security
    loginTitle: 'TACTICAL ACCESS PORTAL',
    loginSubtitle: 'Cryptographically Decoupled from ACR/APAR Service Records',
    serviceIdLabel: 'SERVICE ID / MILITARY CREDENTIAL',
    serviceIdPlaceholder: 'e.g. CT-RAMESH-84920',
    passwordLabel: 'SECURITY PIN / PASSWORD',
    passwordPlaceholder: 'Enter security credentials',
    loginButton: 'AUTHENTICATE & ENTER',
    biometricLoginButton: 'TOUCH FINGERPRINT SENSOR TO UNLOCK',
    biometricPrompt: 'Scan Fingerprint to Authenticate Confidential Enclave',
    biometricFallback: 'Use Service ID Credentials',
    demoRolesTitle: 'QUICK PROTOTYPE ROLE SELECTOR',
    logout: 'SECURE LOGOUT',

    // Jawan Tabs
    tabCheckin: 'Daily Check-in',
    tabAiSathi: 'AI Sathi & Pranayama',
    tabCertificate: 'APAR Privacy Pass',
    tabLeave: 'Leave & History',

    // Check-in
    checkinTitle: '15-SECOND DAILY MICRO-CHECK-IN',
    checkinSubtitle: 'Private • Decoupled from Performance Appraisals',
    moodLabel: 'Current Mood',
    mood1: 'Severely Depressed / Low',
    mood2: 'Low / Disheartened',
    mood3: 'Steady / Normal',
    mood4: 'Good / High Morale',
    mood5: 'Peak Operational Spirit',
    sleepHoursLabel: 'Sleep Duration (Last 24 Hours)',
    sleepQualityLabel: 'Sleep Quality',
    physicalExhaustionLabel: 'Physical Exhaustion',
    exhaustion1: 'Completely Fresh',
    exhaustion3: 'Moderate Fatigue',
    exhaustion5: 'Severe Physical Exhaustion',
    mentalStressLabel: 'Mental Strain / Pressure',
    stress1: 'Calm & Focused',
    stress3: 'Noticeable Stress',
    stress5: 'Extreme Mental Strain',
    notesLabel: 'Confidential Notes / Thoughts (Optional)',
    notesPlaceholder: 'Write anything on your mind (family, night patrol fatigue, leave delay)...',
    phq4Header: 'RAPID 4-QUESTION SCREENER (OPTIONAL PHQ-4)',
    phq4Sub: 'Self-assessment of anxiety and mood strain over recent shifts',
    phqQ1: 'Feeling nervous, anxious, or on edge?',
    phqQ2: 'Not being able to stop or control worrying?',
    phqQ3: 'Little interest or pleasure in doing tasks?',
    phqQ4: 'Feeling down, depressed, or hopeless?',
    phqOpt0: 'Not at all (0)',
    phqOpt1: 'Several days (1)',
    phqOpt2: 'Over half days (2)',
    phqOpt3: 'Nearly every day (3)',
    phqScoreLabel: 'Cumulative Screener Score',
    submitCheckin: 'SUBMIT CONFIDENTIAL CHECK-IN',
    submitting: 'CALCULATING RESILIENCE...',
    offlineSaved: 'SAVED LOCALLY (OFFLINE QUEUE ACTIVE)',
    offlineNote: 'Zero connectivity detected. Check-in stored in encrypted local SQLite. Will auto-sync when back at outpost.',

    // Post-checkin result
    checkinSuccessTitle: 'CHECK-IN RECORDED SUCCESSFULLY',
    currentStressScore: 'Predicted Stress Score',
    riskTier: 'Operational Risk Tier',

    // AI Sathi
    aiSathiTitle: 'AI SATHI (एआई साथी)',
    aiSathiSubtitle: '24/7 Confidential Welfare Companion • Tele-MANAS (14416) Linked',
    aiSathiIntro: 'Jai Hind, Jawan! I am your 24/7 confidential welfare companion. This conversation is 100% quarantined from your official service records. How are you feeling today?',
    typeMessage: 'Type your message...',
    send: 'SEND',
    pranayamaTab: '4-7-8 TACTICAL BREATHING',
    chatTab: 'CONVERSATIONAL COMPANION',
    breatheIn: 'BREATHE IN (4s)',
    holdBreath: 'HOLD BREATH (7s)',
    breatheOut: 'EXHALE SLOWLY (8s)',
    startPranayama: 'START 4-7-8 CYCLE',
    stopPranayama: 'STOP BREATHING GUIDE',
    cycleCount: 'Completed Cycles',

    // APAR Certificate
    certTitle: 'STATUTORY MEDICAL PRIVACY & APAR DECOUPLING CERTIFICATE',
    certAuthority: 'Directorate General Armed Forces Medical Services (DGAFMS) & MHA',
    certRef: 'Statutory Shield Reference',
    certSoldierName: 'Soldier Name',
    certServiceNo: 'Service Number',
    certCompany: 'Unit / Company',
    certStatus: 'Statutory Privilege Status',
    certStatusValue: 'ACTIVE - CRYPTOGRAPHICALLY QUARANTINED',
    certGuaranteeTitle: 'STATUTORY NON-PUNITIVE GUARANTEE',
    certGuaranteeText: 'Under DPDPA 2023 & Ministry of Home Affairs Medical Confidentiality Directives, self-reported mental health disclosures, micro check-ins, and voluntary fatigue logs are permanently isolated from Annual Confidential Reports (ACR/APAR). Zero promotion penalties or punitive transfers can be imposed.',
    savePass: 'SAVE PASS TO DEVICE',

    // Leave & Grievance
    leaveTitle: 'CONFIDENTIAL LEAVE & WELFARE APPLICATION',
    leaveSubtitle: 'Direct to Base Medical Officer • Zero Promotion Linkage',
    leaveTypeLabel: 'Leave Type',
    daysRequestedLabel: 'Days Requested',
    startDateLabel: 'Start Date (YYYY-MM-DD)',
    endDateLabel: 'End Date (YYYY-MM-DD)',
    reasonLabel: 'Personal Reason',
    emergencyToggle: 'Flag as Emergency Welfare Grievance',
    submitLeave: 'SUBMIT CONFIDENTIAL APPLICATION',
    leaveHistoryTitle: 'LEAVE APPLICATION STATUS',

    // Welfare Desk
    welfareTitle: 'PRIORITY CLINICAL TRIAGE QUEUE',
    welfareSubtitle: '63 Monitored Personnel • AI Stress Inferred • 5-Factor XAI',
    examineDossier: 'EXAMINE DOSSIER',
    dispatchAction: 'DISPATCH WELFARE INTERVENTION',
    dossierTitle: 'CONFIDENTIAL SOLDIER DOSSIER',
    xaiTitle: '5-FACTOR XAI ATTRIBUTIONS (SHAP)',

    // Commander Glance
    commanderTitle: 'TACTICAL FORCE READINESS SNAPSHOT',
    commanderSubtitle: 'Battalion-Level Aggregated KPI • k-Anonymity (k≥5) Protected',
    friLabel: 'FORCE READINESS INDEX',
    burnoutWarning: 'CRITICAL OPERATIONAL BURNOUT ALERT',
    heatmapTitle: 'COMPANY STRAIN HEATMAP',

    // Audit Validator
    auditTitle: 'CRYPTOGRAPHIC TAMPER & APAR VALIDATOR',
    auditSubtitle: 'SHA-256 Hash Chain Integrity • DPDPA §14 Compliance',
    verifyLedger: 'VERIFY AUDIT LEDGER INTEGRITY',
    verifiedStatus: 'LEDGER VERIFIED UNCOMPROMISED',
  },
  hi: {
    // App Header & Branding
    systemName: 'रक्षक-आयुष (RAKSHAK-AAYUSH)',
    systemSubtitle: 'सैनिक मानसिक स्वास्थ्य एवं संवैधानिक गोपनीयता प्रणाली',
    unit: '104 बटालियन सीआरपीएफ / विशेष अभियान',

    // Roles
    roleJawan: 'फील्ड जवान (सैनिक)',
    roleWelfare: 'कल्याण एवं चिकित्सा अधिकारी',
    roleCommander: 'कमांडिंग ऑफिसर (कमांडेंट)',
    roleAudit: 'ऑडिट प्रशासक',

    // Login & Security
    loginTitle: 'सुरक्षित सामरिक लॉगिन पोर्टल',
    loginSubtitle: 'सेवा पुस्तिका (ACR/APAR) से स्थायी रूप से अलग एवं सुरक्षित',
    serviceIdLabel: 'सर्विस नंबर / पहचान पत्र',
    serviceIdPlaceholder: 'उदा. CT-RAMESH-84920',
    passwordLabel: 'सुरक्षा पिन / पासवर्ड',
    passwordPlaceholder: 'सुरक्षा क्रेडेंशियल दर्ज करें',
    loginButton: 'प्रमाणित करें एवं प्रवेश करें',
    biometricLoginButton: 'फिंगरप्रिंट सेंसर छूकर तुरंत अनलॉक करें',
    biometricPrompt: 'गोपनीय एनक्लेव अनलॉक करने हेतु फिंगरप्रिंट स्कैन करें',
    biometricFallback: 'पासवर्ड/पिन का उपयोग करें',
    demoRolesTitle: 'त्वरित डेमो रोल चयनकर्ता',
    logout: 'सुरक्षित लॉगआउट',

    // Jawan Tabs
    tabCheckin: 'दैनिक चेक-इन',
    tabAiSathi: 'एआई साथी एवं प्राणायाम',
    tabCertificate: 'गोपनीयता प्रमाण-पत्र',
    tabLeave: 'छुट्टी एवं इतिहास',

    // Check-in
    checkinTitle: '15-सेकंड दैनिक माइक्रो चेक-इन',
    checkinSubtitle: 'पूर्णतः निजी • वार्षिक मूल्यांकन (APAR) से अलग',
    moodLabel: 'वर्तमान मानसिक स्थिति (मूड)',
    mood1: 'अत्यधिक उदास / परेशान',
    mood2: 'उदास / हताश',
    mood3: 'सामान्य / स्थिर',
    mood4: 'अच्छा / उच्च मनोबल',
    mood5: 'सर्वश्रेष्ठ मनोबल एवं उत्साह',
    sleepHoursLabel: 'नींद की अवधि (पिछले 24 घंटों में)',
    sleepQualityLabel: 'नींद की गुणवत्ता',
    physicalExhaustionLabel: 'शारीरिक थकान का स्तर',
    exhaustion1: 'पूरी तरह तरोताजा',
    exhaustion3: 'मध्यम थकान',
    exhaustion5: 'अत्यधिक शारीरिक थकान',
    mentalStressLabel: 'मानसिक तनाव / चिंता',
    stress1: 'शांत एवं केंद्रित',
    stress3: 'हल्का तनाव',
    stress5: 'गंभीर मानसिक तनाव',
    notesLabel: 'गोपनीय व्यक्तिगत विचार / नोट्स (वैकल्पिक)',
    notesPlaceholder: 'मन की कोई भी बात लिखें (पारिवारिक चिंता, रात की गश्त, छुट्टी में देरी)...',
    phq4Header: 'त्वरित 4-प्रश्नीय स्वास्थ्य जांच (वैकल्पिक PHQ-4)',
    phq4Sub: 'हाल के दिनों में घबराहट एवं मानसिक स्थिति का स्व-मूल्यांकन',
    phqQ1: 'क्या आप घबराहट या बेचैनी महसूस कर रहे हैं?',
    phqQ2: 'क्या चिंताओं को नियंत्रित करना कठिन लग रहा है?',
    phqQ3: 'क्या दैनिक कार्यों में रुचि या उत्साह कम महसूस हो रहा है?',
    phqQ4: 'क्या उदासी, निराशा या हताशा का अनुभव हो रहा है?',
    phqOpt0: 'बिल्कुल नहीं (0)',
    phqOpt1: 'कुछ दिन (1)',
    phqOpt2: 'आधे से अधिक दिन (2)',
    phqOpt3: 'लगभग हर दिन (3)',
    phqScoreLabel: 'कुल जांच स्कोर',
    submitCheckin: 'गोपनीय चेक-इन दर्ज करें',
    submitting: 'तनाव का विश्लेषण हो रहा है...',
    offlineSaved: 'ऑफ़लाइन सुरक्षित (स्थानीय स्टोरेज में दर्ज)',
    offlineNote: 'नेटवर्क उपलब्ध नहीं है। डेटा फ़ोन के सुरक्षित SQLite में सुरक्षित है। नेटवर्क मिलने पर अपने-आप सिंक होगा।',

    // Post-checkin result
    checkinSuccessTitle: 'चेक-इन सफलतापूर्वक दर्ज हुआ',
    currentStressScore: 'अनुमानित तनाव स्कोर',
    riskTier: 'जोखिम श्रेणी (Risk Tier)',

    // AI Sathi
    aiSathiTitle: 'एआई साथी (AI SATHI)',
    aiSathiSubtitle: '24/7 गोपनीय कल्याण साथी • टेली-मानस (14416) से लिंक',
    aiSathiIntro: 'जय हिंद, जवान! मैं आपका 24/7 गोपनीय कल्याण साथी हूँ। यह बातचीत आपकी आधिकारिक सेवा पुस्तिका से पूरी तरह अलग है। आज आप कैसा महसूस कर रहे हैं?',
    typeMessage: 'अपना संदेश लिखें...',
    send: 'भेजें',
    pranayamaTab: '4-7-8 टैक्टिकल प्राणायाम',
    chatTab: 'कल्याण साथी संवाद',
    breatheIn: 'सांस अंदर खींचें (4 सेकंड)',
    holdBreath: 'सांस रोककर रखें (7 सेकंड)',
    breatheOut: 'धीरे-धीरे सांस छोड़ें (8 सेकंड)',
    startPranayama: 'प्राणायाम चक्र शुरू करें',
    stopPranayama: 'प्राणायाम रोकें',
    cycleCount: 'पूरे किए गए चक्र',

    // APAR Certificate
    certTitle: 'संवैधानिक स्वास्थ्य गोपनीयता एवं एसीआर/अपार सुरक्षा प्रमाण-पत्र',
    certAuthority: 'सशस्त्र बल चिकित्सा सेवा महानिदेशालय (DGAFMS) एवं गृह मंत्रालय',
    certRef: 'कानूनी सुरक्षा संदर्भ संख्या',
    certSoldierName: 'सैनिक का नाम',
    certServiceNo: 'सर्विस नंबर',
    certCompany: 'यूनिट / कंपनी',
    certStatus: 'संवैधानिक विशेषाधिकार स्थिति',
    certStatusValue: 'सक्रिय - स्थायी रूप से अलग',
    certGuaranteeTitle: 'संवैधानिक गैर-दंडात्मक सुरक्षा गारंटी',
    certGuaranteeText: 'DPDPA 2023 और गृह मंत्रालय के चिकित्सा गोपनीयता निर्देशों के तहत, स्वयं रिपोर्ट किए गए मानसिक स्वास्थ्य स्कोर, दैनिक चेक-इन और थकान का डेटा वार्षिक मूल्यांकन (ACR/APAR) से स्थायी रूप से अलग रखा जाता है। कोई भी पदोन्नति दंड या दंडात्मक स्थानांतरण नहीं लगाया जा सकता।',
    savePass: 'पास डिवाइस में सेव करें',

    // Leave & Grievance
    leaveTitle: 'गोपनीय छुट्टी एवं कल्याण शिकायत आवेदन',
    leaveSubtitle: 'सीधे बेस मेडिकल ऑफिसर को प्रेषित • सेवा पुस्तिका पर शून्य प्रभाव',
    leaveTypeLabel: 'छुट्टी का प्रकार',
    daysRequestedLabel: 'मांगे गए दिन',
    startDateLabel: 'आरंभ तिथि (YYYY-MM-DD)',
    endDateLabel: 'समाप्ति तिथि (YYYY-MM-DD)',
    reasonLabel: 'व्यक्तिगत कारण',
    emergencyToggle: 'आपातकालीन कल्याण शिकायत के रूप में चिह्नित करें',
    submitLeave: 'गोपनीय आवेदन जमा करें',
    leaveHistoryTitle: 'छुट्टी आवेदन की स्थिति',

    // Welfare Desk
    welfareTitle: 'प्राथमिकता क्लिनिकल ट्राइएज कतार',
    welfareSubtitle: '63 सैनिक • एआई तनाव अनुमान • 5-कारक XAI व्याख्या',
    examineDossier: 'दस्तावेज़ (Dossier) देखें',
    dispatchAction: 'कल्याण सहायता भेजें',
    dossierTitle: 'सैनिक का गोपनीय दस्तावेज़',
    xaiTitle: '5-कारक तनाव चालक (SHAP)',

    // Commander Glance
    commanderTitle: 'सामरिक बल तत्परता समीक्षा (FRI)',
    commanderSubtitle: 'बटालियन स्तर का डेटा • k-Anonymity (k≥5) द्वारा सुरक्षित',
    friLabel: 'बल तत्परता सूचकांक (FRI)',
    burnoutWarning: 'गंभीर ऑपरेशनल बर्नआउट चेतावनी',
    heatmapTitle: 'कंपनी तनाव हीटमैप',

    // Audit Validator
    auditTitle: 'क्रिप्टोग्राफिक ऑडिट एवं अपार प्रमाणक',
    auditSubtitle: 'SHA-256 हैश अखंडता • DPDPA §14 अनुपालन',
    verifyLedger: 'ऑडिट लेजर की प्रामाणिकता जांचें',
    verifiedStatus: 'लेजर पूर्णतः सुरक्षित एवं अप्रभावित',
  },
};
