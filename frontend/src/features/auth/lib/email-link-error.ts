const EXPIRED_CODE = 'otp_expired';

/** Reads the error Supabase appends to the confirmation redirect, if the link failed. */
export function emailLinkError(hash: string, search: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  new URLSearchParams(search).forEach((value, key) => params.set(key, value));
  if (!params.has('error') && !params.has('error_code')) return null;
  return params.get('error_code') === EXPIRED_CODE
    ? 'This link has expired.'
    : 'This link could not be used.';
}
