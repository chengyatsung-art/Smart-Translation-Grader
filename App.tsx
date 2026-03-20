import React, { useState } from 'react';
import { Question, AppState, GradingResult, StudentSubmission, GradingStatus } from './types';
import ExamSetup from './components/ExamSetup';
import GradingDashboard from './components/GradingDashboard';
import { gradeStudentSubmission } from './services/geminiService';
import { BookOpen, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [students, setStudents] = useState<StudentSubmission[]>([]);

  // Function to start grading a single student asynchronously
  const handleGradeStudent = async (studentId: string, currentQuestions: Question[], images: File[]) => {
    try {
      const result = await gradeStudentSubmission(currentQuestions, images);
      
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
            return {
                ...s,
                status: GradingStatus.COMPLETED,
                // Update name if AI found one and user didn't explicitly set a custom one (simple check)
                name: (s.name && s.name.trim() !== '') ? s.name : (result.studentName || s.name),
                result: {
                    ...result,
                    submissionId: studentId,
                    studentName: (s.name && s.name.trim() !== '') ? s.name : result.studentName
                }
            };
        }
        return s;
      }));
    } catch (error: any) {
      console.error(`Error grading student ${studentId}:`, error);
      setStudents(prev => prev.map(s => 
        s.id === studentId 
          ? { ...s, status: GradingStatus.ERROR, error: error.message || 'Unknown error' } 
          : s
      ));
    }
  };

  const addAndGradeStudent = (name: string, images: File[]) => {
    const newId = Date.now().toString();
    const newStudent: StudentSubmission = {
      id: newId,
      name: name,
      images: images,
      status: GradingStatus.PROCESSING,
      createdAt: Date.now()
    };

    // Add to list immediately
    setStudents(prev => [...prev, newStudent]);

    // Start async grading
    handleGradeStudent(newId, questions, images);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap size={28} />
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Smart Grader <span className="text-slate-400 font-normal text-sm">AI Assistant</span></h1>
          </div>
          
          <div className="flex gap-2">
             <div className={`h-2 w-2 rounded-full ${appState === AppState.SETUP ? 'bg-primary' : 'bg-slate-300'}`}></div>
             <div className={`h-2 w-2 rounded-full ${appState === AppState.DASHBOARD ? 'bg-primary' : 'bg-slate-300'}`}></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {appState === AppState.SETUP && (
          <ExamSetup 
            questions={questions} 
            setQuestions={setQuestions} 
            onNext={() => setAppState(AppState.DASHBOARD)} 
          />
        )}

        {appState === AppState.DASHBOARD && (
          <GradingDashboard 
            students={students}
            questions={questions}
            onAddStudent={addAndGradeStudent}
            onBackToSetup={() => setAppState(AppState.SETUP)}
          />
        )}
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p className="flex items-center justify-center gap-1">
             Powered by Gemini 3.0 Flash <BookOpen size={14}/>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;