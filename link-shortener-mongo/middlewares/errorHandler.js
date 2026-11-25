'use strict';

/** Централизованная обработка ошибок Mongoose/Express. */
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Ошибки валидации схемы Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: Object.values(err.errors).map((item) => item.message)
    });
  }

  // Некорректный ObjectId / приведение типов
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Некорректное значение поля ${err.path}`,
      value: err.value
    });
  }

  // Нарушение уникального индекса (shortCode / alias / email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'поле';
    return res.status(409).json({
      error: `Дубликат: ${field} уже используется`,
      field
    });
  }

  // Ошибка парсинга JSON в express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }

  // Ошибки, созданные через utils/httpError
  if (err.status) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {})
    });
  }

  console.error(err);
  return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
};
