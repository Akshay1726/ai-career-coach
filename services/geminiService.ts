import { GoogleGenAI, Type } from "@google/genai";
import type { Job } from '../types';

const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
if (!apiKey) {
  console.warn("API_KEY environment variable not set. Using a mock service.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const jobSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "The job title." },
            company: { type: Type.STRING, description: "A plausible fictional or real company name." },
            description: { type: Type.STRING, description: "A brief, 1-2 sentence description of the role." },
            techStack: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of 3-5 key technologies or skills required for the job, based on the resume."
            },
            experienceLevel: {
                type: Type.STRING,
                description: "The required experience level, e.g., 'Internship', 'Entry-Level', 'Associate'."
            },
            relevance: {
                type: Type.INTEGER,
                description: "A holistic relevance score from 1 to 100, based on skills, experience, and career aspiration alignment."
            },
        },
        required: ["title", "company", "description", "techStack", "experienceLevel", "relevance"]
    }
};

const mockJobs: Job[] = [
    { title: 'Software Engineer Intern', company: 'Innovatech', description: 'Join our dynamic team to work on cutting-edge web applications and gain hands-on experience with cloud technologies.', techStack: ['React', 'TypeScript', 'Node.js', 'AWS'], experienceLevel: 'Internship', relevance: 95 },
    { title: 'Product Manager Intern', company: 'Solutions Co.', description: 'Help define product roadmaps and work cross-functionally with engineering and design to deliver user-centric features.', techStack: ['Agile', 'Market Research', 'JIRA'], experienceLevel: 'Internship', relevance: 88 },
    { title: 'Junior Data Analyst', company: 'Data Insights', description: 'Analyze large datasets to extract meaningful insights, create visualizations, and contribute to data-driven decision-making.', techStack: ['SQL', 'Python', 'Tableau', 'Statistics'], experienceLevel: 'Entry-Level', relevance: 85 },
];

export const getJobMatches = async (resumeText: string): Promise<Job[]> => {
    if (!ai || !navigator.onLine) {
        console.log("Offline or API key not set. Returning mock job matches.");
        return Promise.resolve(mockJobs);
    }

    const prompt = `As an expert AI career coach for students, perform a nuanced analysis of the following resume. Generate a list of 7 diverse, well-suited job and internship opportunities. For each opportunity, provide: a job title, a company name, a brief description, the required experience level (e.g., 'Internship', 'Entry-Level'), and a specific technology stack. Most importantly, generate a highly accurate relevance score from 1-100. This score must be a holistic measure considering not just keyword skill matching, but also the candidate's implied experience level (e.g., projects vs. professional work), potential career aspirations suggested by the resume's summary or objective, and the precise alignment with the required technology stack. Here is the resume: \n\n ${resumeText}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: jobSchema
            }
        });

        const jsonStr = response.text.trim();
        const jobs = JSON.parse(jsonStr);
        return Array.isArray(jobs) ? jobs.sort((a: Job, b: Job) => b.relevance - a.relevance) : [];
    } catch (error) {
        console.error("Error fetching job matches:", error);
        throw new Error("Failed to get job matches from AI. Please try again.");
    }
};

export const getResumeFeedback = async (resumeText: string): Promise<string> => {
    if (!ai || !navigator.onLine) {
        console.log("Offline or API key not set. Returning mock resume feedback.");
        return Promise.resolve("### Offline Mode\n* You are currently offline, so this is mock feedback.\n* Your resume looks promising!\n* Consider quantifying your achievements more by using numbers and metrics to show impact.");
    }
    
    const prompt = `You are an expert career coach reviewing a student's resume. Provide constructive, actionable feedback on the resume below. Focus on improving clarity, impact, and formatting. Structure your feedback into sections with markdown headings: '### Overall Impression', '### Strengths', and '### Areas for Improvement'. Use bullet points starting with '* ' within each section for specific suggestions. Be encouraging and professional. Keep the feedback concise and to the point. Here is the resume: \n\n ${resumeText}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching resume feedback:", error);
        throw new Error("Failed to get resume feedback from AI. Please try again.");
    }
};