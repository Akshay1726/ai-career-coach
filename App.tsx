import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppView, Job } from './types';
import { getJobMatches, getResumeFeedback } from './services/geminiService';
import { BriefcaseIcon, DocumentTextIcon, SparklesIcon, WifiOffIcon } from './components/icons';
import { LoadingSpinner } from './components/LoadingSpinner';

// Helper Component: SidebarItem
interface SidebarItemProps {
  view: AppView;
  currentView: AppView;
  setView: (view: AppView) => void;
  icon: React.ReactNode;
}
const SidebarItem: React.FC<SidebarItemProps> = ({ view, currentView, setView, icon }) => {
  const isActive = view === currentView;
  return (
    <button
      onClick={() => setView(view)}
      className={`flex items-center w-full px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-sky-100 text-sky-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {icon}
      <span className="ml-3">{view}</span>
    </button>
  );
};

// Helper Component: JobCard
const JobCard: React.FC<{ job: Job }> = ({ job }) => {
    const relevanceColor = job.relevance > 85 ? 'bg-green-100 text-green-800' : job.relevance > 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800';
    return (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${relevanceColor}`}>{job.relevance}% Match</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
                 <p className="text-sm font-medium text-sky-600">{job.company}</p>
                 <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">{job.experienceLevel}</span>
            </div>
            <p className="text-slate-600 mt-3 text-sm">{job.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
                {job.techStack.map(skill => (
                    <span key={skill} className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-md">{skill}</span>
                ))}
            </div>
        </div>
    );
};

// Helper Component: SimpleMarkdownRenderer
const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const elements = useMemo(() => {
        const lines = content.split('\n');
        const htmlElements: string[] = [];
        let inList = false;

        for (const line of lines) {
            if (line.startsWith('### ')) {
                if (inList) {
                    htmlElements.push('</ul>');
                    inList = false;
                }
                htmlElements.push(`<h3 class="text-xl font-semibold mt-6 mb-2 text-slate-800">${line.substring(4)}</h3>`);
            } else if (line.startsWith('* ')) {
                if (!inList) {
                    htmlElements.push('<ul class="list-disc pl-5 space-y-2 text-slate-600">');
                    inList = true;
                }
                htmlElements.push(`<li>${line.substring(2)}</li>`);
            } else {
                if (inList) {
                    htmlElements.push('</ul>');
                    inList = false;
                }
                if (line.trim() !== '') {
                    htmlElements.push(`<p class="text-slate-600 leading-relaxed">${line}</p>`);
                }
            }
        }

        if (inList) {
            htmlElements.push('</ul>');
        }

        return htmlElements.join('');
    }, [content]);

    return <div className="space-y-4" dangerouslySetInnerHTML={{ __html: elements }} />;
};

// Helper Component: ResultsPlaceholder
const ResultsPlaceholder: React.FC<{ view: AppView }> = ({ view }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
         <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4">
            {view === AppView.JOB_MATCH ? <BriefcaseIcon className="w-8 h-8 text-sky-500" /> : <DocumentTextIcon className="w-8 h-8 text-sky-500" />}
        </div>
        <h3 className="text-lg font-semibold text-slate-700">
            {view === AppView.JOB_MATCH ? 'Your matched jobs will appear here' : 'Your resume feedback will appear here'}
        </h3>
        <p className="mt-1 max-w-sm">
            {view === AppView.JOB_MATCH 
                ? 'Paste your resume on the left and click "Find Matching Jobs" to discover opportunities tailored to your profile.'
                : 'Paste your resume and click "Review My Resume" for AI-powered suggestions to improve it.'
            }
        </p>
    </div>
);


// Main App Component
export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.JOB_MATCH);
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Job[] | string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume before proceeding.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      if (currentView === AppView.JOB_MATCH) {
        const jobs = await getJobMatches(resumeText);
        setResults(jobs);
      } else {
        const feedback = await getResumeFeedback(resumeText);
        setResults(feedback);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, currentView]);
  
  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    setResults(null);
    setError(null);
  }

  const buttonText = currentView === AppView.JOB_MATCH ? 'Find Matching Jobs' : 'Review My Resume';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
              <SparklesIcon className="w-8 h-8 text-sky-500" />
              <h1 className="text-2xl font-bold ml-2">AI Career Coach</h1>
          </div>
          {!isOnline && (
            <div className="bg-amber-100 border-t border-amber-200 text-amber-800 text-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-center py-2 px-4 sm:px-6 lg:px-8">
                    <WifiOffIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="font-medium">You are currently offline. The app is running in mock mode with sample data.</span>
                </div>
            </div>
           )}
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="md:col-span-5 lg:col-span-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm sticky top-28">
              <h2 className="text-lg font-semibold mb-4 text-slate-800">Coach Tools</h2>
              <nav className="space-y-2 mb-6">
                <SidebarItem 
                  view={AppView.JOB_MATCH} 
                  currentView={currentView} 
                  setView={handleViewChange} 
                  icon={<BriefcaseIcon className="w-5 h-5" />} 
                />
                <SidebarItem 
                  view={AppView.RESUME_REVIEW} 
                  currentView={currentView} 
                  setView={handleViewChange} 
                  icon={<DocumentTextIcon className="w-5 h-5" />} 
                />
              </nav>

              <label htmlFor="resume-input" className="block text-sm font-medium text-slate-700 mb-2">
                Paste Your Resume
              </label>
              <textarea
                id="resume-input"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your full resume text here..."
                className="w-full h-60 p-3 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition duration-150 text-sm"
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !resumeText}
                className="mt-4 w-full bg-sky-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              >
                {isLoading ? 'Analyzing...' : buttonText}
              </button>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="md:col-span-7 lg:col-span-8">
            <div className="bg-white min-h-[600px] rounded-lg border border-slate-200 shadow-sm">
              {isLoading && <LoadingSpinner />}
              {!isLoading && error && (
                <div className="p-8 text-center text-red-600">
                    <p className="font-semibold">An Error Occurred</p>
                    <p>{error}</p>
                </div>
              )}
              {!isLoading && !error && !results && <ResultsPlaceholder view={currentView} />}
              {!isLoading && !error && results && (
                <div className="p-4 sm:p-6">
                    {currentView === AppView.JOB_MATCH && Array.isArray(results) && (
                        <div className="space-y-4">
                            {results.map((job, index) => <JobCard key={`${job.title}-${index}`} job={job} />)}
                        </div>
                    )}
                    {currentView === AppView.RESUME_REVIEW && typeof results === 'string' && (
                        <SimpleMarkdownRenderer content={results} />
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}