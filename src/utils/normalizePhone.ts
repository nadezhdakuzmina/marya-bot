const PHONE_REGEXP = /^(?:\+7|8)(\d{10})$/;

const normalizePhone = (phone: string) => {
  phone = phone.replace(/\s|(|)|-/g, '');
  const match = phone.match(PHONE_REGEXP);

  if (!match) {
    throw new Error('Failed to normalize phone');
  }

  const [_, normalizedPhone] = match;
  return `+7${normalizedPhone}`;
};

export default normalizePhone;
