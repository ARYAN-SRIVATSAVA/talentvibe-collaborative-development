import React, { useState, useCallback } from 'react';

const FileDropZone = ({ 
    label, 
    files, 
    onFilesChange, 
    inputId, 
    multiple = false, 
    accept = ".pdf,.docx,.doc,.txt",
    icon = "📁",
    promptMain = "Click anywhere on this section to select files",
    promptTypes = "Supports: .pdf, .docx, .doc, .txt"
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesChange(Array.from(e.dataTransfer.files));
        }
    }, [onFilesChange]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            onFilesChange(Array.from(e.target.files));
        }
    };

    const removeFile = (indexToRemove) => {
        const newFiles = files.filter((_, index) => index !== indexToRemove);
        onFilesChange(newFiles);
    };

    return (
        <div className="file-drop-zone-container">
            
            <div 
                className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="drop-zone-content">
                    <div className="drop-zone-text">
                        <p className="drop-zone-main">{promptMain}</p>
                        <p className="drop-zone-types">{promptTypes}</p>
                    </div>
                    <input
                        type="file"
                        id={inputId}
                        multiple={multiple}
                        accept={accept}
                        onChange={handleFileChange}
                        className="file-input-hidden"
                    />
                </div>
            </div>

            {files.length > 0 && (
                <div className="file-list">
                    <h4>Selected Files ({files.length})</h4>
                    <div className="file-items">
                        {files.map((file, index) => (
                            <div key={index} className="file-item">
                                <div className="file-info">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-size">
                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="remove-file-btn"
                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileDropZone;
