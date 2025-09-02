import React from 'react';

const ResumeProgressBar = ({ isVisible, totalResumes, isAnalyzing }) => {
    if (!isVisible) return null;

    return (
        <div className="resume-progress-bar-container">
            <div className="progress-bar-header">
                <h4>Processing Progress</h4>
                <span className="progress-status">
                    {isAnalyzing ? 'Processing...' : 'Complete'}
                </span>
            </div>
            
            <div className="progress-bar-wrapper">
                <div className="progress-bar">
                    <div 
                        className="progress-fill"
                        style={{ 
                            width: isAnalyzing ? '60%' : '100%',
                            animation: isAnalyzing ? 'progress-pulse 2s infinite' : 'none'
                        }}
                    ></div>
                </div>
                <div className="progress-text">
                    {isAnalyzing ? (
                        <span>Processing {totalResumes} resume{totalResumes !== 1 ? 's' : ''}...</span>
                    ) : (
                        <span>All {totalResumes} resume{totalResumes !== 1 ? 's' : ''} processed!</span>
                    )}
                </div>
            </div>
            
            {isAnalyzing && (
                <div className="processing-tips">
                    <p>💡 Processing may take a few minutes for large files</p>
                    <p>📊 You'll be redirected to results when complete</p>
                </div>
            )}
        </div>
    );
};

export default ResumeProgressBar;
