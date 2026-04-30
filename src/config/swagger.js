const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HSK Quiz API',
      version: '1.0.0',
      description: 'REST API for HSK Chinese language quiz application',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ─── Auth ────────────────────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'username'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            username: { type: 'string', minLength: 3, maxLength: 30, example: 'hsk_learner' },
            fullName: { type: 'string', example: 'Nguyen Van A' },
            hskLevel: { type: 'integer', enum: [1, 2, 3, 4, 5, 6], default: 1 },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6639a1f3e2b4c1234567890a' },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'hsk_learner' },
            fullName: { type: 'string', example: 'Nguyen Van A' },
            hskLevel: { type: 'integer', example: 3 },
            role: { type: 'string', enum: ['user', 'admin', 'teacher'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              },
            },
          },
        },
        // ─── Quiz ────────────────────────────────────────────────────────────
        Quiz: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'HSK 3 - Food Vocabulary' },
            description: { type: 'string' },
            hskLevel: { type: 'integer', enum: [1, 2, 3, 4, 5, 6], example: 3 },
            totalQuestions: { type: 'integer', example: 20 },
            duration: { type: 'integer', description: 'Minutes', example: 30 },
            passingScore: { type: 'integer', description: 'Percentage', example: 70 },
            generatedByAI: { type: 'boolean', example: true },
            isPublished: { type: 'boolean', example: true },
            totalAttempts: { type: 'integer', example: 42 },
            averageScore: { type: 'number', example: 78.5 },
            createdBy: { type: 'string', example: '6639a1f3e2b4c1234567890a' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        GenerateQuizRequest: {
          type: 'object',
          required: ['title', 'hskLevel', 'numberOfQuestions'],
          properties: {
            title: { type: 'string', example: 'HSK 3 - Food Vocabulary' },
            description: { type: 'string', example: 'Quiz luyện từ vựng HSK 3 chủ đề ẩm thực' },
            hskLevel: { type: 'integer', enum: [1, 2, 3, 4, 5, 6], example: 3 },
            numberOfQuestions: { type: 'integer', minimum: 1, maximum: 50, example: 20 },
            topics: { type: 'array', items: { type: 'string' }, example: ['food', 'restaurant'] },
            questionTypes: {
              type: 'array',
              items: { type: 'string', enum: ['multiple_choice', 'fill_blank'] },
              example: ['multiple_choice'],
            },
          },
        },
        CreateQuizRequest: {
          type: 'object',
          required: ['title', 'hskLevel', 'totalQuestions'],
          properties: {
            title: { type: 'string', example: 'HSK 2 - Greetings' },
            description: { type: 'string' },
            hskLevel: { type: 'integer', enum: [1, 2, 3, 4, 5, 6], example: 2 },
            totalQuestions: { type: 'integer', minimum: 1, maximum: 100, example: 10 },
            duration: { type: 'integer', minimum: 5, maximum: 180, default: 30, example: 20 },
            passingScore: { type: 'integer', minimum: 0, maximum: 100, default: 70, example: 70 },
          },
        },
        // ─── Question ────────────────────────────────────────────────────────
        QuestionOption: {
          type: 'object',
          properties: {
            options: { type: 'array', items: { type: 'string' }, example: ['Hello', 'Thank you', 'Goodbye', 'Sorry'] },
          },
        },
        Question: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            quizId: { type: 'string' },
            content: { type: 'string', example: 'What is the meaning of 你好?' },
            questionType: { type: 'string', enum: ['multiple_choice', 'fill_blank', 'essay'] },
            hskLevel: { type: 'integer', enum: [1, 2, 3, 4, 5, 6] },
            multipleChoice: {
              type: 'object',
              properties: {
                options: { type: 'array', items: { type: 'string' } },
              },
              description: 'correctAnswer field is excluded from responses',
            },
            fillBlank: {
              type: 'object',
              properties: {
                sentences: { type: 'array', items: { type: 'string' } },
                hints: { type: 'array', items: { type: 'string' } },
              },
              description: 'blanks field is excluded from responses',
            },
            explanation: { type: 'string' },
            points: { type: 'number', example: 1 },
            topics: { type: 'array', items: { type: 'string' } },
          },
        },
        CreateQuestionRequest: {
          type: 'object',
          required: ['quizId', 'content', 'questionType', 'hskLevel'],
          properties: {
            quizId: { type: 'string', example: '6639a1f3e2b4c1234567890b' },
            content: { type: 'string', example: 'What is 学生 in English?' },
            questionType: { type: 'string', enum: ['multiple_choice', 'fill_blank', 'essay'], example: 'multiple_choice' },
            hskLevel: { type: 'integer', enum: [1, 2, 3, 4, 5, 6], example: 2 },
            multipleChoice: {
              type: 'object',
              properties: {
                options: { type: 'array', items: { type: 'string' }, example: ['Student', 'Teacher', 'Book', 'Pen'] },
                correctAnswer: { type: 'integer', description: 'Index of correct option', example: 0 },
              },
            },
            fillBlank: {
              type: 'object',
              properties: {
                blanks: { type: 'array', items: { type: 'string' }, example: ['学生'] },
                sentences: { type: 'array', items: { type: 'string' }, example: ['我是一个___。'] },
                hints: { type: 'array', items: { type: 'string' } },
              },
            },
            explanation: { type: 'string', example: '学生 means student in English.' },
            points: { type: 'number', minimum: 0.5, maximum: 10, default: 1, example: 1 },
            topics: { type: 'array', items: { type: 'string' }, example: ['education'] },
          },
        },
        // ─── Attempt ─────────────────────────────────────────────────────────
        Attempt: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            quizId: { type: 'string' },
            status: { type: 'string', enum: ['in_progress', 'submitted', 'graded'] },
            startedAt: { type: 'string', format: 'date-time' },
            submittedAt: { type: 'string', format: 'date-time' },
            totalScore: { type: 'number' },
            passedStatus: { type: 'boolean' },
            summary: {
              type: 'object',
              properties: {
                totalQuestions: { type: 'integer' },
                answeredQuestions: { type: 'integer' },
                correctAnswers: { type: 'integer' },
                wrongAnswers: { type: 'integer' },
                percentage: { type: 'number' },
                timeSpentSeconds: { type: 'integer' },
              },
            },
          },
        },
        SubmitAnswerRequest: {
          type: 'object',
          required: ['questionId', 'userAnswer'],
          properties: {
            questionId: { type: 'string', example: '6639a1f3e2b4c1234567890c' },
            userAnswer: {
              oneOf: [
                { type: 'integer', description: 'Index for multiple_choice', example: 0 },
                { type: 'string', description: 'Text for fill_blank', example: '你好' },
              ],
            },
            timeSpent: { type: 'integer', description: 'Seconds spent on this question', example: 45 },
          },
        },
        // ─── Result ──────────────────────────────────────────────────────────
        Result: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            attemptId: { type: 'string' },
            userId: { type: 'string' },
            quizId: { type: 'string' },
            score: { type: 'number', example: 17 },
            percentage: { type: 'number', example: 85 },
            passed: { type: 'boolean', example: true },
            timeSpent: { type: 'integer', description: 'Seconds', example: 1200 },
            correctAnswers: { type: 'integer', example: 17 },
            wrongAnswers: { type: 'integer', example: 3 },
            analysis: {
              type: 'object',
              properties: {
                strengths: { type: 'array', items: { type: 'string' } },
                weaknesses: { type: 'array', items: { type: 'string' } },
                recommendations: { type: 'array', items: { type: 'string' } },
                byQuestionType: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      correct: { type: 'integer' },
                      total: { type: 'integer' },
                      percentage: { type: 'number' },
                    },
                  },
                },
              },
            },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: { type: 'string' },
                  questionContent: { type: 'string' },
                  questionType: { type: 'string' },
                  userAnswer: {},
                  correctAnswer: {},
                  isCorrect: { type: 'boolean' },
                  pointsEarned: { type: 'number' },
                  explanation: { type: 'string' },
                  timeSpent: { type: 'integer' },
                },
              },
            },
          },
        },
        // ─── Statistics ──────────────────────────────────────────────────────
        Statistics: {
          type: 'object',
          properties: {
            totalAttempts: { type: 'integer', example: 25 },
            totalPassedQuizzes: { type: 'integer', example: 20 },
            averageScore: { type: 'number', example: 82 },
            totalStudyTime: { type: 'integer', description: 'Seconds', example: 36000 },
            currentStreak: { type: 'integer', example: 5 },
            longestStreak: { type: 'integer', example: 12 },
            levelStatistics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  level: { type: 'integer' },
                  attempts: { type: 'integer' },
                  passed: { type: 'integer' },
                  averageScore: { type: 'number' },
                  bestScore: { type: 'number' },
                  lastAttempt: { type: 'string', format: 'date-time' },
                },
              },
            },
            questionTypeStats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  correct: { type: 'integer' },
                  total: { type: 'integer' },
                  percentage: { type: 'number' },
                },
              },
            },
          },
        },
        // ─── Shared ──────────────────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
            data: { type: 'object', nullable: true, example: null },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array', items: {} },
                total: { type: 'integer', example: 50 },
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                totalPages: { type: 'integer', example: 5 },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid JWT token',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Invalid request body',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & user profile' },
      { name: 'Quizzes', description: 'Quiz management & AI generation' },
      { name: 'Questions', description: 'Question CRUD (admin/teacher)' },
      { name: 'Attempts', description: 'Taking a quiz — start, answer, submit' },
      { name: 'Results', description: 'Detailed result & analysis after submission' },
      { name: 'Statistics', description: 'User progress & leaderboard' },
    ],
    paths: {
      // ═══════════════════════════ AUTH ═══════════════════════════════════════
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
          },
          responses: {
            201: { description: 'User registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            400: { $ref: '#/components/responses/ValidationError' },
            409: { description: 'Email or username already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT token',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout (invalidates session server-side)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Logged out successfully' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'User profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
        put: {
          tags: ['Auth'],
          summary: 'Update current user profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string' },
                    hskLevel: { type: 'integer', enum: [1, 2, 3, 4, 5, 6] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Profile updated' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      // ═══════════════════════════ QUIZZES ════════════════════════════════════
      '/quizzes': {
        get: {
          tags: ['Quizzes'],
          summary: 'List quizzes with pagination (public)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'hskLevel', in: 'query', schema: { type: 'integer', enum: [1, 2, 3, 4, 5, 6] } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'generatedByAI', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: {
            200: { description: 'Paginated quiz list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
          },
        },
        post: {
          tags: ['Quizzes'],
          summary: 'Create quiz manually (admin/teacher)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateQuizRequest' } } },
          },
          responses: {
            201: { description: 'Quiz created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/quizzes/generate': {
        post: {
          tags: ['Quizzes'],
          summary: 'Generate quiz with AI — Claude API (admin/teacher)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateQuizRequest' } } },
          },
          responses: {
            201: { description: 'Quiz generated and saved' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            502: { description: 'AI generation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/quizzes/{quizId}': {
        get: {
          tags: ['Quizzes'],
          summary: 'Get quiz details with questions (answers hidden)',
          parameters: [{ name: 'quizId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Quiz with questions (correctAnswer excluded)', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        put: {
          tags: ['Quizzes'],
          summary: 'Update quiz (admin/teacher)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'quizId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateQuizRequest' } } },
          },
          responses: {
            200: { description: 'Quiz updated' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Quizzes'],
          summary: 'Delete quiz (admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'quizId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Quiz deleted' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      // ═══════════════════════════ QUESTIONS ══════════════════════════════════
      '/questions': {
        post: {
          tags: ['Questions'],
          summary: 'Create a question (admin/teacher)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateQuestionRequest' } } },
          },
          responses: {
            201: { description: 'Question created' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/questions/{questionId}': {
        get: {
          tags: ['Questions'],
          summary: 'Get question by ID (admin/teacher)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'questionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Question data' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        put: {
          tags: ['Questions'],
          summary: 'Update question (admin/teacher)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'questionId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateQuestionRequest' } } },
          },
          responses: {
            200: { description: 'Question updated' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Questions'],
          summary: 'Delete question (admin/teacher)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'questionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Question deleted' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      // ═══════════════════════════ ATTEMPTS ═══════════════════════════════════
      '/attempts/start/{quizId}': {
        post: {
          tags: ['Attempts'],
          summary: 'Start a quiz attempt (resumes if in-progress exists)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'quizId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Existing in-progress attempt resumed' },
            201: { description: 'New attempt started', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/attempts/{attemptId}/submit-answer': {
        post: {
          tags: ['Attempts'],
          summary: 'Save a single answer (not graded yet)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'attemptId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitAnswerRequest' } } },
          },
          responses: {
            200: { description: 'Answer saved' },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/attempts/{attemptId}/submit': {
        post: {
          tags: ['Attempts'],
          summary: 'Submit quiz — triggers grading, creates Result, updates statistics',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'attemptId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Quiz graded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          attempt: { $ref: '#/components/schemas/Attempt' },
                          result: { $ref: '#/components/schemas/Result' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/attempts': {
        get: {
          tags: ['Attempts'],
          summary: "List current user's attempts",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['in_progress', 'submitted', 'graded'] } },
          ],
          responses: {
            200: { description: 'Paginated attempts', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/attempts/{attemptId}': {
        get: {
          tags: ['Attempts'],
          summary: 'Get attempt details (own or admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'attemptId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Attempt data', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      // ═══════════════════════════ RESULTS ════════════════════════════════════
      '/results/{attemptId}': {
        get: {
          tags: ['Results'],
          summary: 'Get detailed result with answer review and AI analysis',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'attemptId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Full result with analysis', content: { 'application/json': { schema: { $ref: '#/components/schemas/Result' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      // ═══════════════════════════ STATISTICS ═════════════════════════════════
      '/statistics': {
        get: {
          tags: ['Statistics'],
          summary: "Get current user's learning statistics",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'timeRange', in: 'query', schema: { type: 'string', enum: ['week', 'month', 'all'], default: 'all' } },
          ],
          responses: {
            200: { description: 'User statistics', content: { 'application/json': { schema: { $ref: '#/components/schemas/Statistics' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/statistics/comparison': {
        get: {
          tags: ['Statistics'],
          summary: 'Compare user average vs global average',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Comparison data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      userAverageScore: { type: 'number' },
                      globalAverageScore: { type: 'number' },
                      userRank: { type: 'integer' },
                      totalUsers: { type: 'integer' },
                      percentile: { type: 'number' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/statistics/leaderboard': {
        get: {
          tags: ['Statistics'],
          summary: 'Top 10 users by average score (min 5 attempts)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Leaderboard entries' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
