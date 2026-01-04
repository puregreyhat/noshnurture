'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/survey/ProgressBar';
import QuestionCard from '@/components/survey/QuestionCard';
import EmojiSlider from '@/components/survey/EmojiSlider';
import StarRating from '@/components/survey/StarRating';
import NavigationButtons from '@/components/survey/NavigationButtons';
import PillOption from '@/components/survey/PillOption';
import Loading from '@/components/Loading';

const TOTAL_STEPS = 7;

export default function SurveyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMorphing, setIsMorphing] = useState(false);
  const [isNameMorphing, setIsNameMorphing] = useState(false);
  const [isProfileMorphing, setIsProfileMorphing] = useState(false);
  const [isEmojiMorphing, setIsEmojiMorphing] = useState(false);
  const [isCheckboxMorphing, setIsCheckboxMorphing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userType: '',
    householdSize: '2',
    expiryForgetfulness: 0,
    cookingStress: 0,
    duplicateBuying: false,
    groceryManagement: 0,
    wantsExpiryAlerts: false,
    wantsMultilingual: false,
    wantsVoiceAssistant: false,
    wantsShoppingList: false,
    featureRatings: {
      expiryAlerts: 0,
      recipeSuggestions: 0,
      billUpload: 0,
      voiceAssistant: 0,
      shoppingList: 0,
      aiLabelScanner: 0,
    },
    additionalFeedback: '',
  });

  // Get user ID on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // Generate anonymous session ID
      const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', sessionId);
      setUserId(sessionId);
    }
  }, []);

  const handleNext = async () => {
    if (currentStep === TOTAL_STEPS) {
      await handleSubmit();
      return;
    }

    // Step-specific morphs
    if (currentStep === 1) {
      // Morph the 🌱 emoji on welcome
      setIsMorphing(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setIsMorphing(false);
      }, 700);
      return;
    }

    if (currentStep === 2 && formData.firstName.trim()) {
      // Morph the first name text
      setIsNameMorphing(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setTimeout(() => {
          setIsNameMorphing(false);
        }, 100);
      }, 600);
      return;
    }

    if (currentStep === 3 && formData.userType && formData.householdSize) {
      // Show profile summary animation
      setIsProfileMorphing(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setTimeout(() => {
          setIsProfileMorphing(false);
        }, 100);
      }, 2200); // Longer to show the message
      return;
    }

    if (currentStep === 4) {
      // Show selected emojis animation
      setIsEmojiMorphing(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setTimeout(() => {
          setIsEmojiMorphing(false);
        }, 100);
      }, 2000);
      return;
    }

    if (currentStep === 5) {
      // Show checkbox animation
      setIsCheckboxMorphing(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setTimeout(() => {
          setIsCheckboxMorphing(false);
        }, 100);
      }, 1500);
      return;
    }

    // Default
    setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Save form data to sessionStorage for thank you screen
      sessionStorage.setItem('surveyFormData', JSON.stringify(formData));

      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      if (response.ok) {
        setCurrentStep(TOTAL_STEPS + 1); // Show thank you screen
      } else {
        const errorData = await response.json();
        console.error('[Survey] Submission failed:', errorData);
        alert(`Failed to submit survey: ${errorData.details || 'Please check browser console for details'}`);
      }
    } catch (error) {
      console.error('[Survey] Submission error:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateFeatureRating = (feature: string, rating: number) => {
    setFormData((prev) => ({
      ...prev,
      featureRatings: {
        ...prev.featureRatings,
        [feature]: rating,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, -30, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-40 pb-8 md:pt-40 md:pb-12">
        {currentStep <= TOTAL_STEPS && (
          <>
            <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

            <motion.div className="mt-8">
              <AnimatePresence mode="wait">
                {currentStep === 1 && <Step1Welcome key="step1" isMorphing={isMorphing} />}
                {currentStep === 2 && (
                  <Step2Name
                    key="step2"
                    formData={formData}
                    updateFormData={updateFormData}
                    isNameMorphing={isNameMorphing}
                  />
                )}
                {currentStep === 3 && (
                  <Step3Profile 
                    key="step3" 
                    formData={formData} 
                    updateFormData={updateFormData}
                    isProfileMorphing={isProfileMorphing}
                  />
                )}
                {currentStep === 4 && (
                  <Step4Assessment
                    key="step4"
                    formData={formData}
                    updateFormData={updateFormData}
                    isEmojiMorphing={isEmojiMorphing}
                  />
                )}
                {currentStep === 5 && (
                  <Step5Needs 
                    key="step5" 
                    formData={formData} 
                    updateFormData={updateFormData}
                    isCheckboxMorphing={isCheckboxMorphing}
                  />
                )}
                {currentStep === 6 && (
                  <Step6Features
                    key="step6"
                    formData={formData}
                    updateFeatureRating={updateFeatureRating}
                  />
                )}
                {currentStep === 7 && (
                  <Step7Feedback key="step7" formData={formData} updateFormData={updateFormData} />
                )}
              </AnimatePresence>
            </motion.div>

            {!isEmojiMorphing && !isCheckboxMorphing && (
              <NavigationButtons
                onBack={handleBack}
                onNext={handleNext}
                isFirstStep={currentStep === 1}
                isLastStep={currentStep === TOTAL_STEPS}
                isLoading={isLoading}
                nextLabel={currentStep === TOTAL_STEPS ? 'Submit' : 'Next'}
              />
            )}
          </>
        )}

        {currentStep === TOTAL_STEPS + 1 && <StepThankYou router={router} />}
      </div>
    </div>
  );
}

// Step 1: Welcome
function Step1Welcome({ isMorphing }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
    >
      <QuestionCard
        title="🍲 Help Us Improve NoshNurture!"
        subtitle="This survey helps us understand how you manage your kitchen and groceries."
      >
        <motion.div
          className="space-y-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xl text-gray-700">
            We're passionate about reducing food waste and making your kitchen management easier.
          </p>
          {/* Morphing Emoji - enlarges, becomes transparent, and floats upward */}
          <motion.div
            className="text-6xl inline-block"
            animate={
              isMorphing
                ? {
                    scale: 4,
                    opacity: 0,
                    y: -100,
                  }
                : {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                  }
            }
            transition={{
              duration: 0.7,
              ease: 'easeOut',
            }}
          >
            🌱
          </motion.div>
          <p className="text-lg text-gray-600">
            Your feedback is invaluable in shaping the future of NoshNurture!
          </p>
        </motion.div>
      </QuestionCard>
    </motion.div>
  );
}

// Step 2: Name & Last Name
function Step2Name({ formData, updateFormData, isNameMorphing }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <QuestionCard title="👋 Nice to Meet You!" subtitle="Please share your name with us">
        <div className="space-y-6">
          {/* First Name */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              First Name 📝
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateFormData('firstName', e.target.value)}
              placeholder="Enter your first name"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:border-green-500 focus:outline-none transition"
            />
          </motion.div>

          {/* Last Name */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Last Name 📝
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateFormData('lastName', e.target.value)}
              placeholder="Enter your last name"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:border-green-500 focus:outline-none transition"
            />
          </motion.div>

          <motion.p
            className="text-sm text-gray-500 text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            ✨ We'll use this to personalize your experience!
          </motion.p>

          {/* Morphing preview of first name */}
          {formData.firstName?.trim() && (
            <div className="flex justify-center pt-2">
              <motion.span
                className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent"
                animate={
                  isNameMorphing
                    ? { scale: 3.2, opacity: 0, y: -80 }
                    : { scale: 1, opacity: 1, y: 0 }
                }
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                {formData.firstName}
              </motion.span>
            </div>
          )}
        </div>
      </QuestionCard>
    </motion.div>
  );
}

// Step 3: User Profile
function Step3Profile({ formData, updateFormData, isProfileMorphing }: any) {
  // Generate profile summary message
  const getProfileMessage = () => {
    if (!formData.firstName || !formData.userType || !formData.householdSize) return '';
    
    const article = formData.userType === 'Other' ? 'an' : 'a';
    const householdText = formData.householdSize === '1' 
      ? '1 person' 
      : formData.householdSize === '10+' 
        ? '10+ people' 
        : `${formData.householdSize} people`;
    
    return `${formData.firstName}, ${article} ${formData.userType} who has ${householdText} in the house`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Profile Summary Message - Shows when morphing */}
      <AnimatePresence>
        {isProfileMorphing && formData.userType && formData.householdSize && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -30 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-8 p-8 rounded-3xl bg-gradient-to-br from-green-100 via-emerald-50 to-blue-100 border-2 border-green-300 shadow-xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-6xl mb-4"
              >
                💚
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent"
              >
                {getProfileMessage()}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-sm text-gray-600 mt-3"
              >
                ✨ We're excited to learn more about you!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuestionCard
        title={
          <span>
            👤 Tell Us About Yourself{' '}
            {formData.firstName && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5, y: -30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  ease: 'easeOut',
                  delay: 0.3,
                  type: 'spring',
                  stiffness: 120
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent inline-block"
              >
                {formData.firstName}
              </motion.span>
            )}
          </span>
        }
        subtitle="Help us understand your background"
      >
        <div className="space-y-8">
          {/* User Type */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Who are you? 👥</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Homemaker', icon: '👩‍🍳' },
                { label: 'Working Woman', icon: '💼' },
                { label: 'Student', icon: '📚' },
                { label: 'Other', icon: '🤔' },
              ].map((option) => (
                <PillOption
                  key={option.label}
                  label={option.label}
                  icon={option.icon}
                  selected={formData.userType === option.label}
                  onClick={() => updateFormData('userType', option.label)}
                />
              ))}
            </div>
          </motion.div>

          {/* Household Size */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Household Size? 🏠
            </h3>
            <select
              value={formData.householdSize}
              onChange={(e) => updateFormData('householdSize', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-800 focus:border-green-500 focus:outline-none text-lg"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                <option key={size} value={size}>
                  {size} {size === 1 ? 'person' : 'people'}
                </option>
              ))}
              <option value="10+">10+ people</option>
            </select>
          </motion.div>
        </div>
      </QuestionCard>
    </motion.div>
  );
}

