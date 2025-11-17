// utils/normalizeAnalysis.js
export function normalizeAnalysis(raw) {
  if (!raw || typeof raw !== "object") return null;

  const {
    stakeholders = [],
    faqs = [],
    future,
    futureQuestions,
    ...rest
  } = raw;

  return {
    stakeholders: Array.isArray(stakeholders) ? stakeholders : [],
    faqs: Array.isArray(faqs) ? faqs : [],
    future:
      Array.isArray(future) && future.length > 0
        ? future
        : Array.isArray(futureQuestions)
        ? futureQuestions
        : [],
    ...rest,
  };
}
