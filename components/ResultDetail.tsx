import React from 'react';
import { GradingResult, Question } from '../types';
import { CheckCircle, AlertCircle, FileDown } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import FileSaver from 'file-saver';

interface ResultDetailProps {
  result: GradingResult;
  questions: Question[];
}

const ResultDetail: React.FC<ResultDetailProps> = ({ result, questions }) => {
  const getGradeColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper to render text with <<errors>> in red
  const renderHighlightedText = (text?: string) => {
    if (!text) return <span className="text-slate-400 not-italic text-sm">No text detected</span>;
    
    // Split by <<...>>
    const parts = text.split(/(<<.*?>>)/g);
    
    return (
      <span>
        {parts.map((part, i) => {
          if (part.startsWith('<<') && part.endsWith('>>')) {
            const content = part.slice(2, -2);
            return <span key={i} className="text-red-600 font-bold mx-0.5 underline decoration-red-300 decoration-wavy underline-offset-2">{content}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const handleDownloadDocx = async () => {
    const docChildren: any[] = [
      new Paragraph({
        text: `Grading Report: ${result.studentName || 'Unknown Student'}`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Total Score: ", bold: true, size: 28 }),
          new TextRun({ text: `${result.totalScore} / ${result.maxTotalScore}`, bold: true, size: 28, color: "2563EB" })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    ];

    questions.forEach((q, index) => {
      const grading = result.details.find(d => d.questionId === q.id);
      const score = grading?.score || 0;
      
      docChildren.push(
        new Paragraph({
          text: `Question ${index + 1} (${score}/${q.maxPoints} pts)`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Original: ", bold: true }),
            new TextRun({ text: q.text })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Standard Answer: ", bold: true }),
            new TextRun({ text: q.standardAnswer })
          ]
        })
      );

      // Student Answer with Red Highlights for DOCX
      const answerText = grading?.markedUpAnswer || grading?.studentAnswerTranscription || "(No text detected)";
      const answerRuns: TextRun[] = [new TextRun({ text: "Student Answer: ", bold: true })];
      
      // Parse <<...>> for docx
      const parts = answerText.split(/(<<.*?>>)/g);
      parts.forEach(part => {
        if (part.startsWith('<<') && part.endsWith('>>')) {
           answerRuns.push(new TextRun({
             text: part.slice(2, -2),
             color: "DC2626", // Red
             bold: true,
             italics: true
           }));
        } else {
           answerRuns.push(new TextRun({
             text: part,
             italics: true
           }));
        }
      });

      docChildren.push(
        new Paragraph({
          children: answerRuns,
          spacing: { before: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Feedback: ", bold: true }),
            new TextRun({ text: grading?.feedback || "No feedback." })
          ],
          spacing: { before: 100, after: 200 }
        })
      );

      // Error Table for DOCX
      if (grading?.errors && grading.errors.length > 0) {
         docChildren.push(new Paragraph({ text: "Detailed Errors:", bold: true, spacing: { after: 100 } }));
         
         const tableRows = [
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "错误内容 (Error)", bold: true })], shading: { fill: "F1F5F9" } }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "评价/修正 (Evaluation)", bold: true })], shading: { fill: "F1F5F9" } }),
              ]
            })
         ];

         grading.errors.forEach(err => {
            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: err.errorText, color: "DC2626" })] })] }),
                  new TableCell({ children: [new Paragraph({ text: err.explanation })] }),
                ]
              })
            );
         });

         docChildren.push(
           new Table({
             rows: tableRows,
             width: { size: 100, type: WidthType.PERCENTAGE },
             borders: {
               top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
               bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
               left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
               right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
               insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
               insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" }
             }
           })
         );
         docChildren.push(new Paragraph({ text: "" })); // Spacer
      }

      docChildren.push(
        new Paragraph({
          text: "--------------------------------------------------",
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren
      }]
    });

    const blob = await Packer.toBlob(doc);
    FileSaver.saveAs(blob, `${result.studentName || 'Student'}_Report.docx`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{result.studentName || 'Unknown Student'}</h2>
          <p className="text-slate-500 text-sm">Grading Completed</p>
        </div>
        
        <div className="flex items-center gap-6">
            <div className="text-center">
                <div className={`text-4xl font-extrabold ${getGradeColor(result.totalScore, result.maxTotalScore)}`}>
                    {result.totalScore} <span className="text-xl text-slate-400 font-normal">/ {result.maxTotalScore}</span>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Total Score</div>
            </div>
            <button 
              onClick={handleDownloadDocx}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FileDown size={20} />
              Export .docx
            </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, idx) => {
          const grading = result.details.find(d => d.questionId === question.id);
          const score = grading?.score || 0;
          const max = question.maxPoints;
          const deduction = max - score;
          const isFullScore = score === max;

          return (
            <div key={question.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700 text-sm">Question {idx + 1}</span>
                <div className="flex items-center gap-2">
                  {deduction > 0 && (
                    <span className="text-red-500 font-bold text-sm bg-red-50 px-2 py-0.5 rounded">
                      -{deduction}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-bold ${isFullScore ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                    {score} / {max} pts
                  </span>
                </div>
              </div>
              
              <div className="p-5 grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                   <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Original</span>
                      <p className="font-medium text-slate-800 mt-1">{question.text}</p>
                   </div>
                   <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Standard Answer</span>
                      <p className="font-medium text-green-700 mt-1">{question.standardAnswer}</p>
                   </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="flex justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Student Answer</h4>
                  </div>
                  <p className="text-slate-700 font-serif italic text-lg mb-3 leading-relaxed">
                     {/* Use markedUpAnswer if available, otherwise fallback to plain transcription */}
                     {grading?.markedUpAnswer 
                        ? renderHighlightedText(grading.markedUpAnswer)
                        : (grading?.studentAnswerTranscription || <span className="text-slate-400 not-italic text-sm">No text detected</span>)
                     }
                  </p>
                  
                  {/* Error Table */}
                  {grading?.errors && grading.errors.length > 0 && (
                    <div className="mt-4 mb-2 overflow-hidden rounded-lg border border-red-100">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-red-50 text-red-800 font-semibold">
                          <tr>
                            <th className="px-3 py-2 w-1/3">错误内容</th>
                            <th className="px-3 py-2">评价/修正</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100 bg-white">
                          {grading.errors.map((err, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-red-600 font-medium">{err.errorText}</td>
                              <td className="px-3 py-2 text-slate-600">{err.explanation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {grading && (
                    <div className="flex gap-2 items-start text-sm text-slate-600 border-t border-slate-200 pt-3 mt-2">
                        {isFullScore ? <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> : <AlertCircle size={16} className="text-yellow-500 mt-0.5 shrink-0" />}
                        <p><span className="font-semibold">Overall Feedback:</span> {grading.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultDetail;