const normalizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().trim();
};

const paginate = (page, limit) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;
  return { page: parsedPage, limit: parsedLimit, skip };
};

const buildPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    results: data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  // If data has a meta property, move it to the top level
  if (data && data.meta && data.results) {
    return res.status(statusCode).json({
      success: true,
      message,
      data: data.results,
      meta: data.meta,
    });
  }
  return res.status(statusCode).json({ success: true, message, data });
};

const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message, data: null });
};

const stripAnswers = (question) => {
  const q = question.toObject ? question.toObject() : { ...question };
  if (q.multipleChoice) {
    delete q.multipleChoice.correctAnswer;
  }
  if (q.fillBlank) {
    delete q.fillBlank.blanks;
  }
  return q;
};

module.exports = {
  normalizeString,
  paginate,
  buildPaginatedResponse,
  successResponse,
  errorResponse,
  stripAnswers,
};
