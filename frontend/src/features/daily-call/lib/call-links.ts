import { Linking } from 'react-native';

const NON_DIGITS = /\D/g;
const NIGERIA_COUNTRY_CODE = '234';

/** WhatsApp needs an international number without "+" or a leading 0. */
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(NON_DIGITS, '');
  return digits.startsWith('0') ? `${NIGERIA_COUNTRY_CODE}${digits.slice(1)}` : digits;
}

export const openPhoneCall = (phone: string) =>
  Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);

export const openWhatsAppCall = (phone: string) =>
  Linking.openURL(`https://wa.me/${whatsappNumber(phone)}`);
