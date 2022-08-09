const PHONE_REGEXP = /^(?:\+7|8)(\d{10})$/;

export const NormalizePhoneError = new Error('Failed to normalize phone');

const normalizePhone = (phone: string) => {
  phone = phone.replace(/\s|(|)|-/g, '');
  const match = phone.match(PHONE_REGEXP);

  if (!match) {
    throw NormalizePhoneError;
  }

  const [_, normalizedPhone] = match;
  return `+7${normalizedPhone}`;
};

export default normalizePhone;
