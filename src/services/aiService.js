const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/environment');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const generateQuestions = async ({ hskLevel, numberOfQuestions, topics, questionTypes }) => {
  const topicsStr =
    topics && topics.length > 0 ? `Focus on these topics: ${topics.join(', ')}.` : '';
  const typesStr = questionTypes.join(', ');

  const prompt = `Generate ${numberOfQuestions} HSK Level ${hskLevel} Chinese learning questions.
${topicsStr}
Question types to include: ${typesStr}

For each question:
- Create clear, educational content appropriate for HSK level ${hskLevel}
- For multiple_choice: provide exactly 4 options (A, B, C, D)
- For fill_blank: provide the sentence with ___ as placeholder and the correct word(s)
- Include the correct answer
- Add explanation in both English and Chinese

Return ONLY a valid JSON array, no markdown formatting, no code blocks:
[
  {
    "content": "Question text",
    "type": "multiple_choice",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": 0,
    "explanation": "Why this is correct"
  }
]`;

  let rawText;
  try {
    const result = await model.generateContent(prompt);
    rawText = result.response.text().trim();
  } catch (err) {
    logger.error('Gemini API Error: %O', err);
    const errorStr = String(err.message || err).toLowerCase();
    
    if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('limit')) {
      throw new AppError('AI generation limit reached for today. Please try again later or wait a moment.', 429);
    }
    
    if (errorStr.includes('safety') || errorStr.includes('candidate')) {
      throw new AppError('The AI could not generate questions for this topic due to safety filters. Please try a different topic.', 400);
    }

    throw new AppError('The AI service is currently overloaded. Please try again in a few seconds.', 502);
  }

  let parsed;
  try {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError('AI returned invalid JSON. Please try again.', 502);
  }

  if (!Array.isArray(parsed)) {
    throw new AppError('AI response is not an array. Please try again.', 502);
  }

  return parsed.map((item) => {
    const questionType = item.type || questionTypes[0];

    const explanation = typeof item.explanation === 'object'
      ? `${item.explanation.en || ''}\n${item.explanation.zh || ''}`.trim()
      : String(item.explanation || '');

    const result = {
      content: item.content || '',
      questionType,
      hskLevel,
      explanation,
      points: 1,
      topics: topics || [],
    };

    if (questionType === 'multiple_choice') {
      result.multipleChoice = {
        options: item.options || [],
        correctAnswer: typeof item.correctAnswer === 'number' ? item.correctAnswer : 0,
      };
    } else if (questionType === 'fill_blank') {
      result.fillBlank = {
        blanks: Array.isArray(item.blanks) ? item.blanks : [String(item.correctAnswer || '')],
        sentences: item.sentences || [item.content || ''],
        hints: item.hints || [],
      };
    }

    return result;
  });
};

module.exports = { generateQuestions };
