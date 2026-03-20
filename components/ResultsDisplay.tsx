import React, { useState } from 'react';
import { GradingResult, Question } from '../types';
import { CheckCircle, AlertCircle, RefreshCcw, User, ChevronRight } from 'lucide-react';

interface ResultsDisplayProps {
  results: GradingResult[];
  questions: Question[];
  onReset: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, questions, onReset }) => {
  const [selectedResultId, setSelectedResultId] = useState<string>(results[0]?.submissionId || '');

  const selectedResult = results.find(r => r.submissionId === selectedResultId) || results[0];

  const getGradeColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 items-start">
      
      {/* Sidebar: Student List */}
      <div className="w-full md:w-1/3 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-700">Student List ({results.length})</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.submissionId}
                onClick={() => setSelectedResultId(result.submissionId)}
                className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left
                  ${selectedResultId === result.submissionId ? 'bg-blue-50 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${selectedResultId === result.submissionId ? 'bg-white text-primary' : 'bg-slate-100 text-slate-400'}`}>
                    <User size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{result.studentName || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">ID: {result.submissionId.slice(-4)}</div>
                  </div>
                </div>
                <div className={`font-bold ${getGradeColor(result.totalScore, result.maxTotalScore)}`}>
                  {result.totalScore}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-primary font-medium bg-white border border-slate-300 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCcw size={18} />
          Grade New Batch
        </button>
      </div>

      {/* Main Content: Detailed Report */}
      <div className="w-full md:w-2/3 space-y-6">
        {selectedResult && (
          <>
            {/* Score Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedResult.studentName || 'Unknown Student'}</h2>
                <p className="text-slate-500 text-sm">Detailed Grading Report</p>
              </div>
              
              <div className="flex items-center gap-6">
                  <div className="text-center">
                      <div className={`text-4xl font-extrabold ${getGradeColor(selectedResult.totalScore, selectedResult.maxTotalScore)}`}>
                          {selectedResult.totalScore} <span className="text-xl text-slate-400 font-normal">/ {selectedResult.maxTotalScore}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Total Score</div>
                  </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-4">
              {questions.map((question) => {
                const grading = selectedResult.details.find(d => d.questionId === question.id);
                const score = grading?.score || 0;
                const isFullScore = score === question.maxPoints;
                const isZero = score === 0;

                return (
                  <div key={question.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                      <span className="font-semibold text-slate-700 text-sm">Question {question.id}</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${isFullScore ? 'bg-green-100 text-green-700' : isZero ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                        {score} / {question.maxPoints} pts
                      </span>
                    </div>
                    
                    <div className="p-5 grid grid-cols-1 gap-6">
                      {/* Context */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                         <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Original</span>
                            <p className="font-medium text-slate-800 mt-1">{question.text}</p>
                         </div>
                         <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Answer</span>
                            <p className="font-medium text-green-700 mt-1">{question.standardAnswer}</p>
                         </div>
                      </div>

                      {/* Student Work */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Student Submission</h4>
                        <p className="text-slate-700 font-serif italic text-lg mb-3">
                           {grading?.studentAnswerTranscription || <span className="text-slate-400 not-italic text-sm">No text detected</span>}
                        </p>
                        
                        {grading && (
                          <div className="flex gap-2 items-start text-sm text-slate-600 border-t border-slate-200 pt-3">
                              {isFullScore ? <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> : <AlertCircle size={16} className="text-yellow-500 mt-0.5 shrink-0" />}
                              <p><span className="font-semibold">Feedback:</span> {grading.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;