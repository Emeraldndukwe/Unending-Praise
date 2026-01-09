import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type MemberType = "christ-embassy" | "ism-reon" | "others" | null;

type FormData = {
  memberType: MemberType;
  [key: string]: any;
};

// Question configurations for each member type
const formConfigs = {
  "christ-embassy": [
    {
      step: 2,
      questions: [
        {
          id: "church_location",
          label: "Which church location do you attend?",
          type: "select",
          options: ["Main Campus", "Zone 1", "Zone 2", "Zone 3", "Other"],
          required: true,
        },
        {
          id: "ministry_involvement",
          label: "Are you involved in any ministry?",
          type: "radio",
          options: ["Yes", "No"],
          required: true,
          conditional: {
            field: "ministry_involvement",
            value: "Yes",
            questions: [
              {
                id: "ministry_name",
                label: "Which ministry are you involved in?",
                type: "text",
                required: true,
              },
            ],
          },
        },
        {
          id: "years_attending",
          label: "How long have you been attending?",
          type: "select",
          options: ["Less than 1 year", "1-3 years", "3-5 years", "5+ years"],
          required: true,
        },
      ],
    },
    {
      step: 3,
      questions: [
        {
          id: "kingschat_username",
          label: "What is your KingsChat username?",
          type: "text",
          required: true,
        },
        {
          id: "cell_leader",
          label: "Do you have a cell leader?",
          type: "radio",
          options: ["Yes", "No"],
          required: true,
          conditional: {
            field: "cell_leader",
            value: "Yes",
            questions: [
              {
                id: "cell_leader_name",
                label: "What is your cell leader's name?",
                type: "text",
                required: true,
              },
            ],
          },
        },
        {
          id: "additional_info",
          label: "Any additional information?",
          type: "textarea",
          required: false,
        },
      ],
    },
  ],
  "ism-reon": [
    {
      step: 2,
      questions: [
        {
          id: "program_type",
          label: "Which program are you enrolled in?",
          type: "radio",
          options: ["ISM", "REON"],
          required: true,
        },
        {
          id: "program_level",
          label: "What level are you in?",
          type: "select",
          options: ["Level 1", "Level 2", "Level 3", "Level 4", "Graduate"],
          required: true,
        },
        {
          id: "campus_location",
          label: "Which campus are you at?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      step: 3,
      questions: [
        {
          id: "student_id",
          label: "What is your student ID?",
          type: "text",
          required: true,
        },
        {
          id: "mentor_assigned",
          label: "Do you have an assigned mentor?",
          type: "radio",
          options: ["Yes", "No"],
          required: true,
          conditional: {
            field: "mentor_assigned",
            value: "Yes",
            questions: [
              {
                id: "mentor_name",
                label: "What is your mentor's name?",
                type: "text",
                required: true,
              },
            ],
          },
        },
        {
          id: "goals",
          label: "What are your goals in the program?",
          type: "textarea",
          required: false,
        },
      ],
    },
  ],
  "others": [
    {
      step: 2,
      questions: [
        {
          id: "background",
          label: "Tell us about your background",
          type: "textarea",
          required: true,
        },
        {
          id: "interest_reason",
          label: "What brings you here?",
          type: "text",
          required: true,
        },
        {
          id: "previous_experience",
          label: "Any previous experience with Christ Embassy?",
          type: "radio",
          options: ["Yes", "No"],
          required: true,
          conditional: {
            field: "previous_experience",
            value: "Yes",
            questions: [
              {
                id: "experience_details",
                label: "Please provide details",
                type: "textarea",
                required: true,
              },
            ],
          },
        },
      ],
    },
    {
      step: 3,
      questions: [
        {
          id: "contact_preference",
          label: "How would you prefer to be contacted?",
          type: "select",
          options: ["Email", "Phone", "WhatsApp", "KingsChat"],
          required: true,
        },
        {
          id: "expectations",
          label: "What are your expectations?",
          type: "textarea",
          required: false,
        },
        {
          id: "additional_comments",
          label: "Any additional comments?",
          type: "textarea",
          required: false,
        },
      ],
    },
  ],
};

export default function TestForm() {
  const [memberType, setMemberType] = useState<MemberType>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({ memberType: null });
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const handleMemberTypeSelect = (type: MemberType) => {
    setMemberType(type);
    setFormData({ ...formData, memberType: type });
  };

  const handleInputChange = (id: string, value: any) => {
    const newFormData = { ...formData, [id]: value };
    
    // Handle conditional questions - check if this change affects any conditional questions
    if (memberType) {
      const newExpanded = new Set(expandedQuestions);
      const config = formConfigs[memberType];
      
      config.forEach((stepConfig) => {
        stepConfig.questions.forEach((question) => {
          if (question.conditional && question.conditional.field === id) {
            if (value === question.conditional.value) {
              newExpanded.add(question.id);
            } else {
              newExpanded.delete(question.id);
              // Clear conditional question data
              question.conditional.questions.forEach((cq) => {
                delete newFormData[cq.id];
              });
            }
          }
        });
      });
      
      setExpandedQuestions(newExpanded);
    }
    
    setFormData(newFormData);
  };

  // Check if a question should show its conditional questions
  const shouldShowConditional = (question: any) => {
    if (!question.conditional) return false;
    const fieldValue = formData[question.conditional.field];
    return fieldValue === question.conditional.value;
  };

  const getCurrentQuestions = () => {
    if (!memberType || currentStep === 1) return [];
    const config = formConfigs[memberType];
    const stepConfig = config.find((s) => s.step === currentStep);
    return stepConfig ? stepConfig.questions : [];
  };

  const canProceedToNext = () => {
    if (currentStep === 1) return memberType !== null;
    
    const questions = getCurrentQuestions();
    return questions.every((q) => {
      if (q.required && !formData[q.id]) return false;
      if (q.conditional && shouldShowConditional(q)) {
        return q.conditional.questions.every((cq) => {
          if (cq.required) return !!formData[cq.id];
          return true;
        });
      }
      return true;
    });
  };

  const handleNext = () => {
    if (currentStep === 1 && memberType) {
      setCurrentStep(2);
    } else if (memberType) {
      const config = formConfigs[memberType];
      const maxStep = Math.max(...config.map((c) => c.step));
      if (currentStep < maxStep) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    alert("Form submitted! Check console for data.");
  };

  const renderQuestion = (question: any) => {
    const value = formData[question.id] || "";

    switch (question.type) {
      case "text":
        return (
          <input
            type="text"
            id={question.id}
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#54037C]"
            required={question.required}
          />
        );
      case "textarea":
        return (
          <textarea
            id={question.id}
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            rows={4}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#54037C] resize-none"
            required={question.required}
          />
        );
      case "select":
        return (
          <select
            id={question.id}
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#54037C]"
            required={question.required}
          >
            <option value="">Select an option</option>
            {question.options.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="flex flex-col gap-2">
            {question.options.map((opt: string) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  className="w-4 h-4 text-[#54037C] focus:ring-[#54037C]"
                  required={question.required}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f4ea] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
            Test Form
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Step {currentStep} of {memberType ? (formConfigs[memberType].length + 1) : 1}
          </p>

          {/* Step 1: Member Type Selection */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Please select your category:
              </h2>
              <div className="space-y-3">
                {[
                  { value: "christ-embassy", label: "Christ Embassy Member" },
                  { value: "ism-reon", label: "ISM/REON Members" },
                  { value: "others", label: "Others" },
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handleMemberTypeSelect(option.value as MemberType)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      memberType === option.value
                        ? "border-[#54037C] bg-[#54037C]/10"
                        : "border-gray-300 hover:border-[#54037C]/50"
                    }`}
                  >
                    <span className="font-medium text-gray-800">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Subsequent Steps: Questions */}
          {currentStep > 1 && memberType && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {getCurrentQuestions().map((question, idx) => (
                  <div key={question.id} className="space-y-2">
                    <label
                      htmlFor={question.id}
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {question.label}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderQuestion(question)}

                    {/* Conditional Questions */}
                    {question.conditional &&
                      shouldShowConditional(question) &&
                      question.conditional.questions.map((cq: any) => (
                        <motion.div
                          key={cq.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 ml-4 pl-4 border-l-2 border-[#54037C]"
                        >
                          <label
                            htmlFor={cq.id}
                            className="block text-sm font-semibold text-gray-700"
                          >
                            {cq.label}
                            {cq.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          {renderQuestion(cq)}
                        </motion.div>
                      ))}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between items-center">
            {currentStep > 1 && (
              <motion.button
                type="button"
                onClick={handleBack}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 transition"
              >
                ← Back
              </motion.button>
            )}
            <div className="ml-auto">
              {memberType && (
                <AnimatePresence>
                  {canProceedToNext() && (
                    <motion.button
                      type="button"
                      onClick={handleNext}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="px-6 py-2 bg-[#54037C] text-white rounded-lg hover:bg-[#54037C]/90 transition font-semibold"
                    >
                      {currentStep === Math.max(...formConfigs[memberType].map((c) => c.step))
                        ? "Submit"
                        : "Next →"}
                    </motion.button>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

