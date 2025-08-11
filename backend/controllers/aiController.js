// backend/controllers/aiController.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define API key directly from the .env file
const GEMINI_API_KEY = 'AIzaSyAdZxtmEgM639r03WFNsSm3FJmpLEDGPQw';

// Initialize Google Generative AI with Gemini model
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const askAI = async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log('Processing AI request with message:', message.substring(0, 30) + '...');

    // Use a hardcoded model name that works with the library version
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate content using Gemini
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are SkillSphere AI, a helpful assistant for a mentorship platform. 
              You help users with learning resources, mentorship advice, and technical questions.
              Current context: ${context || 'general question'}
              
              User question: ${message}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    const response = result.response;
    const aiResponse = response.text();
    console.log('AI response successful, length:', aiResponse.length);

    res.json({
      answer: aiResponse
    });
  } catch (error) {
    console.error('AI Error details:', error);
    
    // Always return a user-friendly response
    return res.status(200).json({
      answer: `I'm having trouble connecting to my AI service right now. The specific error is: ${error.message || 'Unknown error'}. Please try again in a few moments or contact support if the issue persists.`
    });
  }
};