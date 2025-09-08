import React from 'react';

const AdvancedAnalysis = ({ advancedAnalysis = {} }) => {
    // Extract overall comment and call callback if provided
    React.useEffect(() => {
        if (advancedAnalysis.detailed_reasoning && typeof advancedAnalysis.detailed_reasoning === "object") {
            const overallCommentKey = Object.keys(advancedAnalysis.detailed_reasoning).find(key => 
                key === "overall_comment"
            );
            if (overallCommentKey) {
                const overallData = advancedAnalysis.detailed_reasoning[overallCommentKey];
                let overallCommentContent = null;
                if (typeof overallData === "object" && (overallData.overall_comment || overallData.comment)) {
                    overallCommentContent = (overallData.overall_comment || overallData.comment);
                } else if (typeof overallData === "string") {
                    overallCommentContent = overallData;
                }
                if (overallCommentContent && window.setOverallComment) {
                    window.setOverallComment(overallCommentContent);
                }
            }
        }
    }, [advancedAnalysis.detailed_reasoning]);
    // Helper functions
    const formatDetailedReasoning = (reasoning) => {
        // Filter out Overall comment section from display
        const filteredReasoning = { ...reasoning };
        if (filteredReasoning) {
            const overallCommentKey = Object.keys(filteredReasoning).find(key => 
                key === "overall_comment"
            );
            if (overallCommentKey) {
                delete filteredReasoning[overallCommentKey];
            }
        }
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
                {Object.entries(filteredReasoning || parsedReasoning).map(([section, data]) => (
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
        if (!subfieldScores || typeof subfieldScores !== "object") return null;

        // Helper function to get circle style based on score
        const getCircleStyle = (score) => {
            let gradient, opacity;
            
            if (score >= 1.5) {
                // Green range: 1.5-2.0
                gradient = "linear-gradient(135deg, #4ade80, #22c55e)";
                opacity = 0.6 + ((score - 1.5) / 0.5) * 0.4; // 0.6 to 1.0
            } else if (score >= 1.0) {
                // Yellow range: 1.0-1.4
                gradient = "linear-gradient(135deg, #fbbf24, #f59e0b)";
                opacity = 0.6 + ((score - 1.0) / 0.4) * 0.4; // 0.6 to 1.0
            } else {
                // Red range: 0.0-0.9
                gradient = "linear-gradient(135deg, #f87171, #ef4444)";
                opacity = 0.6 + (score / 0.9) * 0.4; // 0.6 to 1.0
            }
            
            return { 
                background: gradient, 
                opacity: Math.min(Math.max(opacity, 0.6), 1.0)
            };
        };

        // Generate separate tables for each section
        return (
            <div className="subfield-scores-tables">
                {Object.entries(subfieldScores).map(([section, data]) => {
                    if (!data || typeof data !== "object") return null;
                    
                    // Get numeric scores only
                    const numericScores = Object.entries(data).filter(([field, value]) => 
                        field !== "comment" && field !== "cross_section_analysis" && typeof value === "number"
                    );
                    
                    if (numericScores.length === 0) return null;
                    
                    return (
                        <div key={section} className="subfield-section-table">
                            <h4 className="subfield-section-title">
                                {section.charAt(0).toUpperCase() + section.slice(1).replace(/_/g, " ")}
                            </h4>
                            <div className="subfield-table-container">
                                <table className="subfield-table">
                                    <thead>
                                        <tr>
                                            {numericScores.map(([field, value]) => (
                                                <th key={field} className="subfield-header">
                                                    {field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {numericScores.map(([field, value]) => {
                                                const circleStyle = getCircleStyle(value);
                                                return (
                                                    <td key={field} className="subfield-cell">
                                                        <div 
                                                            className="subfield-score-circle" 
                                                            style={circleStyle}
                                                            title={`${value}/2.0`}
                                                        >
                                                            <span className="subfield-score-text">{value}</span>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
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



    return (
        <div className="advanced-analysis-section">
            <div className="section-title">🔍 Advanced AI Analysis</div>
            
            {!advancedAnalysis || Object.keys(advancedAnalysis).length === 0 ? (
                <div className="no-data">No advanced analysis data available</div>
            ) : (
                <div className="advanced-content">

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
