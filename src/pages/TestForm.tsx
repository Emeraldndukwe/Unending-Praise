import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";

type MemberType = "christ-embassy" | "ism-reon" | "others" | null;

type FormData = {
  memberType: MemberType;
  [key: string]: any;
};

type ConditionalQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "radio" | "file";
  required: boolean;
  options?: string[];
  description?: string;
  accept?: string;
  hasFileUpload?: boolean;
  hidden?: boolean;
  conditional?: ConditionalConfig;
};

type ConditionalConfig = {
  field: string;
  value: string;
  questions: ConditionalQuestion[];
  // Support multiple conditional branches
  branches?: Array<{
    value: string;
    questions: ConditionalQuestion[];
  }>;
};

type Question = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "radio" | "file";
  required: boolean;
  options?: string[];
  description?: string;
  accept?: string;
  hasFileUpload?: boolean;
  hidden?: boolean;
  conditional?: ConditionalConfig;
};

type StepConfig = {
  step: number;
  questions: Question[];
};

type FormConfigs = {
  [K in Exclude<MemberType, null>]: StepConfig[];
};

// Step 2 for ISM/REON and Others
const step2IsmReonOthers: StepConfig = {
  step: 2,
  questions: [
    {
      id: "organizer_name",
      label: "Name of Individual/Group",
      type: "text",
      required: true,
    },
    {
      id: "phone_number",
      label: "Phone Number",
      type: "text",
      required: true,
    },
    {
      id: "kingschat_username",
      label: "KingsChat Username",
      type: "text",
      required: false,
    },
    {
      id: "ministry_church_name",
      label: "Name of Ministry/Church",
      type: "text",
      required: true,
    },
    {
      id: "pastor_name",
      label: "Name of Pastor",
      type: "text",
      required: true,
    },
  ],
};

// Step 2 for Christ Embassy members
const step2ChristEmbassy: StepConfig = {
  step: 2,
  questions: [
    {
      id: "organizer_name",
      label: "Name of Individual/Group",
      type: "text",
      required: true,
    },
    {
      id: "phone_number",
      label: "Phone Number",
      type: "text",
      required: true,
    },
    {
      id: "kingschat_username",
      label: "KingsChat Username",
      type: "text",
      required: false,
    },
    {
      id: "zone_name",
      label: "Name of Zone",
      type: "text",
      required: true,
    },
    {
      id: "zonal_pastor_name",
      label: "Name of Zonal Pastor",
      type: "text",
      required: true,
    },
    {
      id: "lmm_coordinator_name",
      label: "Name of LMM Coordinator",
      type: "text",
      required: false,
    },
  ],
};

// Common step 4 for all member types - Attendance metrics
const commonStep4: StepConfig = {
  step: 4,
  questions: [
    {
      id: "total_attendance",
      label: "Total Attendance",
      type: "text",
      required: true,
    },
    {
      id: "new_converts",
      label: "Total Number of New Converts",
      type: "text",
      required: true,
    },
    {
      id: "first_timers",
      label: "Total Number of First Timers",
      type: "text",
      required: true,
    },
    {
      id: "cells",
      label: "Total Number of Cells",
      type: "text",
      required: true,
    },
  ],
};

// Common step 5 for all member types - Media and writeup
const commonStep5: StepConfig = {
  step: 5,
  questions: [
    {
      id: "media_link",
      label: "Link Containing Media",
      type: "text",
      required: false,
    },
    {
      id: "testimonies_link",
      label: "Link Containing Testimonies",
      description: "Link containing testimonies either in video or written format (if in written format, compile all testimonies from the program in a word document and upload it to the cloud and put the link here).",
      type: "text",
      required: false,
    },
    {
      id: "writeup",
      label: "Comprehensive Report on your Crusade",
      description: "Please provide a detailed report outlining all activities carried out before, during, and after the crusade. This should include information on preparations made, the execution of the crusade itself, and post-crusade follow-up or impact, where applicable. You can type your report here or upload it as a Word Document or PDF.",
      type: "textarea",
      required: false,
      hasFileUpload: true,
    },
    {
      id: "writeup_file",
      label: "Upload Comprehensive Report (PDF or Word Document)",
      type: "file",
      accept: ".pdf,.doc,.docx",
      required: false,
      hidden: true,
    },
    {
      id: "other_comments",
      label: "Other Comments",
      type: "textarea",
      required: false,
    },
  ],
};

