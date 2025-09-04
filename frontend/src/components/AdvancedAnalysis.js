import React from 'react';

const AdvancedAnalysis = ({ advancedAnalysis = {} }) => {
    // Helper functions
    const formatDetailedReasoning = (reasoning) => {
        if (!reasoning) return null;
        
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
                        
                        {typeof data === 'object' && data.comment ? (
                            <div className="section-comment">{data.comment}</div>
                        ) : typeof data === 'string' ? (
                            <div className="section-comment">{data}</div>
                        ) : (
                            <div className="section-comment">{JSON.stringify(data, null, 2)}</div>
                        )}
                        
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

    const formatSectionWeights = (sectionWeights) => {
        if (!sectionWeights || typeof sectionWeights !== 'object') return null;
        
        return (
            <div className="section-weights">
                {Object.entries(sectionWeights).map(([section, weight]) => (
                    <div key={section} className="weight-item">
                        <span className="weight-section">{section.charAt(0).toUpperCase() + section.slice(1)}:</span>
                        <span className="weight-value">{(parseFloat(weight) * 100).toFixed(1)}%</span>
                        <div className="weight-bar">
                            <div 
                                className="weight-fill" 
                                style={{ width: `${parseFloat(weight) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const formatSubfieldScores = (subfieldScores) => {
        if (!subfieldScores || typeof subfieldScores !== 'object') return null;
        
        return (
            <div className="subfield-scores">
                {Object.entries(subfieldScores).map(([section, data]) => {
                    // Skip sections that are empty or only contain comments
                    if (!data || typeof data !== 'object') return null;
                    
                    // Check if section has any numeric scores (not just comments)
                    const hasNumericScores = Object.entries(data).some(([field, value]) => 
                        field !== 'comment' && field !== 'cross_section_analysis' && typeof value === 'number'
                    );
                    
                    if (!hasNumericScores) return null;
                    
                    return (
                        <div key={section} className="subfield-section">
                            <h4 className="subfield-header">
                                {section.charAt(0).toUpperCase() + section.slice(1)}
                            </h4>
                            <div className="subfield-items">
                                {Object.entries(data).map(([field, value]) => {
                                    if (field === 'comment' || field === 'cross_section_analysis') return null;
                                    if (typeof value === 'number') {
                                        return (
                                            <div key={field} className="subfield-item">
                                                <span className="subfield-name">{field.replace(/_/g, ' ')}:</span>
                                                <span className="subfield-score">{value}/2</span>
                                                <div className="score-bar">
                                                    <div 
                                                        className="score-fill" 
                                                        style={{ width: `${(value / 2) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const formatFinalScore = (finalScoreDetails) => {
        if (!finalScoreDetails || typeof finalScoreDetails !== 'object') return null;
        
        return (
            <div className="final-score-details">
                <div className="final-score-main">
                    <div className="score-circle">
                        <span className="score-number">{finalScoreDetails.final_weighted_score || 'N/A'}</span>
                        <span className="score-label">/ 100</span>
                    </div>
                </div>
                
                {finalScoreDetails.section_scores && (
                    <div className="section-scores">
                        <h4>Section Scores:</h4>
                        {Object.entries(finalScoreDetails.section_scores).map(([section, score]) => (
                            <div key={section} className="section-score-item">
                                <span className="section-name">{section.charAt(0).toUpperCase() + section.slice(1)}:</span>
                                <span className="section-score">{parseFloat(score).toFixed(2)}/2</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {finalScoreDetails.explanation && (
                    <div className="score-explanation">
                        <p>{finalScoreDetails.explanation}</p>
                    </div>
                )}
            </div>
        );
    };

    const formatProcessingTime = (time) => {
        if (!time) return 'N/A';
        return `${parseFloat(time).toFixed(1)}s`;
    };

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

                    {/* Phase 3: Final Score */}
                    {advancedAnalysis.final_score_details && (
                        <div className="analysis-item">
                            <h3 className="analysis-subtitle">🏆 Phase 3: Final Score</h3>
                            {formatFinalScore(advancedAnalysis.final_score_details)}
                        </div>
                    )}

                    {/* Phase 1: Section Weights */}
                    {advancedAnalysis.section_weights && (
                        <div className="analysis-item">
                            <h3 className="analysis-subtitle">⚖️ Phase 1: Section Weights</h3>
                            {formatSectionWeights(advancedAnalysis.section_weights)}
                        </div>
                    )}

                    {/* Phase 2: Subfield Scores */}
                    {advancedAnalysis.subfield_scores && (
                        <div className="analysis-item">
                            <h3 className="analysis-subtitle">📊 Phase 2: Subfield Scores</h3>
                            {formatSubfieldScores(advancedAnalysis.subfield_scores)}
                        </div>
                    )}
                    
                    {/* Detailed Analysis */}
                    {advancedAnalysis.detailed_reasoning && (
                        <div className="analysis-item">
                            <h3 className="analysis-subtitle">💬 Detailed Comments & Reasoning</h3>
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
                </div>
            )}
        </div>
    );
};

export default AdvancedAnalysis;
