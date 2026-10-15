export function otpDigits(value: string): string[] {
  return Array.from({ length: 6 }, (_, index) => /\d/.test(value[index] ?? '') ? value[index] : '')
}

export function replaceOtpDigit(value: string, index: number, digit: string): string {
  const digits = otpDigits(value)
  digits[index] = digit.replace(/\D/g, '').slice(-1)
  // Preserve interior empty positions when a digit is deleted.
  return digits.map((item) => item || ' ').join('').trimEnd()
}

export function completeOtp(value: string): boolean {
  return /^\d{6}$/.test(value)
}
