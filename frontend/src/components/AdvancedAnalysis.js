import React from 'react';

const AdvancedAnalysis = ({ advancedAnalysis = {} }) => {
    // Always render the component to prevent tree-shaking
    return (
        <div className="advanced-analysis-section">
            <div className="section-title">🔍 Advanced AI Analysis</div>
            
            {!advancedAnalysis || Object.keys(advancedAnalysis).length === 0 ? (
                <div className="no-data">No advanced analysis data available</div>
            ) : (
                <div className="advanced-content">
                    {/* Job Level */}
                    {advancedAnalysis.job_level && (
                        <div className="analysis-item">
                            <strong>Job Level:</strong> {advancedAnalysis.job_level}
                        </div>
                    )}
                    
                    {/* Processing Time */}
                    {advancedAnalysis.processing_time && (
                        <div className="analysis-item">
                            <strong>Processing Time:</strong> {advancedAnalysis.processing_time}s
                        </div>
                    )}
                    
                    {/* Experience Education Ratio */}
                    {advancedAnalysis.experience_education_ratio && (
                        <div className="analysis-item">
                            <strong>Experience/Education Ratio:</strong> {advancedAnalysis.experience_education_ratio}
                        </div>
                    )}
                    
                    {/* Detailed Reasoning */}
                    {advancedAnalysis.detailed_reasoning && (
                        <div className="analysis-item">
                            <strong>Detailed Analysis:</strong>
                            <div className="reasoning-content">
                                {typeof advancedAnalysis.detailed_reasoning === 'string' 
                                    ? advancedAnalysis.detailed_reasoning
                                    : JSON.stringify(advancedAnalysis.detailed_reasoning, null, 2)
                                }
                            </div>
                        </div>
                    )}
                    
                    {/* Section Weights Comments */}
                    {advancedAnalysis.section_weights && (
                        <div className="analysis-item">
                            <strong>Section Analysis:</strong>
                            <div className="section-content">
                                {typeof advancedAnalysis.section_weights === 'string' 
                                    ? advancedAnalysis.section_weights
                                    : JSON.stringify(advancedAnalysis.section_weights, null, 2)
                                }
                            </div>
                        </div>
                    )}
                    
                    {/* Subfield Scores Comments */}
                    {advancedAnalysis.subfield_scores && (
                        <div className="analysis-item">
                            <strong>Detailed Scoring:</strong>
                            <div className="subfield-content">
                                {typeof advancedAnalysis.subfield_scores === 'string' 
                                    ? advancedAnalysis.subfield_scores
                                    : JSON.stringify(advancedAnalysis.subfield_scores, null, 2)
                                }
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdvancedAnalysis;
