import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import FeedbackModal from './components/FeedbackModal';
import InterviewModal from './components/InterviewModal';
import AdvancedAnalysis from './components/AdvancedAnalysis';
import './JobsPage.css';


const generateWeightedSummary = (selectedResume, advancedAnalysis) => {
    const overallComment = selectedResume.analysis?.reasoning || "No analysis available";
    const sectionWeights = advancedAnalysis?.section_weights || {};
    const overallAssessment = advancedAnalysis?.overall_assessment || {};
    
    // Get sections with non-zero weights
    const weightedSections = Object.entries(sectionWeights)
        .filter(([section, weight]) => weight > 0)
        .sort(([,a], [,b]) => b - a); // Sort by weight descending
    
    // Build strengths and shortfalls
    const strengths = overallAssessment.strengths || [];
    const shortfalls = overallAssessment.Shortfall_Areas || [];
    
    // Create section-specific insights
    const sectionInsights = weightedSections.map(([section, weight]) => {
        const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
        return `${sectionName} (${weight}% weight)`;
    }).join(", ");
    
    // Build the summary
    let summary = overallComment;
    
    if (strengths.length > 0) {
        summary += ` The candidate demonstrates ${strengths.slice(0, 2).join(" and ")}.`;
    }
    
    if (sectionInsights) {
        summary += ` Key focus areas based on job requirements include ${sectionInsights}.`;
    }
    
    if (shortfalls.length > 0) {
        summary += ` However, ${shortfalls.slice(0, 1).join(" and ")} represent areas for development.`;
    }
    
    return summary;
};
const SkillMatrix = ({ skills }) => (
    <div className="skill-matrix">
        <div className="skill-column matches">
            <h4>✅ Matches ({skills.matches?.length || 0})</h4>
            <ul>
                {skills.matches?.map((skill, i) => <li key={`match-${i}`}>{skill}</li>)}
            </ul>
        </div>
        <div className="skill-column gaps">
            <h4>🚫 Gaps ({skills.gaps?.length || 0})</h4>
            <ul>
                {skills.gaps?.map((skill, i) => <li key={`gap-${i}`}>{skill}</li>)}
            </ul>
        </div>
    </div>
);

const Timeline = ({ timeline }) => (
    <div className="timeline">
        <h4>Timeline & Impact</h4>
        <ul>
            {timeline?.map((item, i) => (
                <li key={`timeline-${i}`}>
                    <strong>{item.period}:</strong> {item.role} - <em>{item.details}</em>
                </li>
            ))}
        </ul>
    </div>
);

const Logistics = ({ logistics }) => (
    <div className="logistics">
        <h4>Comp & Logistics</h4>
        <ul>
            <li><strong>Desired Comp:</strong> {logistics?.compensation || 'N/A'}</li>
            <li><strong>Notice Period:</strong> {logistics?.notice_period || 'N/A'}</li>
            <li><strong>Work Auth:</strong> {logistics?.work_authorization || 'N/A'}</li>
            <li><strong>Location:</strong> {logistics?.location || 'N/A'}</li>
        </ul>
    </div>
);

const InterviewHub = ({ resume, onSchedule, onFeedback }) => {
    const { interview } = resume;

    // A small helper for a consistent "coming soon" alert
    const comingSoon = (feature) => alert(`${feature}: Coming soon!`);

    if (interview) {
        switch (interview.status) {
            case 'scheduled':
            case 'rescheduled':
                return (
                    <div className="interview-hub">
                        <span className="interview-status-text">✅ Interview Scheduled</span>
                        <button className="action-button" onClick={() => onSchedule(resume)}>
                            Reschedule
                        </button>
                        <button className="action-button" onClick={() => comingSoon('Prepare Questions')}>
                            ❓ Prepare Questions
                        </button>
                    </div>
                );
            case 'completed':
                return (
                    <div className="interview-hub">
                       <span className="interview-status-text">⭐ Completed</span>
                       <button className="action-button feedback" onClick={() => onFeedback(resume)}>
                            📝 Log Feedback
                       </button>
                    </div>
                );
            // Add other statuses like 'cancelled' if needed
            default:
                // Fallback for any other status, shows the main schedule button
                break;
        }
    }

    // Default case if no interview object exists or status is not handled above
    return (
        <button 
            className="action-button schedule-interview" 
            onClick={() => onSchedule(resume)}
        >
            <span role="img" aria-label="calendar icon" style={{ marginRight: '8px' }}>🗓️</span>
            Schedule Interview
        </button>
    );
};

