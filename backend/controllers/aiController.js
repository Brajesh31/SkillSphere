import { GoogleGenerativeAI } from '@google/generative-ai';

export const askAI = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'AI service is not configured. Set GEMINI_API_KEY on the server.',
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are SkillSphere AI, an assistant for a mentorship platform.
Help with learning resources, mentorship advice, and technical questions.
Current context: ${context || 'general question'}
User question: ${message.trim()}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    return res.json({ answer: result.response.text() });
  } catch (error) {
    console.error('AI request failed:', error.message);
    return res.status(502).json({
      error: 'The AI service could not complete the request. Please try again later.',
    });
  }
};
