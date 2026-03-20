import React, { useState, useCallback, useRef } from 'react';
import { Question } from '../types';
import { PlusCircle, Trash2, ArrowRight, Upload, FileText, Info, Download } from 'lucide-react';

interface ExamSetupProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  onNext: () => void;
}

const ExamSetup: React.FC<ExamSetupProps> = ({ questions, setQuestions, onNext }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFormatInfo, setShowFormatInfo] = useState(false);

  const addQuestion = useCallback(() => {
    const newId = (questions.length + 1).toString();
    setQuestions(prev => [
      ...prev, 
      { id: newId, text: '', standardAnswer: '', maxPoints: 10 }
    ]);
  }, [questions.length, setQuestions]);

  const updateQuestion = (id: string, field: keyof Question, value: string | number) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  // Pre-fill a demo if empty
  const loadDemo = () => {
    setQuestions([
      {
        id: "1",
        text: "Actions speak louder than words.",
        standardAnswer: "事实胜于雄辩。",
        maxPoints: 10
      },
      {
        id: "2",
        text: "Technology has changed our lives significantly.",
        standardAnswer: "科技显著地改变了我们的生活。",
        maxPoints: 10
      }
    ]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseQuestionsFromText(text);
        if (parsed.length > 0) {
          setQuestions(parsed);
        } else {
          alert("Could not parse any questions. Please check the file format.");
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const parseQuestionsFromText = (text: string): Question[] => {
    // Robust parsing logic
    // Split by "Question:" to find blocks. Case insensitive.
    // The (?=...) lookahead keeps the delimiter in the split or we can just matching logic.
    
    // Normalize newlines
    const content = text.replace(/\r\n/g, '\n');
    
    // Split based on the keyword "Question:" at the start of a line or generally
    const rawBlocks = content.split(/(?=Question:)/i).filter(b => b.trim().length > 0);
    
    const parsedQuestions: Question[] = [];
    let idCounter = 1;

    for (const block of rawBlocks) {
      // Expecting block to contain "Question: ... Answer: ... Points: ..."
      
      // Find indices
      const qMatch = block.match(/Question:/i);
      const aMatch = block.match(/Answer:/i);
      const pMatch = block.match(/Points:/i);

      if (!qMatch || !aMatch) {
        // Skip malformed blocks that don't at least have Question and Answer
        continue;
      }

      const qStart = qMatch.index! + qMatch[0].length;
      const aStart = aMatch.index!;
      
      const questionText = block.substring(qStart, aStart).trim();
      let answerText = "";
      let points = 10;

      if (pMatch) {
        // Points exist
        const pStart = pMatch.index!;
        answerText = block.substring(aStart + aMatch[0].length, pStart).trim();
        const pointsStr = block.substring(pStart + pMatch[0].length).trim();
        points = parseInt(pointsStr.match(/\d+/)?.[0] || "10", 10);
      } else {
        // No points specified, take rest of string
        answerText = block.substring(aStart + aMatch[0].length).trim();
      }

      if (questionText && answerText) {
        parsedQuestions.push({
          id: (idCounter++).toString(),
          text: questionText,
          standardAnswer: answerText,
          maxPoints: points || 10
        });
      }
    }
    
    return parsedQuestions;
  };

  const downloadTemplate = () => {
    const template = `Question: The early bird catches the worm.
Answer: 早起的鸟儿有虫吃。
Points: 10

Question: Better late than never.
Answer: 亡羊补牢，为时未晚。
Points: 5`;
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam_template.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Exam Configuration</h2>
          <p className="text-slate-500 text-sm">Define questions manually or import from a text file.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
           >
             <Upload size={16} />
             Import TXT
           </button>
           <button
              onClick={() => setShowFormatInfo(!showFormatInfo)}
              className="p-2 text-slate-400 hover:text-primary transition-colors"
              title="Show Format Info"
           >
             <Info size={20} />
           </button>
           <input
             type="file"
             ref={fileInputRef}
             className="hidden"
             accept=".txt"
             onChange={handleFileUpload}
           />
        </div>
      </div>

      {showFormatInfo && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-slate-700">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              <FileText size={16}/> File Format Guide
            </h4>
            <button 
                onClick={downloadTemplate}
                className="text-xs bg-white border border-blue-200 px-2 py-1 rounded text-blue-600 hover:bg-blue-100 flex items-center gap-1"
            >
                <Download size={12}/> Template
            </button>
          </div>
          <p className="mb-2">Your text file should follow this structure for each question:</p>
          <pre className="bg-white p-3 rounded border border-blue-100 font-mono text-xs overflow-x-auto">
{`Question: [Source Text]
Answer: [Standard Answer]
Points: [Number]

Question: Next question text...
Answer: ...`}
          </pre>
        </div>
      )}

      {questions.length === 0 && !showFormatInfo && (
         <div className="mb-6 p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
            <p className="text-slate-400 mb-4">No questions added yet.</p>
            <div className="flex justify-center gap-4">
                <button 
                    onClick={loadDemo}
                    className="text-primary hover:underline text-sm font-medium"
                >
                    Load Demo Data
                </button>
                <span className="text-slate-300">|</span>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline text-sm font-medium"
                >
                    Import from Text File
                </button>
            </div>
         </div>
      )}

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative group animate-fade-in">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => removeQuestion(q.id)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Remove Question"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-slate-200 text-slate-600 font-bold text-xs px-2 py-1 rounded">Q{index + 1}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Source Text</label>
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                  placeholder="e.g. Actions speak louder than words"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[80px]"
                />
              </div>
              
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Standard Answer</label>
                <textarea
                  value={q.standardAnswer}
                  onChange={(e) => updateQuestion(q.id, 'standardAnswer', e.target.value)}
                  placeholder="e.g. 事实胜于雄辩"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm min-h-[80px]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Points</label>
                <input
                  type="number"
                  min="1"
                  value={q.maxPoints}
                  onChange={(e) => updateQuestion(q.id, 'maxPoints', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 text-primary font-medium hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle size={20} />
          Add Question
        </button>

        <button
          onClick={onNext}
          disabled={questions.length === 0 || questions.some(q => !q.text || !q.standardAnswer)}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all
            ${(questions.length === 0 || questions.some(q => !q.text || !q.standardAnswer)) 
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-primary hover:bg-blue-700 hover:shadow-lg'}`}
        >
          Next Step
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ExamSetup;