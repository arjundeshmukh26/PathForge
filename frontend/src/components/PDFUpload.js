import React, { useState, useCallback } from 'react';

const PDFUpload = ({ onTextExtracted, disabled = false, className = "" }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(null);
  const [error, setError] = useState(null);

  const extractTextFromPDF = async (file) => {
    setIsExtracting(true);
    setError(null);
    setExtractionProgress({ step: 1, message: 'Uploading PDF...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrls = [
        'http://127.0.0.1:8000/api/v1/extract-pdf-text',
        'http://localhost:8000/api/v1/extract-pdf-text'
      ];

      let response = null;
      for (const url of apiUrls) {
        try {
          setExtractionProgress({ step: 2, message: 'Processing PDF...' });
          response = await fetch(url, {
            method: 'POST',
            body: formData
          });
          break; // Success, exit loop
        } catch (error) {
          console.log(`Failed to upload to ${url}:`, error.message);
          continue; // Try next URL
        }
      }

      if (!response) {
        throw new Error('Unable to connect to the PDF processing service');
      }

      setExtractionProgress({ step: 3, message: 'Extracting text...' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || result.error || 'Failed to extract text from PDF');
      }

      if (!result.success) {
        // Handle validation errors with suggestions
        if (result.suggestions) {
          setError({
            message: result.error,
            suggestions: result.suggestions,
            extractedText: result.extracted_text
          });
        } else {
          throw new Error(result.error || 'Failed to extract text from PDF');
        }
        return;
      }

      setExtractionProgress({ step: 4, message: 'Text extracted successfully!' });

      // Call the callback with extracted text
      onTextExtracted(result.text, {
        filename: file.name,
        extractionMethod: result.metadata.extraction_method,
        wordCount: result.metadata.word_count,
        characterCount: result.metadata.cleaned_length
      });

      // Clear progress after a short delay
      setTimeout(() => {
        setExtractionProgress(null);
      }, 2000);

    } catch (error) {
      console.error('PDF extraction error:', error);
      setError({ message: error.message });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError({ message: 'Please select a PDF file.' });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError({ message: 'File size too large. Please select a PDF smaller than 10MB.' });
      return;
    }

    extractTextFromPDF(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  }, [disabled]);

  const clearError = () => {
    setError(null);
  };

  return (
    <div className={`${className}`}>
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : isDragOver
            ? 'border-blue-500 bg-blue-50'
            : isExtracting
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isExtracting && document.getElementById('pdf-upload')?.click()}
      >
        <input
          id="pdf-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || isExtracting}
        />

        {isExtracting ? (
          <div className="flex flex-col items-center space-y-4">
            {/* Extraction Progress */}
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h4 className="font-semibold text-green-800 mb-2">
                {extractionProgress?.message || 'Processing PDF...'}
              </h4>
              <div className="flex items-center justify-center space-x-2 mb-2">
                {[1, 2, 3, 4].map(step => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full ${
                      extractionProgress?.step >= step ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-green-600">
                Step {extractionProgress?.step || 1} of 4
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Upload PDF Resume
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Drop your PDF resume here or click to browse
              </p>
              
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>PDF only</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14L17 4M9 9v6M15 9v6" />
                  </svg>
                  <span>Max 10MB</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Auto-extract text</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-1">
                PDF Processing Error
              </h4>
              <p className="text-red-700 text-sm mb-3">
                {error.message}
              </p>
              
              {error.suggestions && (
                <div className="mb-3">
                  <p className="text-red-700 text-sm font-medium mb-2">Suggestions:</p>
                  <ul className="text-red-600 text-sm space-y-1">
                    {error.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {error.extractedText && (
                <div className="mb-3">
                  <p className="text-red-700 text-sm font-medium mb-1">Extracted text preview:</p>
                  <div className="bg-red-100 rounded p-2 text-xs text-red-800 max-h-24 overflow-y-auto">
                    {error.extractedText}
                  </div>
                </div>
              )}
              
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {extractionProgress?.step === 4 && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-green-800">
                PDF processed successfully!
              </h4>
              <p className="text-green-700 text-sm">
                Text has been extracted and is ready for analysis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFUpload;