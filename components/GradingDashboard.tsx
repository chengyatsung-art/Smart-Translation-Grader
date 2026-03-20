import React, { useState, useEffect } from 'react';
import { GradingStatus, StudentSubmission, Question } from '../types';
import SingleUploader from './SingleUploader';
import ResultDetail from './ResultDetail';
import { Plus, User, Loader2, Check, AlertTriangle, ChevronRight, Settings } from 'lucide-react';

interface GradingDashboardProps {
  students: StudentSubmission[];
  questions: Question[];
  onAddStudent: (name: string, images: File[]) => void;
  onBackToSetup: () => void;
}

const GradingDashboard: React.FC<GradingDashboardProps> = ({ students, questions, onAddStudent, onBackToSetup }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | 'NEW'>('NEW');

  // Auto-select newly completed students if we are on the "New" screen? 
  // Or just keep the flow manual. Let's keep it manual to not disrupt data entry.

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start h-[calc(100vh-140px)]">
      {/* Sidebar: Student Queue */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4 h-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Students ({students.length})</h3>
            <button 
              onClick={onBackToSetup}
              className="text-slate-400 hover:text-slate-600"
              title="Edit Exam Settings"
            >
              <Settings size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <button
              onClick={() => setSelectedStudentId('NEW')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors border-2 border-dashed
                ${selectedStudentId === 'NEW' 
                  ? 'border-primary bg-blue-50 text-primary' 
                  : 'border-slate-200 hover:border-primary/50 text-slate-500'}`}
            >
              <div className="bg-white p-1.5 rounded-full shadow-sm">
                <Plus size={16} />
              </div>
              <span className="font-semibold text-sm">Grade New Student</span>
            </button>

            {students.slice().reverse().map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={`w-full p-3 rounded-lg flex items-center justify-between text-left transition-all border
                  ${selectedStudentId === student.id 
                    ? 'bg-white border-primary shadow-md ring-1 ring-primary/20' 
                    : 'bg-white border-slate-100 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded-full shrink-0 flex items-center justify-center w-8 h-8
                    ${student.status === GradingStatus.COMPLETED ? 'bg-green-100 text-green-600' : 
                      student.status === GradingStatus.PROCESSING ? 'bg-blue-100 text-blue-600' : 
                      student.status === GradingStatus.ERROR ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}
                  >
                    {student.status === GradingStatus.PROCESSING && <Loader2 size={16} className="animate-spin" />}
                    {student.status === GradingStatus.COMPLETED && <Check size={16} />}
                    {student.status === GradingStatus.ERROR && <AlertTriangle size={16} />}
                    {student.status === GradingStatus.DRAFT && <User size={16} />}
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-slate-800 text-sm truncate">{student.name || `Student #${student.id.slice(-4)}`}</div>
                    <div className="text-xs text-slate-500">
                      {student.status === GradingStatus.PROCESSING ? 'Grading...' : 
                       student.status === GradingStatus.COMPLETED ? `Score: ${student.result?.totalScore}` : 
                       student.status === GradingStatus.ERROR ? 'Failed' : 'Draft'}
                    </div>
                  </div>
                </div>
                {selectedStudentId === student.id && <ChevronRight size={16} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full md:w-2/3 lg:w-3/4 h-full overflow-y-auto">
        {selectedStudentId === 'NEW' ? (
          <SingleUploader 
            onGrade={(name, images) => {
               onAddStudent(name, images);
               // Keep view on NEW to allow rapid entry, or switch?
               // Requirement says "enter next student while grading", so staying on NEW or clearing form is best.
               // SingleUploader handles its own state reset if re-mounted or logic added.
            }} 
            onCancel={() => {}} // No cancel needed for main view
          />
        ) : selectedStudent ? (
          selectedStudent.status === GradingStatus.COMPLETED && selectedStudent.result ? (
            <ResultDetail result={selectedStudent.result} questions={questions} />
          ) : selectedStudent.status === GradingStatus.PROCESSING ? (
            <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-slate-200 text-slate-500 p-12">
              <Loader2 size={48} className="animate-spin text-primary mb-4" />
              <h3 className="text-xl font-bold text-slate-800">AI is Grading...</h3>
              <p>Analyzing handwriting and assigning scores.</p>
              <p className="text-sm mt-2">You can grade another student while this runs.</p>
            </div>
          ) : selectedStudent.status === GradingStatus.ERROR ? (
             <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-red-200 text-red-600 p-12">
                <AlertTriangle size={48} className="mb-4" />
                <h3 className="text-xl font-bold">Grading Failed</h3>
                <p>{selectedStudent.error}</p>
                <p className="text-sm mt-4 text-slate-500">Try uploading clearer images.</p>
             </div>
          ) : null
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            Select a student to view details
          </div>
        )}
      </div>
    </div>
  );
};

export default GradingDashboard;