import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdvancedAnalysis from './components/AdvancedAnalysis';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './HomePage';
import UploadPage from './UploadPage';
import JobsListPage from './JobsListPage';
import JobDetailsPage from './JobDetailsPage';
import InterviewsPage from './InterviewsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="app-content">
          <Routes>
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/jobs" element={<JobsListPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
            <Route path="/interviews" element={<InterviewsPage />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </main>
        <Footer />
        {/* Force AdvancedAnalysis to be included in build */}
        <div style={{display: 'none'}}>
          <AdvancedAnalysis advancedAnalysis={{}} />
        </div>
      </div>
    </Router>
  );
}

export default App;
