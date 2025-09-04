import React from 'react';
// Advanced Analysis Component for JobDetailsPage.js
const AdvancedAnalysis = ({ advancedAnalysis }) => {
    if (!advancedAnalysis) return null;

    return (
        <div className="advanced-analysis-section">
            <div className="section-title">🔍 Advanced AI Analysis</div>
            
            {/* Job Level & Experience Summary */}
            <div className="analysis-summary">
                <div className="summary-item">
                    <strong>Job Level:</strong> {advancedAnalysis.job_level}
                </div>
                <div className="summary-item">
                    <strong>Experience Ratio:</strong> {advancedAnalysis.experience_education_ratio}
                </div>
                <div className="summary-item">
                    <strong>Processing Time:</strong> {advancedAnalysis.processing_time}s
                </div>
            </div>
            
            {/* Overall Assessment */}
            {advancedAnalysis.overall_assessment && (
                <div className="overall-assessment">
                    <h4>📊 Overall Assessment</h4>
                    
                    {advancedAnalysis.overall_assessment.strengths && advancedAnalysis.overall_assessment.strengths.length > 0 && (
                        <div className="strengths-section">
                            <h5>✅ Key Strengths</h5>
                            <ul>
                                {advancedAnalysis.overall_assessment.strengths.map((strength, index) => (
                                    <li key={index}>{strength}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {advancedAnalysis.overall_assessment.areas_for_improvement && advancedAnalysis.overall_assessment.areas_for_improvement.length > 0 && (
                        <div className="improvement-section">
                            <h5>⚠️ Areas for Improvement</h5>
                            <ul>
                                {advancedAnalysis.overall_assessment.areas_for_improvement.map((area, index) => (
                                    <li key={index}>{area}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {advancedAnalysis.overall_assessment.cultural_fit && (
                        <div className="cultural-fit">
                            <h5>🤝 Cultural Fit</h5>
                            <p>{advancedAnalysis.overall_assessment.cultural_fit}</p>
                        </div>
                    )}
                    
                    {advancedAnalysis.overall_assessment.growth_potential && (
                        <div className="growth-potential">
                            <h5>📈 Growth Potential</h5>
                            <p>{advancedAnalysis.overall_assessment.growth_potential}</p>
                        </div>
                    )}
                </div>
            )}
            
            {/* Detailed Section Analysis */}
            {advancedAnalysis.detailed_reasoning && (
                <div className="detailed-analysis">
                    <h4>🎯 Detailed Analysis by Section</h4>
                    {Object.entries(advancedAnalysis.detailed_reasoning).map(([section, subfields]) => (
                        <div key={section} className="section-analysis">
                            <h5>{section.charAt(0).toUpperCase() + section.slice(1).replace('_', ' ')}</h5>
                            <div className="subfield-comments">
                                {Object.entries(subfields).map(([subfield, comment]) => (
                                    <div key={subfield} className="comment-item">
                                        <div className="comment-label">{subfield.replace(/_/g, ' ')}</div>
                                        <div className="comment-text">{comment}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Experience & Requirements Analysis */}
            {(advancedAnalysis.candidate_experience || advancedAnalysis.job_requirements) && (
                <div className="experience-analysis">
                    <h4>💼 Experience & Requirements Analysis</h4>
                    
                    {advancedAnalysis.candidate_experience && (
                        <div className="candidate-experience">
                            <h5>Candidate Experience</h5>
                            {Object.entries(advancedAnalysis.candidate_experience).map(([key, value]) => (
                                <p key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {value}</p>
                            ))}
                        </div>
                    )}
                    
                    {advancedAnalysis.job_requirements && (
                        <div className="job-requirements">
                            <h5>Job Requirements Match</h5>
                            {Object.entries(advancedAnalysis.job_requirements).map(([key, value]) => (
                                <p key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {value}</p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdvancedAnalysis;