// Step 4: Assessment
function Step4Assessment({ formData, updateFormData, isEmojiMorphing }: any) {
  // Get selected emojis based on user's ratings
  const getSelectedEmojis = () => {
    const emojis: string[] = [];
    const emojiMap = [
      { key: 'expiryForgetfulness', emojis: ['😊', '😅', '😓', '😭'] },
      { key: 'cookingStress', emojis: ['😊', '😐', '😟', '😫'] },
      { key: 'groceryManagement', emojis: ['😊', '😌', '😓', '😩'] },
    ];

    emojiMap.forEach((item) => {
      const value = formData[item.key];
      // Slider passes 0-3, directly use as index
      if (value >= 0 && value <= 3) {
        emojis.push(item.emojis[value]);
      }
    });
    
    return emojis.slice(0, 3); // Take first 3
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Emoji morph transition overlay */}
      <AnimatePresence>
        {isEmojiMorphing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50/95 via-blue-50/95 to-purple-50/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-semibold text-gray-700 mb-6"
              >
                Your journey so far...
              </motion.p>
              <div className="flex gap-8 justify-center">
                {getSelectedEmojis().map((emoji, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.5 + index * 0.2,
                      type: 'spring',
                      stiffness: 200
                    }}
                    className="text-8xl"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-lg text-gray-600 mt-6"
              >
                ✨ Let's discover what features you need!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuestionCard
        title="📊 How Do You Feel About Grocery Management?"
        subtitle="Be honest – there are no wrong answers!"
      >
        <div className="space-y-8">
          {/* Expiry Forgetfulness */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              How often do you forget expiry dates? 📅
            </h3>
            <EmojiSlider
              value={formData.expiryForgetfulness}
              onChange={(val) => updateFormData('expiryForgetfulness', val)}
              emojis={['😊', '😅', '😓', '😭']}
              labels={['Never', 'Sometimes', 'Often', 'Very Often']}
            />
          </motion.div>

          {/* Cooking Stress */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Stress deciding what to cook daily? 🍳
            </h3>
            <EmojiSlider
              value={formData.cookingStress}
              onChange={(val) => updateFormData('cookingStress', val)}
              emojis={['😊', '😐', '😟', '😫']}
              labels={['Not Stressed', 'Slightly', 'Quite', 'Very Much']}
            />
          </motion.div>

          {/* Duplicate Buying */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Do you accidentally buy duplicates? 🛒
            </h3>
            <div className="flex gap-3">
              {['Yes', 'No'].map((option) => (
                <PillOption
                  key={option}
                  label={option}
                  icon={option === 'Yes' ? '👍' : '✋'}
                  selected={formData.duplicateBuying === (option === 'Yes')}
                  onClick={() => updateFormData('duplicateBuying', option === 'Yes')}
                />
              ))}
            </div>
          </motion.div>

          {/* Grocery Management */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Difficulty managing groceries regularly? 📦
            </h3>
            <EmojiSlider
              value={formData.groceryManagement}
              onChange={(val) => updateFormData('groceryManagement', val)}
              emojis={['😊', '😌', '😓', '😩']}
              labels={['Easy', 'Moderate', 'Challenging', 'Very Difficult']}
            />
          </motion.div>
        </div>
      </QuestionCard>
    </motion.div>
  );
}

// Step 5: Needs
function Step5Needs({ formData, updateFormData, isCheckboxMorphing }: any) {
  const features = [
    { key: 'wantsExpiryAlerts', label: 'Expiry alerts', icon: '🔔' },
    { key: 'wantsMultilingual', label: 'Multilingual recipes', icon: '🌍' },
    { key: 'wantsVoiceAssistant', label: 'Voice-based assistance', icon: '🎤' },
    { key: 'wantsShoppingList', label: 'Automatic shopping lists', icon: '📝' },
  ];

  const selectedFeatures = features.filter(f => formData[f.key as keyof typeof formData]);
  const allSelected = selectedFeatures.length === features.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Checkbox morph transition overlay */}
      <AnimatePresence>
        {isCheckboxMorphing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50/95 via-blue-50/95 to-purple-50/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-md"
            >
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-semibold text-gray-700 mb-6"
              >
                {allSelected ? '🎉 All features selected!' : 'Your selected features:'}
              </motion.p>
              <div className="space-y-3">
                {selectedFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.key}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.4 + index * 0.15,
                      type: 'spring',
                      stiffness: 150
                    }}
                    className="bg-white/80 backdrop-blur p-4 rounded-2xl border-2 border-green-400 flex items-center gap-3 shadow-lg"
                  >
                    <span className="text-3xl">{feature.icon}</span>
                    <span className="text-lg font-medium text-gray-800">{feature.label}</span>
                    <span className="ml-auto text-green-600 text-2xl">✓</span>
                  </motion.div>
                ))}
              </div>
              {selectedFeatures.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-600 mt-4"
                >
                  No features selected yet
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuestionCard
        title="🎯 What Features Would Help You?"
        subtitle="Select features that matter to you"
      >
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {features.map((feature, index) => {
              const isSelected = formData[feature.key as keyof typeof formData];
              
              return (
                <motion.button
                  key={feature.key}
                  layout
                  onClick={() => updateFormData(feature.key, !isSelected)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-green-50 border-green-500 text-green-700 font-semibold'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <span>{feature.label}</span>
                  <motion.span 
                    className="ml-auto text-xl"
                    animate={{ scale: isSelected ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isSelected ? '✓' : '○'}
                  </motion.span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </QuestionCard>
    </motion.div>
  );
}

// Step 6: Feature Rating
function Step6Features({ formData, updateFeatureRating }: any) {
  const features = [
    { key: 'expiryAlerts', label: 'Expiry Alerts', icon: '🔔' },
    { key: 'recipeSuggestions', label: 'Recipe Suggestions', icon: '👨‍🍳' },
    { key: 'billUpload', label: 'Bill Upload Feature', icon: '📄' },
    { key: 'voiceAssistant', label: 'Voice Assistant', icon: '🎤' },
    { key: 'shoppingList', label: 'Shopping List', icon: '📝' },
    { key: 'aiLabelScanner', label: 'AI Label Scanner', icon: '🤖' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <QuestionCard title="⭐ Rate These Features" subtitle="How useful do you find each feature?">
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {features.map((feature) => (
            <motion.div key={feature.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <StarRating
                featureName={`${feature.icon} ${feature.label}`}
                rating={formData.featureRatings[feature.key as keyof typeof formData.featureRatings]}
                onRate={(rating) => updateFeatureRating(feature.key, rating)}
              />
            </motion.div>
          ))}
        </motion.div>
      </QuestionCard>
    </motion.div>
  );
}

// Step 7: Feedback
function Step7Feedback({ formData, updateFormData }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <QuestionCard
        title="💬 Additional Feedback"
        subtitle="Tell us anything else you'd like us to know"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <textarea
            value={formData.additionalFeedback}
            onChange={(e) => updateFormData('additionalFeedback', e.target.value)}
            placeholder="Tell us any other features you wish to see in NoshNurture…"
            className="w-full px-6 py-4 rounded-2xl border-2 border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:border-green-500 focus:outline-none resize-none"
            rows={6}
          />
          <motion.p
            className="text-sm text-gray-500 mt-3 text-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {formData.additionalFeedback.length}/500 characters
          </motion.p>
        </motion.div>
      </QuestionCard>
    </motion.div>
  );
}

// Thank You Screen with Confetti
function StepThankYou({ router }: any) {
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    // Get form data from session/state
    const storedData = sessionStorage.getItem('surveyFormData');
    if (storedData) {
      try {
        setFormData(JSON.parse(storedData));
      } catch (e) {
        console.error('Error parsing form data:', e);
      }
    }

    // Create confetti effect
    const confetti = () => {
      for (let i = 0; i < 50; i++) {
        const confettiPiece = document.createElement('div');
        confettiPiece.className = 'fixed pointer-events-none text-2xl';
        confettiPiece.textContent = ['🎉', '🎊', '🎈', '🌟', '✨', '🎁'][Math.floor(Math.random() * 6)];
        confettiPiece.style.left = Math.random() * 100 + 'vw';
        confettiPiece.style.top = '-10px';
        confettiPiece.style.animation = `fall ${2 + Math.random() * 2}s linear`;
        document.body.appendChild(confettiPiece);

        setTimeout(() => confettiPiece.remove(), 4000);
      }
    };

    // Trigger confetti multiple times
    confetti();
    const timer1 = setTimeout(() => confetti(), 500);
    const timer2 = setTimeout(() => confetti(), 1000);

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fall {
        to {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Redirect timer
    const redirectTimer = setTimeout(() => {
      router.push('/dashboard');
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(redirectTimer);
      document.head.removeChild(style);
    };
  }, [router]);

  const firstName = formData?.firstName || 'Friend';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative overflow-hidden"
    >
      {/* Floating Confetti Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            initial={{ 
              top: `-10%`,
              left: `${Math.random() * 100}%`,
              rotate: 0,
              opacity: 1
            }}
            animate={{
              top: `110%`,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
              opacity: [1, 1, 0.5, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 2
            }}
          >
            {['🎊', '🎉', '🎈', '✨', '⭐', '💚', '🌱'][i % 7]}
          </motion.div>
        ))}
      </div>

      {/* Animated Party Poppers */}
      <motion.div
        className="text-8xl mb-8 flex gap-8 relative z-10"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
      >
        <motion.span
          animate={{ 
            rotate: [0, -15, 15, -10, 10, 0],
            y: [0, -10, 0]
          }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        >
          🎊
        </motion.span>
        <motion.span
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
        >
          🎉
        </motion.span>
        <motion.span
          animate={{ 
            rotate: [0, 15, -15, 10, -10, 0],
            y: [0, -10, 0]
          }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.2 }}
        >
          🎊
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ scale: 0, rotate: -360 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 150, delay: 0.5 }}
        className="relative z-10"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity }
          }}
          className="text-9xl mb-8"
        >
          🌱
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-5xl font-bold text-gray-800 mb-4"
      >
        Thank You, {firstName}! 🎉
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-semibold text-green-600 mb-6"
      >
        Your feedback has been saved! ✨
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-2xl mb-8"
      >
        <p className="text-xl text-gray-700 mb-4">
          🙏 Your contribution is helping us build a better NoshNurture!
        </p>
        <p className="text-lg text-gray-600 mb-2">
          Thanks for helping us reduce food waste and make cooking easier for everyone! 🌍❤️
        </p>
        <p className="text-md text-gray-500 italic">
          Every piece of feedback brings us closer to zero food waste! 🎯
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-lg text-gray-500 mb-6"
      >
        Redirecting to dashboard in 4 seconds... ⏳
      </motion.p>

      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
        className="mt-4"
      >
        <div className="w-16 h-16 border-4 border-green-500 border-t-green-300 rounded-full animate-spin" />
      </motion.div>
    </motion.div>
  );
}
