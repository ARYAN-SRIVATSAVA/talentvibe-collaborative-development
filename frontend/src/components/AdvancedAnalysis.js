import React from 'react';

const AdvancedAnalysis = ({ advancedAnalysis = {} }) => {
    // Helper function to format detailed reasoning
    const formatDetailedReasoning = (reasoning) => {
        if (!reasoning) return null;
        
        // If it's a string, try to parse it as JSON
        let parsedReasoning;
        if (typeof reasoning === 'string') {
            try {
                parsedReasoning = JSON.parse(reasoning);
            } catch (e) {
                return <div className="reasoning-text">{reasoning}</div>;
            }
        } else {
            parsedReasoning = reasoning;
        }
        
        if (!parsedReasoning || typeof parsedReasoning !== 'object') {
            return <div className="reasoning-text">{reasoning}</div>;
        }
        
        return (
            <div className="detailed-reasoning">
                {Object.entries(parsedReasoning).map(([section, data]) => (
                    <div key={section} className="reasoning-section">
                        <h4 className="section-header">
                            {section.charAt(0).toUpperCase() + section.slice(1).replace(/_/g, ' ')}
                        </h4>
                        
                        {/* Main comment */}
                        {typeof data === 'object' && data.comment ? (
                            <div className="section-comment">{data.comment}</div>
                        ) : typeof data === 'string' ? (
                            <div className="section-comment">{data}</div>
                        ) : (
                            <div className="section-comment">{JSON.stringify(data, null, 2)}</div>
                        )}
                        
                        {/* Cross-section analysis */}
                        {typeof data === 'object' && data.cross_section_analysis && (
                            <div className="cross-section-analysis">
                                <h5 className="cross-section-header">🔍 Cross-Section Analysis</h5>
                                <div className="cross-section-content">{data.cross_section_analysis}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Helper function to format processing time
    const formatProcessingTime = (time) => {
        if (!time) return 'N/A';
        return `${parseFloat(time).toFixed(1)}s`;
    };

    // Helper function to format job level
    const formatJobLevel = (level) => {
        if (!level) return 'N/A';
        return level.charAt(0).toUpperCase() + level.slice(1);
    };

    return (
        <div className="advanced-analysis-section">
            <div className="section-title">🔍 Advanced AI Analysis</div>
            
            {!advancedAnalysis || Object.keys(advancedAnalysis).length === 0 ? (
                <div className="no-data">No advanced analysis data available</div>
            ) : (
                <div className="advanced-content">
                    {/* Summary Information */}
                    <div className="analysis-summary">
                        <div className="summary-item">
                            <span className="summary-label">Job Level:</span>
                            <span className="summary-value">{formatJobLevel(advancedAnalysis.job_level)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Processing Time:</span>
                            <span className="summary-value">{formatProcessingTime(advancedAnalysis.processing_time)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Experience/Education Ratio:</span>
                            <span className="summary-value">{advancedAnalysis.experience_education_ratio || 'N/A'}</span>
                        </div>
                    </div>
                    
                    {/* Detailed Analysis */}
                    {advancedAnalysis.detailed_reasoning && (
                        <div className="analysis-item">
                            <h3 className="analysis-subtitle">📊 Detailed Analysis</h3>
                            {formatDetailedReasoning(advancedAnalysis.detailed_reasoning)}
                        </div>
                    )}
                    
                    {/* Overall Assessment */}
                    {advancedAnalysis.overall_assessment && (
                        <div className="analysis-item">
                            <h3 className="analysis-subtitle">🎯 Overall Assessment</h3>
                            <div className="overall-assessment">
                                {typeof advancedAnalysis.overall_assessment === 'string' 
                                    ? advancedAnalysis.overall_assessment
                                    : JSON.stringify(advancedAnalysis.overall_assessment, null, 2)
                                }
                            </div>
                        </div>
                    )}
                    
                    {/* Candidate Experience */}
                    {advancedAnalysis.candidate_experience && (
                        <div className="analysis-item">
                            <h3 className="analysis-subtitle">👤 Candidate Experience</h3>
                            <div className="candidate-experience">
                                {typeof advancedAnalysis.candidate_experience === 'string' 
                                    ? advancedAnalysis.candidate_experience
                                    : JSON.stringify(advancedAnalysis.candidate_experience, null, 2)
                                }
                            </div>
                        </div>
                    )}
                    
                    {/* Job Requirements */}
                    {advancedAnalysis.job_requirements && (
                        <div className="analysis-item">
                            <h3 className="analysis-subtitle">📋 Job Requirements</h3>
                            <div className="job-requirements">
                                {typeof advancedAnalysis.job_requirements === 'string' 
                                    ? advancedAnalysis.job_requirements
                                    : JSON.stringify(advancedAnalysis.job_requirements, null, 2)
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
