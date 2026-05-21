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

  const prompt = `Generate ${numberOfQuestions} HSK Level ${hskLevel} Chinese learning questions for Vietnamese learners.
${topicsStr}
Question types to include: ${typesStr}

Language rules:
- All user-facing instructional text must be in Vietnamese.
- Question content, answer option translations, hints, and explanations must use Vietnamese.
- Chinese characters and pinyin are allowed where they are the learning target.
- Do not use English unless the topic explicitly requires an English word.

For each question:
- Create clear, educational content appropriate for HSK level ${hskLevel}
- For multiple_choice: provide exactly 4 options (A, B, C, D)
- For fill_blank: provide the sentence with ___ as placeholder and the correct word(s)
- Include the correct answer
- Write the explanation in Vietnamese. Do not write explanations in English.
- Chinese words, characters, pinyin, and translations may appear inside the explanation only when needed to teach the answer.

Return ONLY a valid JSON array, no markdown formatting, no code blocks:
[
  {
    "content": "Nội dung câu hỏi bằng tiếng Việt, có thể kèm tiếng Trung cần học",
    "type": "multiple_choice",
    "options": ["Đáp án A bằng tiếng Việt", "Đáp án B bằng tiếng Việt", "Đáp án C bằng tiếng Việt", "Đáp án D bằng tiếng Việt"],
    "correctAnswer": 0,
    "explanation": "Giải thích ngắn gọn bằng tiếng Việt vì sao đáp án này đúng"
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

    const explanation = normalizeExplanation(item.explanation);

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

const normalizeExplanation = (explanation) => {
  if (typeof explanation === 'object' && explanation !== null) {
    const vietnamese = explanation.vi || explanation.vietnamese;
    if (vietnamese) return String(vietnamese).trim();

    return Object.values(explanation)
      .filter((value) => typeof value === 'string' && value.trim())
      .join('\n')
      .trim();
  }

  return String(explanation || '').trim();
};

module.exports = { generateQuestions };
