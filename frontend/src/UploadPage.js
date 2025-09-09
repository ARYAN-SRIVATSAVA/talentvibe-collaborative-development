import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './UploadPage.css';
import FileDropZone from './components/FileDropZone';
import ResumeProgressBar from './components/ResumeProgressBar';

const UploadPage = () => {
    // Initialize state from localStorage to persist data across navigation
    const [jobDescriptionFiles, setJobDescriptionFiles] = useState(() => {
        const saved = localStorage.getItem('uploadPage_jdFiles');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [resumes, setResumes] = useState(() => {
        const saved = localStorage.getItem('uploadPage_resumes');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [message, setMessage] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [progressUpdates, setProgressUpdates] = useState([]);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [existingJdInfo, setExistingJdInfo] = useState(() => {
        const saved = localStorage.getItem('uploadPage_existingJdInfo');
        return saved ? JSON.parse(saved) : null;
    });
    const [isCheckingJd, setIsCheckingJd] = useState(false);
    const [hasUnsavedData, setHasUnsavedData] = useState(false);
    const [hasRestoredFiles, setHasRestoredFiles] = useState(false);
    const [duplicateInfo, setDuplicateInfo] = useState(null);
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
    const navigate = useNavigate();
    const socketRef = useRef(null);

    // Save data to localStorage whenever it changes
    useEffect(() => {
        if (jobDescriptionFiles.length > 0 || resumes.length > 0) {
            setHasUnsavedData(true);
            
            // Save file metadata (not the actual File objects)
            const jdFilesMetadata = jobDescriptionFiles.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            }));
            
            const resumesMetadata = resumes.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            }));
            
            localStorage.setItem('uploadPage_jdFiles', JSON.stringify(jdFilesMetadata));
            localStorage.setItem('uploadPage_resumes', JSON.stringify(resumesMetadata));
        } else {
            setHasUnsavedData(false);
            localStorage.removeItem('uploadPage_jdFiles');
            localStorage.removeItem('uploadPage_resumes');
        }
    }, [jobDescriptionFiles, resumes]);

    // Check for restored data on component mount
    useEffect(() => {
        // Force clear all stored data on page reload
        const forceClearOnReload = () => {
            // Method 1: Check performance navigation type
            if (performance.navigation && performance.navigation.type === 1) {
                return true;
            }
            
            // Method 2: Check if page was loaded from cache (reload)
            if (performance.getEntriesByType && performance.getEntriesByType('navigation').length > 0) {
                const navEntry = performance.getEntriesByType('navigation')[0];
                if (navEntry.type === 'reload') {
                    return true;
                }
            }
            
            // Method 3: Check if this is a fresh page load (no previous timestamp)
            const lastVisit = sessionStorage.getItem('uploadPage_lastVisit');
            const currentTime = Date.now();
            
            if (!lastVisit) {
                // First visit, set timestamp and treat as reload
                sessionStorage.setItem('uploadPage_lastVisit', currentTime.toString());
                return true;
            }
            
            // Check if more than 30 seconds have passed (treat as reload)
            const timeDiff = currentTime - parseInt(lastVisit);
            if (timeDiff > 30 * 1000) { // 30 seconds
                sessionStorage.setItem('uploadPage_lastVisit', currentTime.toString());
                return true;
            }
            
            // Update timestamp for this visit
            sessionStorage.setItem('uploadPage_lastVisit', currentTime.toString());
            return false;
        };
        
        if (forceClearOnReload()) {
            // This is a page reload, clear all stored data
            clearStoredData();
            return;
        }
        
        const savedJdFiles = localStorage.getItem('uploadPage_jdFiles');
        const savedResumes = localStorage.getItem('uploadPage_resumes');
        const savedExistingJdInfo = localStorage.getItem('uploadPage_existingJdInfo');
        
        if (savedJdFiles || savedResumes || savedExistingJdInfo) {
            setHasUnsavedData(true);
            setHasRestoredFiles(true);
            if (savedJdFiles) {
                // Store the metadata for display purposes
                setJobDescriptionFiles(JSON.parse(savedJdFiles));
            }
            if (savedResumes) {
                // Store the metadata for display purposes
                setResumes(JSON.parse(savedResumes));
            }
            if (savedExistingJdInfo) {
                setExistingJdInfo(JSON.parse(savedExistingJdInfo));
            }
        }
    }, []);

    // Save existing JD info to localStorage
    useEffect(() => {
        if (existingJdInfo) {
            localStorage.setItem('uploadPage_existingJdInfo', JSON.stringify(existingJdInfo));
        } else {
            localStorage.removeItem('uploadPage_existingJdInfo');
        }
    }, [existingJdInfo]);

    // Handle page unload warning when there's unsaved data
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedData) {
                e.preventDefault();
                e.returnValue = 'Files uploaded. Leave page?';
                return 'Files uploaded. Leave page?';
            }
        };

        const handleUnload = () => {
            // Clear stored data on page unload (including reload)
            clearStoredData();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleUnload);
        };
    }, [hasUnsavedData]);

    // Initialize WebSocket connection
    useEffect(() => {
        socketRef.current = io();
        
        socketRef.current.on('connect', () => {
        });

        socketRef.current.on('progress_update', (data) => {
            setProgressUpdates(prev => [...prev, data]);
            
            // Auto-navigate when analysis is complete
            if (data.type === 'complete' && currentJobId) {
                // Clear any remaining stored data before redirecting
                clearStoredData();
                clearSession();
                setTimeout(() => {
                    navigate(`/jobs/${currentJobId}`);
                }, 2000);
            }
        });

        socketRef.current.on('disconnect', () => {
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [navigate, currentJobId]);

    const checkExistingJd = async (file) => {
        setIsCheckingJd(true);
        setExistingJdInfo(null);
        
        try {
            const formData = new FormData();
            formData.append('jd_file', file);
            
            const response = await fetch('/api/jd/check', {
                method: 'POST',
                body: formData,
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.exists) {
                    setExistingJdInfo(data);
                    setMessage(`Info: ${data.message}`);
                } else {
                    setMessage(`Info: ${data.message}`);
                    // Clear the message after 3 seconds
                    setTimeout(() => setMessage(''), 3000);
                }
            } else {
                
                
                setMessage('Warning: Could not check for existing JD file. Proceeding with upload.');
            }
        } catch (error) {
            setMessage('Warning: Could not check for existing JD file');
        } finally {
            setIsCheckingJd(false);
        }
    };

    const checkResumeDuplicates = async () => {
        if (resumes.length === 0) {
            setMessage('Error: Please upload resumes first.');
            return;
        }
        
        // Check if we have an existing job to check duplicates within
        if (!existingJdInfo || !existingJdInfo.job) {
            setMessage('Error: Please upload a job description file first to check for duplicates within a specific job.');
            return;
        }
        
        setIsCheckingDuplicates(true);
        setDuplicateInfo(null);
        
        try {
            const formData = new FormData();
            for (let i = 0; i < resumes.length; i++) {
                formData.append('resumes', resumes[i]);
            }
            // Add the job_id to check duplicates within this specific job
            formData.append('job_id', existingJdInfo.job.id);
            
            const response = await fetch('/api/resumes/check-duplicates', {
                method: 'POST',
                body: formData,
            });
            
            if (response.ok) {
                const data = await response.json();
                setDuplicateInfo(data);
                
                if (data.duplicate_count > 0) {
                    setMessage(`Found ${data.duplicate_count} duplicate resumes within job #${data.job_id}. ${data.unique_count} unique resumes will be processed.`);
                } else {
                    setMessage(`All ${data.total_files} resumes are unique within job #${data.job_id} and will be processed.`);
                }
                
                // Clear the message after 5 seconds
                setTimeout(() => setMessage(''), 5000);
            } else {
                
                
                setMessage('Warning: Could not check for duplicate resumes.');
            }
        } catch (error) {
            setMessage('Warning: Could not check for duplicate resumes');
        } finally {
            setIsCheckingDuplicates(false);
        }
    };

    const handleJdFileChange = (files) => {
        setJobDescriptionFiles(files);
        setExistingJdInfo(null);
        setMessage('');
        setHasRestoredFiles(false); // Reset restored files state when new files are uploaded
        
        // Check for existing JD if a file is uploaded
        if (files.length > 0) {
            checkExistingJd(files[0]);
        } else {
            // Clear any existing info if no files
            setExistingJdInfo(null);
            setMessage('');
        }
    };

    const clearStoredData = () => {
        localStorage.removeItem('uploadPage_jdFiles');
        localStorage.removeItem('uploadPage_resumes');
        localStorage.removeItem('uploadPage_existingJdInfo');
        setHasUnsavedData(false);
        setHasRestoredFiles(false);
    };

    const clearSession = () => {
        sessionStorage.removeItem('uploadPage_session');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (jobDescriptionFiles.length === 0) {
            setMessage('Error: Please upload at least one job description file.');
            return;
        }
        if (resumes.length === 0) {
            setMessage('Error: Please upload at least one résumé.');
            return;
        }

        setIsAnalyzing(true);
        setAnalysisResult(null);
        setMessage('');
        setProgressUpdates([]);
        
        // Clear stored data since analysis is starting
        clearStoredData();
        clearSession();

        setTimeout(async () => {
            const formData = new FormData();
            
            // If we have an existing JD, we don't need to send the file again
            if (existingJdInfo) {
                // Use the existing JD content
                formData.append('job_description', `Job description from file: ${existingJdInfo.jd_file.filename}\n\n${existingJdInfo.jd_file.content}`);
                
                // If there's an existing job, we can optionally use that job ID
                if (existingJdInfo.job) {
                    formData.append('existing_job_id', existingJdInfo.job.id);
                }
            } else {
                // Send job description files for new JD
                for (let i = 0; i < jobDescriptionFiles.length; i++) {
                    formData.append('job_description_files', jobDescriptionFiles[i]);
                }
                
                // Also send a text description for backward compatibility
                const jdNames = jobDescriptionFiles.map(file => file.name).join(', ');
                formData.append('job_description', `Job description from files: ${jdNames}`);
            }
            
            // Send resume files
            for (let i = 0; i < resumes.length; i++) {
                formData.append('resumes', resumes[i]);
            }

            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                setAnalysisResult(data);
                setCurrentJobId(data.job_id);

                if (response.ok) {
                    let messageText = `Analysis queued successfully! ${data.total_resumes} resumes are being processed in the background.`;
                    
                    // Add information about existing job if applicable
                    if (data.is_existing_job) {
                        messageText += ` Processing under existing job #${data.job_id}.`;
                    }
                    
                    // Add duplicate information if any
                    if (data.duplicate_count > 0) {
                        messageText += ` ${data.duplicate_count} duplicate resumes were skipped.`;
                    }
                    
                    messageText += " You'll be redirected when complete.";
                    
                    // Immediately redirect to the job overview page
                    if (data.job_id) {
                        setTimeout(() => {
                            navigate(`/jobs/${data.job_id}`);
                        }, 500); // Small delay to show the success message
                    }
                    
                    setMessage(messageText);
                    // Data is now being processed, so we can clear the stored data
                    clearStoredData();
                    clearSession();
                } else {
                    throw new Error(data.error || 'An error occurred during analysis.');
                }
            } catch (error) {
                setMessage(`Error: ${error.message}`);
                setIsAnalyzing(false);
            }
        }, 100);
    };

    const getProgressTypeClass = (type) => {
        switch (type) {
            case 'success': return 'progress-success';
            case 'error': return 'progress-error';
            case 'warning': return 'progress-warning';
            case 'processing': return 'progress-processing';
            default: return 'progress-info';
        }
    };

    return (
        <div className="upload-page-container">

            
            <div className="glass-container">
                                <div className="page-header">
                    <h2>Analyze New Role</h2>
                </div>
                <p>Provide a job description and the corresponding résumés to begin the analysis.</p>
                <form onSubmit={handleSubmit} className="upload-form">
                    {/* Job Description Upload Section */}
                    <div className="upload-section clickable-upload-section" onClick={() => document.getElementById("jobDescriptionFiles").click()}>
                        <h3 className="section-heading">📄 Upload Job Descriptions</h3>
                        <p className="section-description">Upload one or more job description files to define the role requirements.</p>                    <FileDropZone
                        label="Upload Job Description Files"
                        files={jobDescriptionFiles}
                        onFilesChange={handleJdFileChange}
                        inputId="jobDescriptionFiles"
                        multiple={false}
                        accept=".pdf,.docx,.doc,.txt"
                        icon="📄"
                        promptMain="Drag & drop job description files here, or click to select files"
                        promptTypes="Supports: .pdf, .docx, .doc, .txt"
                    />
                    
                    {/* Show loading state when checking JD */}
                    </div>                    {isCheckingJd && (
                        <div className="jd-checking">
                            <div className="checking-spinner">⏳</div>
                            <p>Checking for existing job description...</p>
                        </div>
                    )}
                    
                    {/* Show existing JD information if found */}
                    {existingJdInfo && !isCheckingJd && (
                        <div className="existing-jd-info">
                            <div className="info-header">
                                <span className="info-icon">ℹ️</span>
                                <span className="info-title">Existing Job Description Found</span>
                            </div>
                            <div className="info-content">
                                <p><strong>File:</strong> {existingJdInfo.jd_file.filename}</p>
                                <p><strong>Type:</strong> {existingJdInfo.jd_file.file_type.toUpperCase()}</p>
                                <p><strong>Uploaded:</strong> {new Date(existingJdInfo.jd_file.created_at).toLocaleDateString()}</p>
                                
                                {existingJdInfo.job && (
                                    <div className="existing-job-info">
                                        <p><strong>Existing Job ID:</strong> #{existingJdInfo.job.id}</p>
                                        <p><strong>Resumes:</strong> {existingJdInfo.job.resume_count} resumes already processed</p>
                                        <button 
                                            type="button" 
                                            className="view-existing-job-btn"
                                            onClick={() => {
                                                if (hasUnsavedData) {
                                                    if (window.confirm('You have unsaved upload data. Are you sure you want to leave? Your data will be saved and restored when you return.')) {
                                                        navigate(`/jobs/${existingJdInfo.job.id}`);
                                                    }
                                                } else {
                                                    navigate(`/jobs/${existingJdInfo.job.id}`);
                                                }
                                            }}
                                        >
                                            View Existing Job
                                        </button>
                                    </div>
                                )}
                                
                                <p className="info-note">
                                    <strong>Note:</strong> If you proceed, resumes will be processed under this existing job description.
                                </p>
                                
                                <button 
                                    type="button" 
                                    className="clear-jd-btn"
                                    onClick={() => {
                                        if (window.confirm('Replace JD file? You can upload a different one.')) {
                                            setJobDescriptionFiles([]);
                                            setExistingJdInfo(null);
                                            setMessage('');
                                            setHasRestoredFiles(false);
                                        }
                                    }}
                                >
                                    Upload Different JD
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Processing Summary */}
                    {resumes.length > 0 && (
                        <div className="processing-summary">
                            <div className="summary-header">
                                <span className="summary-icon">📊</span>
                                <span className="summary-title">Processing Summary</span>
                            </div>
                            <div className="summary-content">
                                <p><strong>Resumes to Process:</strong> {resumes.length}</p>
                                {duplicateInfo && (
                                    <p><strong>Unique Resumes:</strong> {duplicateInfo.unique_count}</p>
                                )}
                                {existingJdInfo && existingJdInfo.job && (
                                    <p><strong>Target Job:</strong> #{existingJdInfo.job.id} ({existingJdInfo.job.resume_count} existing resumes)</p>
                                )}
                                <p><strong>Mode:</strong> {existingJdInfo ? 'Add to Existing Job' : 'Create New Job'}</p>
                                {existingJdInfo && (
                                    <p className="summary-note">
                                        <strong>Note:</strong> Duplicate resumes (same content, different filename) will be automatically skipped.
                                    </p>
                                )}
                                {duplicateInfo && duplicateInfo.duplicate_count > 0 && (
                                    <p className="summary-note">
                                        <strong>Note:</strong> {duplicateInfo.duplicate_count} duplicate resumes will be skipped during processing.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Resume Upload Section */}
                    <div className="upload-section clickable-upload-section" onClick={() => document.getElementById("resumes").click()}>
                        <h3 className="section-heading">☁️ Upload Resumes</h3>
                        <p className="section-description">Upload one or more resume files to analyze against the job description.</p>                    <FileDropZone
                        label="Upload Résumés"
                        files={resumes}
                        onFilesChange={(files) => {
                            setResumes(files);
                            setHasRestoredFiles(false); // Reset restored files state when new files are uploaded
                        }}
                        inputId="resumes"
                        multiple={true}
                        accept=".pdf,.docx,.txt"
                        icon="☁️"
                        promptMain="Drag & drop files here, or click to select files"
                        promptTypes="Supports: .pdf, .docx, .txt"
                    />
                    
                    {/* Duplicate Check Button */}
                    </div>                    {resumes.length > 0 && (
                        <div className="duplicate-check-section">
                            {!existingJdInfo || !existingJdInfo.job ? (
                                <div className="duplicate-check-info">
                                    <p>📋 Upload a job description file first to check for duplicates within that specific job.</p>
                                </div>
                            ) : (
                                <>
                                    <button 
                                        type="button" 
                                        className="duplicate-check-btn"
                                        onClick={checkResumeDuplicates}
                                        disabled={isCheckingDuplicates}
                                    >
                                        {isCheckingDuplicates ? 'Checking...' : '🔍 Check for Duplicates'}
                                    </button>
                                    <p className="duplicate-check-note">
                                        Checking duplicates within job #{existingJdInfo.job.id} only
                                    </p>
                                </>
                            )}
                            
                            {duplicateInfo && (
                                <div className="duplicate-info">
                                    <div className="duplicate-summary">
                                        <p><strong>Total Files:</strong> {duplicateInfo.total_files}</p>
                                        <p><strong>Unique Resumes:</strong> {duplicateInfo.unique_count}</p>
                                        <p><strong>Duplicates Found:</strong> {duplicateInfo.duplicate_count}</p>
                                    </div>
                                    
                                    {duplicateInfo.duplicates.length > 0 && (
                                        <div className="duplicate-details">
                                            <h4>Duplicate Details:</h4>
                                            {duplicateInfo.duplicates.map((dup, index) => (
                                                <div key={index} className="duplicate-item">
                                                    {dup.error ? (
                                                        <p className="duplicate-error">❌ {dup.filename}: {dup.error}</p>
                                                    ) : (
                                                        <div>
                                                            <p><strong>File:</strong> {dup.filename}</p>
                                                            <p><strong>Duplicate of:</strong> {dup.duplicate_of.resume_filename} (Job #{dup.duplicate_of.job_id})</p>
                                                            <p><strong>Candidate:</strong> {dup.duplicate_of.candidate_name}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        className={`cta-button ${isAnalyzing ? 'analyzing' : ''}`} 
                        disabled={isAnalyzing || hasRestoredFiles}
                    >
                        <span className="button-text">
                            {isAnalyzing ? 'Analyzing...' : 
                             hasRestoredFiles ? 'Re-upload Files to Continue' :
                             existingJdInfo ? 'Process Resumes with Existing JD' : 'Start Analysis'}
                        </span>
                    </button>
                </form>
                
                {/* Resume Processing Progress Bar - NEW COMPONENT */}
                <ResumeProgressBar
                    isVisible={isAnalyzing}
                    totalResumes={resumes.length}
                    isAnalyzing={isAnalyzing}
                />
                
                {/* Real-time Progress Updates */}
                {isAnalyzing && progressUpdates.length > 0 && (
                    <div className="progress-updates">
                        <h4>Analysis Progress</h4>
                        <div className="progress-list">
                            {progressUpdates.map((update, index) => (
                                <div key={index} className={`progress-item ${getProgressTypeClass(update.type)}`}>
                                    <span className="progress-message">{update.message}</span>
                                    <span className="progress-time">
                                        {new Date(update.timestamp * 1000).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {message && <p className={`message ${message.startsWith('Error') ? 'error' : 'success'}`}>{message}</p>}
                
                {analysisResult && analysisResult.skipped_files && analysisResult.skipped_files.length > 0 && (
                    <div className="skipped-files-report">
                        <h4>Skipped Files Report</h4>
                        <ul>
                            {analysisResult.skipped_files.map((file, index) => (
                                <li key={index}><strong>{file.filename}</strong> - {file.reason}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadPage;// FORCE DEPLOYMENT UPDATE - Mon Sep  1 16:38:51 EDT 2025
