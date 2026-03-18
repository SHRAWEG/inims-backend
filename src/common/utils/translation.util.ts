import { ValidationException } from '../exceptions/validation.exception';
import { SupportedLocale } from '../types/i18n.type';
import { TranslationDto } from '../dto/translation.dto';

/**
 * Validates that 'en' locale is always present in translations array
 */
export function validateTranslations(translations: TranslationDto[]): void {
  const hasEnglish = translations.some((t) => t.locale === 'en');
  if (!hasEnglish) {
    throw new ValidationException({
      locale: ['English (en) translation is required'],
    });
  }
}

/**
 * Resolves a single translation from entity for a given locale
 * Falls back to 'en' if requested locale not found
 */
export function resolveTranslation<T extends { locale: string }>(
  translations: T[],
  locale: SupportedLocale,
): T | undefined {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === 'en')
  );
}
