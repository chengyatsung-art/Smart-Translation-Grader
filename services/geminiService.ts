import { GoogleGenAI, Type } from "@google/genai";
import { Question, GradingResult } from "../types";

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const gradeStudentSubmission = async (
  questions: Question[],
  images: File[]
): Promise<GradingResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Convert all images to base64 parts
  const imageParts = await Promise.all(images.map((file) => fileToGenerativePart(file)));

  // Construct the prompt context
  const questionsContext = questions.map((q, index) => `
    Question ID: ${q.id}
    Original Text: "${q.text}"
    Standard Answer: "${q.standardAnswer}"
    Max Points: ${q.maxPoints}
  `).join('\n---\n');

  const systemInstruction = `
    You are an expert language teacher and grader. Your task is to:
    1. Analyze the provided images of handwritten student work.
    2. Locate the answers corresponding to the provided Questions.
    3. Transcribe the student's handwritten answer accurately (OCR).
       **CRITICAL RULE: Ignore any text that has been crossed out, struck through, or scribbled out by the student. Treat crossed-out text as if it does not exist. Do not transcribe it and do not evaluate it.**
    4. COMPARE the student's valid (non-crossed-out) translation to the Standard Answer.
    5. IDENTIFY specific grammar, vocabulary, or accuracy errors.
    6. GENERATE a "markedUpAnswer" where every specific error within the transcription is wrapped in double angle brackets like <<this is wrong>>.
    7. LIST these errors individually with a specific Chinese evaluation/correction for each.
    8. Assign a score (0 to Max Points) based on accuracy.
    9. Provide a brief overall feedback summary.
    
    If a question is not answered in the images, give it 0 points and note "Not found".
    If you see a student name on the paper, extract it.
  `;

  const promptText = `
    Here is the exam configuration:
    ${questionsContext}

    Please process the attached images and return the grading results in JSON format.
    Ensure "markedUpAnswer" uses << and >> to surround incorrect words (e.g. "I <<has>> a apple").
    Ensure "errors" list contains the text inside the brackets and the explanation in Chinese.
  `;

  // Define the output schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING, description: "Name of the student if found on the paper, else 'Unknown'" },
      totalScore: { type: Type.NUMBER, description: "Sum of all scores assigned" },
      details: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionId: { type: Type.STRING, description: "The ID of the question being graded" },
            studentAnswerTranscription: { type: Type.STRING, description: "Clean OCR text of the student's handwriting (excluding crossed-out text)" },
            markedUpAnswer: { type: Type.STRING, description: "OCR text with <<error>> markers for incorrect parts" },
            score: { type: Type.NUMBER, description: "Score assigned" },
            feedback: { type: Type.STRING, description: "Overall feedback summary" },
            errors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  errorText: { type: Type.STRING, description: "The specific wrong text segment" },
                  explanation: { type: Type.STRING, description: "Explanation of why it is wrong in Chinese" }
                }
              }
            }
          },
          required: ["questionId", "studentAnswerTranscription", "score", "feedback"]
        }
      }
    },
    required: ["totalScore", "details"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [...imageParts, { text: promptText }]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    const parsedResult = JSON.parse(resultText);
    
    // Calculate max total score for frontend display reference
    const maxTotalScore = questions.reduce((acc, q) => acc + q.maxPoints, 0);

    return {
      ...parsedResult,
      maxTotalScore
    };

  } catch (error) {
    console.error("Grading failed:", error);
    throw error;
  }
};