const INDIA_DIAL_CODE = '91';
const INDIAN_MOBILE_NUMBER_LENGTH = 10;
const INDIAN_MOBILE_NUMBER_PATTERN = /^[6-9]\d{9}$/;

const stripNonDigits = (value: string) => value.replace(/\D/g, '');

const getIndianPhoneCandidate = (value: string) => {
  const digits = stripNonDigits(value);

  if (digits.length === INDIAN_MOBILE_NUMBER_LENGTH) {
    return digits;
  }

  if (digits.length === INDIAN_MOBILE_NUMBER_LENGTH + 1 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  if (digits.length === INDIAN_MOBILE_NUMBER_LENGTH + INDIA_DIAL_CODE.length && digits.startsWith(INDIA_DIAL_CODE)) {
    return digits.slice(INDIA_DIAL_CODE.length);
  }

  return digits;
};

export const getIndianPhoneDigits = (value: string) => {
  const digits = getIndianPhoneCandidate(value);

  return digits.slice(0, INDIAN_MOBILE_NUMBER_LENGTH);
};

export const formatIndianPhoneInput = (value: string) => {
  const digits = getIndianPhoneDigits(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

export const isValidIndianPhoneNumber = (value: string) =>
  INDIAN_MOBILE_NUMBER_PATTERN.test(getIndianPhoneCandidate(value));

export const getIndianPhoneLookupVariants = (value: string) => {
  if (!isValidIndianPhoneNumber(value)) {
    const trimmedValue = value.trim();
    return trimmedValue ? [trimmedValue] : [];
  }

  const digits = getIndianPhoneDigits(value);

  return [...new Set([
    digits,
    `0${digits}`,
    `${INDIA_DIAL_CODE}${digits}`,
    `+${INDIA_DIAL_CODE}${digits}`,
  ])];
};

export const toIndianPhoneE164 = (value: string) => {
  const digits = getIndianPhoneDigits(value);
  return isValidIndianPhoneNumber(value) ? `+${INDIA_DIAL_CODE}${digits}` : value.trim();
};
