import React from "react";
import AdvancedAnalysis from "./src/components/AdvancedAnalysis";

const testData = {
  job_level: "mid",
  experience_education_ratio: 0.8,
  processing_time: 2.5,
  detailed_reasoning: {
    education: { degree: "Good education background" },
    experience: { years: "Strong experience" }
  },
  overall_assessment: {
    strengths: ["Good skills"],
    areas_for_improvement: ["Could improve"]
  }
};

console.log("AdvancedAnalysis component:", AdvancedAnalysis);
console.log("Test data:", testData);