const JobDetailsPage = () => {
    const { jobId } = useParams();
    const [jobDetails, setJobDetails] = useState(null);
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(true); // Show progress continuously
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);
    // Removed unused overallComment state
    // Set up callback for overall comment extraction
    React.useEffect(() => {
        // Removed setOverallComment reference
        return () => {
            // Removed setOverallComment cleanup
        };
    }, []);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [selectedResumeForFeedback, setSelectedResumeForFeedback] = useState(null);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [currentInterviewResume, setCurrentInterviewResume] = useState(null);
    const detailsRef = useRef(null);
    const stableCountRef = useRef(0);
    const lastResumeCountRef = useRef(0);

    const fetchJobDetails = useCallback(async () => {
        try {
            const response = await fetch(`/api/jobs/${jobId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Job not found.');
                }
                throw new Error('Failed to fetch job details');
            }
            const data = await response.json();
            
            // Check if resume count is stable
            const currentResumeCount = data.resumes ? data.resumes.length : 0;
            if (currentResumeCount === lastResumeCountRef.current) {
                stableCountRef.current++;
            } else {
                stableCountRef.current = 0;
                lastResumeCountRef.current = currentResumeCount;
            }
            
            setJobDetails(data);
            
            // Auto-select first resume ONLY on initial load, not during auto-refresh
            if (!selectedResumeId && data.resumes && data.resumes.length > 0 && !isAutoRefresh) {
                setSelectedResumeId(data.resumes[0].id);
            }
            
            // Determine if we're still processing
            const totalResumes = data.resumes?.length || 0;
            const analyzedResumes = data.resumes?.filter(r => r.analysis)?.length || 0;
            
            // We're processing if:
            // 1. No resumes yet (might still be processing)
            // 2. Some resumes don't have analysis yet
            const stillProcessing = totalResumes === 0 || analyzedResumes < totalResumes;
            setIsProcessing(stillProcessing);
            
            
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId]);

    useEffect(() => {
        setIsLoading(true);
        fetchJobDetails();
    }, [jobId, fetchJobDetails]);

    // Auto-refresh when processing resumes
    useEffect(() => {
        let interval;
        
        // Continue auto-refresh until we detect processing is complete
        if (jobDetails) {
            interval = setInterval(() => {
                setIsAutoRefresh(true);
            setIsProcessing(true); // Show progress indicator during auto-refresh                // Check current state
                const totalResumes = jobDetails.resumes?.length || 0;
                const analyzedResumes = jobDetails.resumes?.filter(r => r.analysis)?.length || 0;
                
                
                // Continue refreshing if:
                // 1. We have resumes but not all are analyzed
                // 2. We have no resumes yet (might still be processing)
                // 3. We're in the first few seconds after redirect (allow time for processing to start)
                
                const shouldContinue = (
                    stableCountRef.current < 20 || // Keep checking for at least 1 minute (20 * 3s = 60s) for processing to start
                    totalResumes === 0 || // No resumes yet, keep checking
                    analyzedResumes < totalResumes // Some resumes not analyzed yet
                    // Removed time-based condition - stop when all resumes processed
                );
                
                if (shouldContinue) {
                    fetchJobDetails();
                } else {
                    clearInterval(interval);
                    setIsProcessing(false);
                    setIsAnalyzing(false); // Stop showing progress when complete
                    setIsAutoRefresh(false); // Clear auto-refresh flag
                }
            }, 3000); // Poll every 3 seconds
        }
        
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [jobDetails, fetchJobDetails]);

    const sortedResumes = useMemo(() => {
        if (!jobDetails?.resumes) return [];
        return [...jobDetails.resumes].sort((a, b) => (b.analysis?.fit_score || 0) - (a.analysis?.fit_score || 0));
    }, [jobDetails]);

    const selectedResume = useMemo(() => {
        if (!selectedResumeId) return null;
        return sortedResumes.find(r => r.id === selectedResumeId);
    }, [selectedResumeId, sortedResumes]);

    // Scroll to details when a resume is selected
    useEffect(() => {
        if (selectedResumeId && detailsRef.current) {
            detailsRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [selectedResumeId]);

    const handleRowClick = (resumeId) => {
        const newId = selectedResumeId === resumeId ? null : resumeId;
        setSelectedResumeId(newId);
    };


    const handleFeedbackSubmit = () => {
        // Refresh job details to show any updates
        window.location.reload();
    };

    const handleOverrideSubmit = (newBucket) => {
        // Update the local state to reflect the override
        if (selectedResumeForFeedback) {
            const updatedResume = {
                ...selectedResumeForFeedback,
                analysis: {
                    ...selectedResumeForFeedback.analysis,
                    bucket: newBucket
                }
            };
            setSelectedResumeForFeedback(updatedResume);
            
            // Update the job details
            setJobDetails(prev => ({
                ...prev,
                resumes: prev.resumes.map(r => 
                    r.id === selectedResumeForFeedback.id ? updatedResume : r
                )
            }));
        }
    };

    const handleInterviewClick = (resume) => {
        setCurrentInterviewResume(resume);
        setIsInterviewModalOpen(true);
    };

    const handleCloseInterviewModal = () => {
        setIsInterviewModalOpen(false);
        setCurrentInterviewResume(null);
    };

    const handleInterviewCreated = (interviewId) => {
        // We need to refresh the job details to get the new interview status
        setIsInterviewModalOpen(false);
        // Trigger a re-fetch of job details
        fetchJobDetails(); 
    };

    const getScoreClass = (score) => {
        if (score >= 90) return 'high';
        if (score >= 80) return 'medium-high';
        if (score >= 65) return 'medium';
        return 'low';
    };

    if (isLoading) return <div className="job-details-container"><p>Loading job details...</p></div>;
    if (error) return <div className="job-details-container message error">Error: {error}</div>;
    if (!jobDetails) return <div className="job-details-container"><p>Job not found.</p></div>;
    
    // Show processing state when job exists but no resumes yet
    if (isProcessing && (!jobDetails?.resumes || jobDetails.resumes.length === 0)) {
        return (
            <div className="job-details-container">
                <Link to="/jobs" className="back-link">← Back to All Jobs</Link>
                <div className="glass-container processing-status">
                    <div className="processing-content">
                        <div className="spinner">🔄</div>
                        <h2>Processing Resumes</h2>
                        <p>Your resumes are being analyzed in the background.</p>
                        <p>This may take a few minutes. The page will refresh automatically when processing is complete.</p>
                        <div className="processing-details">
                            <p><strong>Job ID:</strong> {jobId}</p>
                            <p><strong>Status:</strong> Processing...</p>
                            <p><strong>Auto-refresh:</strong> Active (every 3 seconds)</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="job-details-container">
            <Link to="/jobs" className="back-link">← Back to All Jobs</Link>
            
            {/* Show continuous progress indicator during analysis */}
            {isAnalyzing && (
                <div className="glass-container processing-progress">
                    <div className="progress-content">
                        <div className="progress-spinner">🔄</div>
                        <h4>Processing Progress</h4>
                        <div className="progress-bar-wrapper">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ 
                                        width: jobDetails?.resumes ? `${(jobDetails.resumes.filter(r => r.analysis).length / jobDetails.resumes.length) * 100}%` : '60%',
                                        animation: 'progress-pulse 2s infinite'
                                    }}
                                ></div>
                            </div>
                            <div className="progress-text">
                                {jobDetails?.resumes ? (
                                    <span>Processing {jobDetails.resumes.filter(r => r.analysis).length}/{jobDetails.resumes.length} resumes...</span>
                                ) : (
                                    <span>Starting analysis...</span>
                                )}
                            </div>
                        </div>
                        <p><em>Auto-refresh active - checking for updates every 3 seconds</em></p>
                        <p><em>Processing will continue until all resumes are analyzed</em></p>
                    </div>
                </div>
            )}
            
            <div className="glass-container job-summary-card">
                <h2>Candidate Overview</h2>
                <div className="candidate-summary-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Candidate</th>
                                <th>Fit Score</th>
                                <th>Bucket</th>
                                <th>Key Skill Hits</th>
                                <th>Gaps / Flags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedResumes.map((resume, index) => (
                                <tr 
                                    key={resume.id} 
                                    onClick={() => handleRowClick(resume.id)}
                                    className={selectedResumeId === resume.id ? 'selected' : ''}
                                >
                                    <td><strong>{index + 1}</strong></td>
                                    <td>{resume.candidate_name || resume.filename}</td>
                                    <td>
                                        <span className={`score-badge ${getScoreClass(resume.analysis?.fit_score)}`}>
                                            {resume.analysis?.fit_score || 'N/A'}
                                        </span>
                                    </td>
                                    <td>{resume.analysis?.bucket || 'N/A'}</td>
                                    <td>{resume.analysis?.skill_matrix?.matches?.join(', ') || 'N/A'}</td>
                                    <td>{resume.analysis?.skill_matrix?.gaps?.join(', ') || 'None'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedResume && (
                <div className="detailed-analysis-section" ref={detailsRef}>
                    <div key={selectedResume.id} className="glass-container detailed-resume-card">
                        <div className="detailed-resume-header">
                            <div>
                                <div className="candidate-bucket-tag book-the-call">
                                    🔥 BOOK-THE-CALL
                                </div>
                                <h3 className="candidate-name">{selectedResume.candidate_name || 'Candidate Details'}</h3>
                            </div>
                            <div className="header-actions">
                                <InterviewHub 
                                    resume={selectedResume} 
                                    onSchedule={handleInterviewClick} 
                                    onFeedback={() => alert('Feedback form coming soon!')}
                                />
                                <div className="score-badge large">
                                    FIT SCORE: {selectedResume.analysis?.fit_score || 'N/A'} / 100
                                </div>
                            </div>
                        </div>
                        <p className="reasoning">{generateWeightedSummary(selectedResume, selectedResume?.analysis?.advanced_analysis)}</p>
                        
                        <div className="score-circle-container">
                            <div className="score-circle">
                                <span className="score-number">{selectedResume.analysis?.fit_score || "N/A"}</span>
                                <span className="score-label">/ 100</span>
                            </div>
                        </div>
                        <div className="section-title">Summary</div>
                        <div className="summary-points">
                            <ul>
                                {selectedResume.analysis?.summary_points?.map((point, i) => <li key={`sum-${i}`}>{point}</li>)}
                            </ul>
                        </div>

                        {selectedResume.analysis?.skill_matrix && <SkillMatrix skills={selectedResume.analysis.skill_matrix} />}
                        {selectedResume.analysis?.timeline && <Timeline timeline={selectedResume.analysis.timeline} />}
                        {selectedResume.analysis?.logistics && <Logistics logistics={selectedResume.analysis.logistics} />}
                        <AdvancedAnalysis advancedAnalysis={selectedResume?.analysis?.advanced_analysis || {}} />                    </div>
                </div>
            )}

            <FeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                resume={selectedResumeForFeedback}
                onSubmitFeedback={handleFeedbackSubmit}
                onSubmitOverride={handleOverrideSubmit}
            />

            <InterviewModal
                isOpen={isInterviewModalOpen}
                onClose={handleCloseInterviewModal}
                resume={currentInterviewResume}
                jobId={jobId}
                onInterviewCreated={handleInterviewCreated}
            />
        </div>
    );
};

export default JobDetailsPage; // testing-auto-refresh deployment
// Force deployment - auto-refresh and progress indicator fixes
