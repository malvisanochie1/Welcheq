import { describe, expect, it } from 'vitest';

import { emailLinkError } from './email-link-error';

describe('emailLinkError', () => {
  it('is empty for a successful confirmation', () => {
    expect(emailLinkError('#access_token=abc&type=signup', '')).toBeNull();
  });

  it('explains an expired link', () => {
    expect(emailLinkError('#error=access_denied&error_code=otp_expired', '')).toMatch(/expired/);
  });

  it('reads errors from the query string too', () => {
    expect(emailLinkError('', '?error=server_error')).not.toBeNull();
  });
});
