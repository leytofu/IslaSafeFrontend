import { test } from 'node:test'
import assert from 'node:assert/strict'
import { completeOtp, otpDigits, replaceOtpDigit } from '../src/utils/otp.ts'

test('clearing a code resets every visible box', () => {
  assert.deepEqual(otpDigits('123456'), ['1', '2', '3', '4', '5', '6'])
  assert.deepEqual(otpDigits(''), ['', '', '', '', '', ''])
})

test('deleting an interior digit leaves later digits in their original positions', () => {
  const cleared = replaceOtpDigit('123456', 2, '')
  assert.deepEqual(otpDigits(cleared), ['1', '2', '', '4', '5', '6'])
  assert.equal(completeOtp(cleared), false)
  assert.equal(replaceOtpDigit(cleared, 2, '3'), '123456')
})

test('only six numeric digits can trigger verification', () => {
  assert.equal(completeOtp('123456'), true)
  for (const value of ['', '12345', '1234567', '123 56', 'abcdef']) assert.equal(completeOtp(value), false)
})

test('non-numeric input cannot create a valid verification code', () => {
  const invalid = replaceOtpDigit('123456', 2, 'x')
  assert.equal(completeOtp(invalid), false)
  assert.deepEqual(otpDigits(invalid), ['1', '2', '', '4', '5', '6'])
})
