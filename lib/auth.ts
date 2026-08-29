import * as Linking from 'expo-linking';

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LOGIN_ERROR_MESSAGE = 'メールまたはパスワードが正しくありません';
export const RESET_EMAIL_SENT_MESSAGE =
  '入力されたメールアドレスにアカウントがあれば、再設定用のリンクを送信しました。';

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください`;
  }
  return null;
}

export function authRedirectUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${normalized}`;
  }
  return Linking.createURL(normalized);
}
