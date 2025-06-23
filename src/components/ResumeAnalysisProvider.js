import React, { createContext, useContext, useState } from 'react';

const ResumeAnalysisContext = createContext();

export const useResumeAnalysis = () => useContext(ResumeAnalysisContext);

const ResumeAnalysisProvider = ({ children }) => {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  return (
    <ResumeAnalysisContext.Provider value={{
      resumeFile, setResumeFile,
      resumePreview, setResumePreview,
      selectedCategory, setSelectedCategory,
      analysisResult, setAnalysisResult
    }}>
      {children}
    </ResumeAnalysisContext.Provider>
  );
};

export default ResumeAnalysisProvider; 