// Helper function to create step 3
const createStep3 = (): StepConfig => ({
  step: 3,
  questions: [
    {
      id: "crusade_name",
      label: "Name of Crusade",
      type: "text",
      required: true,
    },
    {
      id: "crusade_date",
      label: "Date of Crusade",
      type: "text",
      required: true,
    },
    {
      id: "crusade_category",
      label: "Category of Crusades",
      type: "select",
      options: [
        "Special Crusades",
        "Online",
        "Orphanage",
        "School",
        "Community",
        "Prison",
        "Street",
        "Market",
        "Transport",
        "Medical",
        "Birthday",
        "Worship",
      ],
      required: true,
      conditional: {
        field: "crusade_category",
        value: "Special Crusades",
        questions: [
          {
            id: "special_crusade_type",
            label: "What Type of Special Crusade?",
            type: "select",
            options: [
              "Celebrating 1000 days with Pastor Chris live Unending Praise",
              "Praise Night with Pastor Chris",
            ],
            required: true,
            conditional: {
              field: "special_crusade_type",
              value: "Praise Night with Pastor Chris",
              questions: [
                {
                  id: "praise_night_type",
                  label: "Which Praise Night edition?",
                  type: "select",
                  options: [
                    "Praise Night '24",
                    "Praise Night '25",
                  ],
                  required: true,
                },
              ],
            },
          },
        ],
      },
    },
  ],
});


