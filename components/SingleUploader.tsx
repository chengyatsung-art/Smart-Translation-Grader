import React, { useRef, useState, useEffect, useCallback } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

interface SingleUploaderProps {
  onGrade: (name: string, images: File[]) => void;
  onCancel: () => void;
}

const SingleUploader: React.FC<SingleUploaderProps> = ({ onGrade, onCancel }) => {
  const [name, setName] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
    }
    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (images.length === 0) return;
    onGrade(name, images);
    setName('');
    setImages([]);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and Drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Fix: Explicitly cast 'f' to File because Array.from inference might be 'unknown'
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
      if (droppedFiles.length > 0) {
        setImages(prev => [...prev, ...droppedFiles]);
      }
    }
  }, []);

  // Paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const newFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            newFiles.push(file);
          }
        }
      }

      if (newFiles.length > 0) {
        e.preventDefault();
        setImages(prev => [...prev, ...newFiles]);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border p-6 max-w-3xl mx-auto animate-fade-in transition-all
        ${isDragging ? 'border-primary ring-4 ring-primary/10 bg-blue-50/50' : 'border-slate-200'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">New Student Entry</h2>
        <div className="w-6"></div> 
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Student Name (Optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., John Doe"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Translation Photos</label>
          <p className="text-xs text-slate-400 mb-3">
             Drag & drop images here, paste from clipboard (Ctrl+V), or click to upload.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {images.map((file, idx) => (
              <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`preview-${idx}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleUploadClick}
              className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg transition-colors
                ${isDragging 
                  ? 'border-primary bg-white text-primary' 
                  : 'border-slate-300 hover:bg-slate-50 hover:border-primary hover:text-primary text-slate-400'}`}
            >
              <UploadCloud size={24} />
              <span className="text-xs mt-1 font-medium">Add / Paste</span>
            </button>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={images.length === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white shadow-sm transition-all
              ${images.length === 0 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-primary hover:bg-blue-600 hover:shadow'}`}
          >
            Start Grading
            <ImageIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleUploader;