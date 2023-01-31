const DATE_REGEXP = /^(\d{2})\.(\d{2})\.(\d{4})$/;

export const NormalizeDateError = new Error('Failed to normalize date');

const normalizeDate = (date: string): number => {
  const match = date.match(DATE_REGEXP);

  if (!match) {
    throw NormalizeDateError;
  }

  const [_, dd, mm, YYYY] = match;

  return new Date(`${YYYY}.${mm}.${dd}`).getTime();
};

export default normalizeDate;
