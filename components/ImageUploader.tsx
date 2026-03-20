import React, { useRef } from 'react';
import { UploadCloud, X, FileImage, Plus, Trash2, User } from 'lucide-react';
import { StudentSubmission, GradingStatus } from '../types';

interface ImageUploaderProps {
  submissions: StudentSubmission[];
  setSubmissions: React.Dispatch<React.SetStateAction<StudentSubmission[]>>;
  onGrade: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ submissions, setSubmissions, onGrade, onBack, isProcessing }) => {
  
  // Helper to trigger file input for a specific student
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addStudent = () => {
    const newId = Date.now().toString();
    setSubmissions(prev => [
      ...prev,
      { 
        id: newId, 
        name: `Student ${prev.length + 1}`, 
        images: [],
        status: GradingStatus.DRAFT,
        createdAt: Date.now()
      }
    ]);
  };

  const removeStudent = (id: string) => {
    setSubmissions(prev => prev.filter(s => s.id !== id));
  };

  const updateStudentName = (id: string, name: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, studentId: string) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSubmissions(prev => prev.map(s => 
        s.id === studentId ? { ...s, images: [...s.images, ...newFiles] } : s
      ));
    }
    // Reset value to allow same file selection again if needed
    if (e.target) e.target.value = '';
  };

  const removeImage = (studentId: string, imageIndex: number) => {
    setSubmissions(prev => prev.map(s => 
      s.id === studentId 
        ? { ...s, images: s.images.filter((_, i) => i !== imageIndex) } 
        : s
    ));
  };

  const triggerFileInput = (studentId: string) => {
    fileInputRefs.current[studentId]?.click();
  };

  const totalImages = submissions.reduce((acc, s) => acc + s.images.length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Upload Student Work</h2>
            <p className="text-slate-500 text-sm">Organize photos by student. Add multiple students to grade a batch.</p>
          </div>
          <button
            onClick={addStudent}
            className="flex items-center gap-2 bg-blue-50 text-primary px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>

        <div className="space-y-6">
          {submissions.map((student, index) => (
            <div key={student.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 animate-fade-in relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-2 rounded-full border border-slate-200 text-slate-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={student.name}
                  onChange={(e) => updateStudentName(student.id, e.target.value)}
                  placeholder="Student Name (Optional)"
                  className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:outline-none text-lg font-semibold text-slate-800 placeholder-slate-400 w-full max-w-xs transition-all"
                />
                <div className="flex-1"></div>
                {submissions.length > 1 && (
                  <button 
                    onClick={() => removeStudent(student.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2"
                    title="Remove Student"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {student.images.map((file, imgIdx) => (
                  <div key={imgIdx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-white">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`upload-${imgIdx}`} 
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={() => removeImage(student.id, imgIdx)}
                      className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                
                {/* Add Image Button */}
                <button
                  onClick={() => triggerFileInput(student.id)}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg aspect-square hover:border-primary hover:bg-blue-50 transition-colors text-slate-400 hover:text-primary"
                >
                  <UploadCloud size={24} />
                  <span className="text-xs mt-1 font-medium">Add Photo</span>
                </button>
                <input 
                  type="file" 
                  ref={(el) => { fileInputRefs.current[student.id] = el; }}
                  onChange={(e) => handleFileChange(e, student.id)} 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 transition-colors"
        >
          Back to Setup
        </button>

        <button
          onClick={onGrade}
          disabled={totalImages === 0 || isProcessing}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all
            ${(totalImages === 0 || isProcessing) 
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:-translate-y-0.5'}`}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing {submissions.length} Students...
            </>
          ) : (
            <>
              Grade All ({submissions.length})
              <FileImage size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;