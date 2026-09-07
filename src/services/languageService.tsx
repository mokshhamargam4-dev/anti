export type SupportedLanguage =
  | 'English'
  | 'Assamese'
  | 'Bengali'
  | 'Bodo'
  | 'Manipuri'
  | 'Khasi'
  | 'Garo'
  | 'Mizo'
  | 'Nagamese'
  | 'Hindi';

type Translation = {
  greeting: string;
  welcome: string;
  currentTime: string;
  feeling: string;
  feelingHelp: string;
  good: string;
  okay: string;
  notGood: string;
  thankYou: string;
  recommendedActivities: string;
  startActivity: string;
  completedToday: string;
  cognitiveJourney: string;
  streak: string;
  activities: string;
  weeklyGoal: string;
  gentleRoutine: string;
  needHelp: string;
  reachCaregiver: string;

  // Memory Match game
  memoryMatch: string;
  memoryMatchHelp: string;
  back: string;
  time: string;
  attempts: string;
  matched: string;
  hiddenCard: string;
  touchMe: string;
  memoryMatchInstruction: string;
};

const english: Translation = {
  greeting: 'Namaskar',
  welcome: 'We are so glad to see you today.',
  currentTime: 'Current Time',
  feeling: 'How are you feeling right now?',
  feelingHelp:
    'Touch a card below; your daily practice plan adapts to your comfort.',
  good: 'Good',
  okay: 'Okay',
  notGood: 'Not good',
  thankYou: 'Thank you for checking in!',
  recommendedActivities: "Today's Recommended Activities",
  startActivity: 'Start Activity',
  completedToday: 'Completed Today',
  cognitiveJourney: 'My Cognitive Journey',
  streak: 'Streak',
  activities: 'Activities',
  weeklyGoal: 'Weekly Goal',
  gentleRoutine: "Today's Gentle Routine",
  needHelp: 'Need Help or Want to Talk?',
  reachCaregiver: 'Reach Caregiver Now',

  // Memory Match
  memoryMatch: 'Memory Match',
  memoryMatchHelp:
    'Find and match the matching North Eastern cultural cards',
  back: 'Back',
  time: 'Time',
  attempts: 'Attempts',
  matched: 'Matched',
  hiddenCard: 'Hidden Card',
  touchMe: 'Touch Me',
  memoryMatchInstruction:
    'Take as much time as you like. Touch any two cards to reveal their pictures and match them!',
};

