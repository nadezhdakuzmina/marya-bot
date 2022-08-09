const DATE_REGEXP = /^(\d{2})\.(\d{2})\.(\d{4})$/;

export const NormalizeBirthdayError = new Error('Failed to normalize phone');

const normalizeBirthday = (date: string): number => {
  if (!DATE_REGEXP.exec(date)) {
    throw NormalizeBirthdayError;
  }

  return new Date(date).getTime();
};

export default normalizeBirthday;
