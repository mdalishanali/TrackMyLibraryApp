import { AxiosError, AxiosHeaders } from 'axios';

import { handleStudentLimitError, isStudentLimitError } from '../student-limit-error';

/**
 * Builds an AxiosError shaped exactly like the one axios produces for a real
 * HTTP response, so these tests exercise the same shape the app sees at runtime.
 */
const makeAxiosError = (status: number, data: unknown): AxiosError => {
  const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST');
  error.response = {
    status,
    data,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
};

// The exact body TrackMyLibrary-Server returns from studentController.js
// when a non-Active company is at FREE_STUDENT_LIMIT.
const SERVER_LIMIT_RESPONSE = {
  message:
    'Free limit reached. You can add up to 10 active students on the free plan. Please upgrade to Pro for unlimited students!',
  code: 'LIMIT_REACHED',
};

describe('isStudentLimitError', () => {
  it('matches the server 402 + LIMIT_REACHED response', () => {
    expect(isStudentLimitError(makeAxiosError(402, SERVER_LIMIT_RESPONSE))).toBe(true);
  });

  it('matches on the code alone, even if the status changes', () => {
    expect(isStudentLimitError(makeAxiosError(403, { code: 'LIMIT_REACHED' }))).toBe(true);
  });

  it('matches on a bare 402 with no body', () => {
    expect(isStudentLimitError(makeAxiosError(402, undefined))).toBe(true);
  });

  it('ignores unrelated API failures', () => {
    expect(isStudentLimitError(makeAxiosError(500, { message: 'Server error' }))).toBe(false);
    expect(isStudentLimitError(makeAxiosError(400, { message: 'Validation failed' }))).toBe(false);
  });

  it('ignores non-axios errors', () => {
    expect(isStudentLimitError(new Error('boom'))).toBe(false);
    expect(isStudentLimitError(null)).toBe(false);
    expect(isStudentLimitError(undefined)).toBe(false);
  });
});

describe('handleStudentLimitError', () => {
  it('opens the paywall with the student_limit reason', () => {
    const presentPaywall = jest.fn();
    const handled = handleStudentLimitError(
      makeAxiosError(402, SERVER_LIMIT_RESPONSE),
      presentPaywall,
    );

    expect(handled).toBe(true);
    expect(presentPaywall).toHaveBeenCalledTimes(1);
    expect(presentPaywall).toHaveBeenCalledWith('student_limit');
  });

  it('marks the error handled so nested catches skip their generic alert', () => {
    const error = makeAxiosError(402, SERVER_LIMIT_RESPONSE);
    handleStudentLimitError(error, jest.fn());

    expect((error as { handled?: boolean }).handled).toBe(true);
  });

  it('leaves unrelated errors alone and never opens the paywall', () => {
    const presentPaywall = jest.fn();
    const error = makeAxiosError(500, { message: 'Server error' });

    expect(handleStudentLimitError(error, presentPaywall)).toBe(false);
    expect(presentPaywall).not.toHaveBeenCalled();
    expect((error as { handled?: boolean }).handled).toBeUndefined();
  });
});