const translations: Record<SupportedLanguage, Translation> = {
  English: english,

  Hindi: {
    greeting: 'नमस्कार',
    welcome: 'आज आपको देखकर हमें बहुत खुशी हुई।',
    currentTime: 'वर्तमान समय',
    feeling: 'आप अभी कैसा महसूस कर रहे हैं?',
    feelingHelp:
      'नीचे दिए गए विकल्प को चुनें। आपकी दैनिक अभ्यास योजना आपके आराम के अनुसार बदलेगी।',
    good: 'अच्छा',
    okay: 'ठीक',
    notGood: 'अच्छा नहीं',
    thankYou: 'बताने के लिए धन्यवाद!',
    recommendedActivities: 'आज की सुझाई गई गतिविधियाँ',
    startActivity: 'गतिविधि शुरू करें',
    completedToday: 'आज पूरा हुआ',
    cognitiveJourney: 'मेरी संज्ञानात्मक यात्रा',
    streak: 'लगातार दिन',
    activities: 'गतिविधियाँ',
    weeklyGoal: 'साप्ताहिक लक्ष्य',
    gentleRoutine: 'आज की सरल दिनचर्या',
    needHelp: 'मदद चाहिए या बात करना चाहते हैं?',
    reachCaregiver: 'देखभाल करने वाले से संपर्क करें',

    // Memory Match
    memoryMatch: 'याददाश्त मिलान',
    memoryMatchHelp:
      'पूर्वोत्तर भारत की एक जैसी सांस्कृतिक तस्वीरों का मिलान करें',
    back: 'वापस',
    time: 'समय',
    attempts: 'प्रयास',
    matched: 'मिलान',
    hiddenCard: 'छिपा हुआ कार्ड',
    touchMe: 'छुएँ',
    memoryMatchInstruction:
      'अपना समय लें। किसी भी दो कार्ड को छूकर तस्वीर देखें और उनका मिलान करें!',
  },

  Assamese: {
    greeting: 'নমস্কাৰ',
    welcome: 'আজি আপোনাক দেখি আমি অতি আনন্দিত।',
    currentTime: 'বৰ্তমান সময়',
    feeling: 'আপুনি এতিয়া কেনে অনুভৱ কৰিছে?',
    feelingHelp:
      'তলৰ এটা বিকল্প বাছনি কৰক। আপোনাৰ দৈনিক অনুশীলন আপোনাৰ সুবিধা অনুসৰি সলনি হ’ব।',
    good: 'ভাল',
    okay: 'ঠিকেই',
    notGood: 'ভাল নহয়',
    thankYou: 'জনোৱাৰ বাবে ধন্যবাদ!',
    recommendedActivities: 'আজিৰ পৰামৰ্শ দিয়া কাৰ্যকলাপ',
    startActivity: 'কাৰ্যকলাপ আৰম্ভ কৰক',
    completedToday: 'আজি সম্পূৰ্ণ',
    cognitiveJourney: 'মোৰ জ্ঞানীয় যাত্ৰা',
    streak: 'ধাৰাবাহিক দিন',
    activities: 'কাৰ্যকলাপ',
    weeklyGoal: 'সাপ্তাহিক লক্ষ্য',
    gentleRoutine: 'আজিৰ সহজ দৈনন্দিন কাম',
    needHelp: 'সহায়ৰ প্ৰয়োজন নে কথা পাতিব বিচাৰে?',
    reachCaregiver: 'কেৰগিভাৰৰ সৈতে যোগাযোগ কৰক',

    // Memory Match
    memoryMatch: 'স্মৃতি মিলোৱা',
    memoryMatchHelp:
      'উত্তৰ-পূৰ্বাঞ্চলৰ একে ধৰণৰ সাংস্কৃতিক কাৰ্ড বিচাৰি মিলাওক',
    back: 'পিছলৈ',
    time: 'সময়',
    attempts: 'চেষ্টা',
    matched: 'মিলিছে',
    hiddenCard: 'লুকাই থকা কাৰ্ড',
    touchMe: 'চুই চাওক',
    memoryMatchInstruction:
      'আপোনাৰ সময় লওক। যিকোনো দুটা কাৰ্ডত চুই ছবিবোৰ চাওক আৰু মিলাওক!',
  },

  Bengali: {
    greeting: 'নমস্কার',
    welcome: 'আজ আপনাকে দেখে আমরা খুব আনন্দিত।',
    currentTime: 'বর্তমান সময়',
    feeling: 'আপনি এখন কেমন অনুভব করছেন?',
    feelingHelp:
      'নিচের একটি বিকল্প বেছে নিন। আপনার দৈনিক অনুশীলন আপনার আরামের অনুযায়ী পরিবর্তিত হবে।',
    good: 'ভালো',
    okay: 'ঠিক আছে',
    notGood: 'ভালো নয়',
    thankYou: 'জানানোর জন্য ধন্যবাদ!',
    recommendedActivities: 'আজকের প্রস্তাবিত কার্যক্রম',
    startActivity: 'কার্যক্রম শুরু করুন',
    completedToday: 'আজ সম্পন্ন',
    cognitiveJourney: 'আমার জ্ঞানীয় যাত্রা',
    streak: 'ধারাবাহিক দিন',
    activities: 'কার্যক্রম',
    weeklyGoal: 'সাপ্তাহিক লক্ষ্য',
    gentleRoutine: 'আজকের সহজ দৈনন্দিন কাজ',
    needHelp: 'সাহায্য দরকার বা কথা বলতে চান?',
    reachCaregiver: 'কেয়ারগিভারের সাথে যোগাযোগ করুন',

    // Memory Match
    memoryMatch: 'স্মৃতি মিল',
    memoryMatchHelp:
      'উত্তর-পূর্ব ভারতের একই ধরনের সাংস্কৃতিক কার্ড মিলিয়ে নিন',
    back: 'পিছনে',
    time: 'সময়',
    attempts: 'চেষ্টা',
    matched: 'মিলেছে',
    hiddenCard: 'লুকানো কার্ড',
    touchMe: 'স্পর্শ করুন',
    memoryMatchInstruction:
      'আপনার সময় নিন। যেকোনো দুটি কার্ড স্পর্শ করে ছবি দেখুন এবং মিলিয়ে নিন!',
  },

  // These languages currently use English fallback.
  // We will add verified translations later.
  Bodo: english,
  Manipuri: english,
  Khasi: english,
  Garo: english,
  Mizo: english,
  Nagamese: english,
};

export const getTranslations = (language?: string): Translation => {
  if (language && language in translations) {
    return translations[language as SupportedLanguage];
  }

  return english;
};