export default function TestForm() {
  const [memberType, setMemberType] = useState<MemberType>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({ memberType: null });
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // Build dynamic form config with crusades
  const getFormConfigs = (): FormConfigs => {
    const step3 = createStep3();
    
    return {
      "christ-embassy": [
        step2ChristEmbassy,
        step3,
        commonStep4,
        commonStep5,
      ],
      "ism-reon": [
        step2IsmReonOthers,
        step3,
        commonStep4,
        commonStep5,
      ],
      "others": [
        step2IsmReonOthers,
        step3,
        commonStep4,
        commonStep5,
      ],
    };
  };

  const handleMemberTypeSelect = (type: MemberType) => {
    setMemberType(type);
    setFormData({ ...formData, memberType: type });
  };

  // Recursive function to clear nested conditional questions
  const clearNestedConditionals = (questions: ConditionalQuestion[], newFormData: any, newExpanded: Set<string>) => {
    questions.forEach((cq: ConditionalQuestion) => {
      delete newFormData[cq.id];
      newExpanded.delete(cq.id);
      // If this conditional question has its own conditionals, clear those too
      if (cq.conditional) {
        if (cq.conditional.branches) {
          cq.conditional.branches.forEach((branch: { value: string; questions: ConditionalQuestion[] }) => {
            clearNestedConditionals(branch.questions, newFormData, newExpanded);
          });
        } else {
          clearNestedConditionals(cq.conditional.questions, newFormData, newExpanded);
        }
      }
    });
  };

  const handleInputChange = (id: string, value: any) => {
    const newFormData = { ...formData, [id]: value };
    
    // Handle conditional questions - check if this change affects any conditional questions
    if (memberType) {
      const newExpanded = new Set(expandedQuestions);
      const config: StepConfig[] = getFormConfigs()[memberType];
      
      config.forEach((stepConfig: StepConfig) => {
        stepConfig.questions.forEach((question: Question) => {
          if (question.conditional && question.conditional.field === id) {
            // Check if there are branches (multiple conditional paths)
            if (question.conditional.branches) {
              // Always clear all branch question data first when value changes (including nested)
              question.conditional.branches.forEach((branch) => {
                clearNestedConditionals(branch.questions, newFormData, newExpanded);
              });
              
              // Then check if new value matches any branch
              const hasMatchingBranch = question.conditional.branches.some(
                (branch) => branch.value === value
              );
              if (hasMatchingBranch) {
                newExpanded.add(question.id);
              } else {
                newExpanded.delete(question.id);
              }
            } else {
              // Original single conditional logic
              if (value === question.conditional.value) {
                newExpanded.add(question.id);
              } else {
                newExpanded.delete(question.id);
                // Clear conditional question data (including nested)
                clearNestedConditionals(question.conditional.questions, newFormData, newExpanded);
              }
            }
          }
        });
      });
      
      setExpandedQuestions(newExpanded);
    }
    
    setFormData(newFormData);
  };

  // Check if a question should show its conditional questions
  const shouldShowConditional = (question: Question) => {
    if (!question.conditional) return false;
    const fieldValue = formData[question.conditional.field];
    
    // Check if there are branches (multiple conditional paths)
    if (question.conditional.branches) {
      return question.conditional.branches.some(
        (branch) => branch.value === fieldValue
      );
    }
    
    // Original single conditional logic
    return fieldValue === question.conditional.value;
  };

  // Get the active branch questions for a question with branches
  const getActiveBranchQuestions = (question: Question): ConditionalQuestion[] => {
    if (!question.conditional || !question.conditional.branches) return [];
    const fieldValue = formData[question.conditional.field];
    const activeBranch = question.conditional.branches.find(
      (branch) => branch.value === fieldValue
    );
    return activeBranch ? activeBranch.questions : [];
  };

  const getCurrentQuestions = (): Question[] => {
    if (!memberType || currentStep === 1) return [];
    const config: StepConfig[] = getFormConfigs()[memberType];
    const stepConfig = config.find((s: StepConfig) => s.step === currentStep);
    return stepConfig ? stepConfig.questions : [];
  };

  // Recursive function to check if all required conditional questions are filled
  const checkConditionalQuestions = (questions: ConditionalQuestion[]): boolean => {
    return questions.every((cq: ConditionalQuestion) => {
      if (cq.required && !formData[cq.id]) return false;
      // Check nested conditionals if they exist
      if (cq.conditional) {
        const fieldValue = formData[cq.conditional.field];
        if (cq.conditional.branches) {
          const activeBranch = cq.conditional.branches.find(
            (branch: { value: string; questions: ConditionalQuestion[] }) => branch.value === fieldValue
          );
          if (activeBranch) {
            return checkConditionalQuestions(activeBranch.questions);
          }
        } else if (fieldValue === cq.conditional.value) {
          return checkConditionalQuestions(cq.conditional.questions);
        }
      }
      return true;
    });
  };

  const canProceedToNext = () => {
    if (currentStep === 1) return memberType !== null;
    
    const questions = getCurrentQuestions();
    return questions.every((q: Question) => {
      if (q.required && !formData[q.id]) return false;
      if (q.conditional && shouldShowConditional(q)) {
        // Check branch questions if branches exist
        if (q.conditional.branches) {
          const activeBranchQuestions = getActiveBranchQuestions(q);
          return checkConditionalQuestions(activeBranchQuestions);
        }
        // Original single conditional logic
        return checkConditionalQuestions(q.conditional.questions);
      }
      return true;
    });
  };

  const handleNext = () => {
    if (currentStep === 1 && memberType) {
      setCurrentStep(2);
    } else if (memberType) {
      const config = getFormConfigs()[memberType];
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

  const renderQuestion = (question: Question | ConditionalQuestion) => {
    const value = formData[question.id] || "";
    
    // Use number input for attendance metrics
    const isNumberField = ["total_attendance", "new_converts", "first_timers", "cells"].includes(question.id);

    switch (question.type) {
      case "text":
        return (
          <input
            type={isNumberField ? "number" : "text"}
            id={question.id}
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="border border-gray-300 rounded-full px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#54037C]"
            required={question.required}
            min={isNumberField ? "0" : undefined}
          />
        );
      case "textarea":
        if (question.hasFileUpload) {
          const fileInputId = `${question.id}_file`;
          return (
            <div className="relative">
              <textarea
                id={question.id}
                value={value}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                rows={4}
                className="border border-gray-300 rounded-lg px-3 py-2 pr-12 w-full focus:outline-none focus:ring-2 focus:ring-[#54037C] resize-none"
                required={question.required}
              />
              <label
                htmlFor={fileInputId}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#54037C] hover:text-[#54037C]/80 transition-colors"
                title="Upload PDF or Word Document"
              >
                <Upload size={20} />
              </label>
              <input
                type="file"
                id={fileInputId}
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleInputChange('writeup_file', file.name);
                  }
                }}
                className="hidden"
              />
              {formData['writeup_file'] && (
                <p className="mt-2 text-sm text-gray-600">File selected: {formData['writeup_file']}</p>
              )}
            </div>
          );
        }
        return (
          <textarea
            id={question.id}
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            rows={4}
            className="border border-gray-300 rounded-full px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#54037C] resize-none"
            required={question.required}
          />
        );
      case "select":
        return (
          <select
            id={question.id}
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="border border-gray-300 rounded-full px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#54037C]"
            required={question.required}
          >
            <option value="">Select an option</option>
            {question.options?.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="flex flex-col gap-3">
            {question.options?.map((opt: string) => (
              <label
                key={opt}
                className={`flex items-center gap-3 cursor-pointer p-3 rounded-full border-2 transition-all ${
                  value === opt
                    ? "border-[#54037C] bg-[#54037C]/10"
                    : "border-gray-300 hover:border-[#54037C]/50 bg-white"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name={question.id}
                    value={opt}
                    checked={value === opt}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    className="sr-only"
                    required={question.required}
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      value === opt
                        ? "border-[#54037C] bg-[#54037C]"
                        : "border-gray-400 bg-white"
                    }`}
                  >
                    {value === opt && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className="text-gray-800 font-medium">{opt}</span>
              </label>
            ))}
          </div>
        );
      case "file":
        return (
          <div>
            <input
              type="file"
              id={question.id}
              accept={question.accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleInputChange(question.id, file.name);
                } else {
                  handleInputChange(question.id, "");
                }
              }}
              className="border border-gray-300 rounded-full px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#54037C] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#54037C] file:text-white hover:file:bg-[#54037C]/90"
              required={question.required}
            />
            {value && (
              <p className="mt-2 text-sm text-gray-600">Selected: {value}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f4ea] pt-24 pb-12 px-4">
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
            Step {currentStep} of {memberType ? (getFormConfigs()[memberType].length + 1) : 1}
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
                    className={`w-full p-4 rounded-full border-2 text-left transition-all flex items-center justify-between ${
                      memberType === option.value
                        ? "border-purple-600 bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                        : "border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100 text-purple-700"
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                    {memberType === option.value && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
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
                {getCurrentQuestions()
                  .filter((question) => !question.hidden)
                  .map((question) => (
                  <div key={question.id} className="space-y-2">
                    <label
                      htmlFor={question.id}
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {question.label}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {question.description && (
                      <p className="text-xs text-gray-600 mb-2 italic">
                        {question.description}
                      </p>
                    )}
                    {question.id === "phone_number" && (
                      <p className="text-xs text-gray-500 mb-1">
                        If you submit on behalf of your group, input your phone number
                      </p>
                    )}
                    {question.id === "kingschat_username" && (
                      <p className="text-xs text-gray-500 mb-1">
                        If you submit on behalf of group, input your KingsChat username
                      </p>
                    )}
                    {question.id === "crusade_date" ? (
                      <input
                        type="date"
                        id={question.id}
                        value={formData[question.id] || ""}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        className="border border-gray-300 rounded-full px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#54037C]"
                        required={question.required}
                      />
                    ) : (
                      renderQuestion(question)
                    )}
                    {question.id === "kingschat_username" && (
                      <a
                        href="https://kingsch.at"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#54037C] hover:underline inline-block mt-1"
                      >
                        Don't have a KingsChat account? Create one here →
                      </a>
                    )}

                    {/* Conditional Questions */}
                    {question.conditional &&
                      shouldShowConditional(question) &&
                      (question.conditional.branches
                        ? getActiveBranchQuestions(question)
                        : question.conditional.questions
                      ).map((cq: ConditionalQuestion) => {
                        const shouldShowNested = cq.conditional && (() => {
                          const fieldValue = formData[cq.conditional!.field];
                          if (cq.conditional!.branches) {
                            return cq.conditional!.branches.some(
                              (branch: { value: string; questions: ConditionalQuestion[] }) => branch.value === fieldValue
                            );
                          }
                          return fieldValue === cq.conditional!.value;
                        })();
                        
                        const getNestedQuestions = (): ConditionalQuestion[] => {
                          if (!cq.conditional || !shouldShowNested) return [];
                          if (cq.conditional.branches) {
                            const fieldValue = formData[cq.conditional.field];
                            const activeBranch = cq.conditional.branches.find(
                              (branch: { value: string; questions: ConditionalQuestion[] }) => branch.value === fieldValue
                            );
                            return activeBranch ? activeBranch.questions : [];
                          }
                          return cq.conditional.questions;
                        };
                        
                        return (
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
                            {/* Nested Conditional Questions */}
                            {shouldShowNested && getNestedQuestions().map((nestedCq: ConditionalQuestion) => (
                              <motion.div
                                key={nestedCq.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-4 ml-4 pl-4 border-l-2 border-[#54037C]/70"
                              >
                                <label
                                  htmlFor={nestedCq.id}
                                  className="block text-sm font-semibold text-gray-700"
                                >
                                  {nestedCq.label}
                                  {nestedCq.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                {renderQuestion(nestedCq)}
                              </motion.div>
                            ))}
                          </motion.div>
                        );
                      })}
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
                className="px-6 py-2 border-2 border-gray-300 rounded-full text-gray-700 hover:border-gray-400 transition"
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
                      className="px-6 py-2 bg-[#54037C] text-white rounded-full hover:bg-[#54037C]/90 transition font-semibold"
                    >
                      {currentStep === Math.max(...getFormConfigs()[memberType].map((c) => c.step))
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

