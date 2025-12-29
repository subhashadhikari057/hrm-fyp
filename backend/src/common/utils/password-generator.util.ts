/**
 * Utility class for generating secure random passwords
 */
export class PasswordGeneratorUtil {
  /**
   * Generate a random secure password
   * @param length - Length of the password (default: 12, minimum: 8)
   * @returns A secure random password with uppercase, lowercase, numbers, and symbols
   */
  static generate(length: number = 12): string {
    // Ensure minimum length
    if (length < 8) {
      length = 8;
    }

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    
    // Ensure at least one of each type for security
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable pattern
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Generate a random password with custom character sets
   * @param options - Password generation options
   * @returns A secure random password
   */
  static generateWithOptions(options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    customSymbols?: string;
  }): string {
    const {
      length = 12,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      customSymbols,
    } = options;

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = customSymbols || '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charSet = '';
    let password = '';

    if (includeUppercase) {
      charSet += uppercase;
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
    }
    if (includeLowercase) {
      charSet += lowercase;
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
    }
    if (includeNumbers) {
      charSet += numbers;
      password += numbers[Math.floor(Math.random() * numbers.length)];
    }
    if (includeSymbols) {
      const symbolsToUse = customSymbols || symbols;
      charSet += symbolsToUse;
      password += symbolsToUse[Math.floor(Math.random() * symbolsToUse.length)];
    }

    // Ensure at least one character set is included
    if (charSet.length === 0) {
      throw new Error('At least one character set must be included');
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charSet[Math.floor(Math.random() * charSet.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}

