import { describe, expect, it } from 'vitest'

import { parseNumericalInput } from '../parseNumericalInput'

describe('parseNumericalInput', () => {
  it('returns empty for an empty string', () => {
    expect(
      parseNumericalInput('', {
        allowDecimal: false,
        allowNegative: false,
      })
    ).toEqual({ result: 'empty' })
  })

  it('parses a complete integer', () => {
    expect(
      parseNumericalInput('5', {
        allowDecimal: false,
        allowNegative: false,
      })
    ).toEqual({
      result: 'success',
      data: 5,
    })
  })

  it('parses a complete decimal value', () => {
    expect(
      parseNumericalInput('1.5', {
        allowDecimal: true,
        allowNegative: false,
      })
    ).toEqual({
      result: 'success',
      data: 1.5,
    })
  })

  it('parses a leading-decimal fraction when decimals are allowed', () => {
    expect(
      parseNumericalInput('.5', {
        allowDecimal: true,
        allowNegative: false,
      })
    ).toEqual({
      result: 'success',
      data: 0.5,
    })
  })

  it('parses a negative decimal with a leading point when both are allowed', () => {
    expect(
      parseNumericalInput('-.5', {
        allowDecimal: true,
        allowNegative: true,
      })
    ).toEqual({
      result: 'success',
      data: -0.5,
    })
  })

  it('parses a negative value when allowed', () => {
    expect(
      parseNumericalInput('-1.25', {
        allowDecimal: true,
        allowNegative: true,
        min: -5,
        max: 5,
      })
    ).toEqual({ result: 'success', data: -1.25 })
  })

  it('returns syntaxError for incomplete decimal input', () => {
    expect(
      parseNumericalInput('1.', {
        allowDecimal: true,
        allowNegative: false,
      })
    ).toEqual({
      result: 'syntaxError',
    })
    expect(
      parseNumericalInput('.', {
        allowDecimal: true,
        allowNegative: false,
      })
    ).toEqual({
      result: 'syntaxError',
    })
    expect(
      parseNumericalInput('-.', {
        allowDecimal: true,
        allowNegative: true,
      })
    ).toEqual({
      result: 'syntaxError',
    })
  })

  it('returns syntaxError for an incomplete negative token', () => {
    expect(
      parseNumericalInput('-', {
        allowDecimal: false,
        allowNegative: true,
      })
    ).toEqual({
      result: 'syntaxError',
    })
  })

  it('returns syntaxError for invalid characters and scientific notation', () => {
    expect(
      parseNumericalInput('abc', {
        allowDecimal: false,
        allowNegative: false,
      })
    ).toEqual({
      result: 'syntaxError',
    })
    expect(
      parseNumericalInput('1a', {
        allowDecimal: false,
        allowNegative: false,
      })
    ).toEqual({
      result: 'syntaxError',
    })
    expect(
      parseNumericalInput('1e10', {
        allowDecimal: false,
        allowNegative: false,
      })
    ).toEqual({
      result: 'syntaxError',
    })
    expect(
      parseNumericalInput('+1', {
        allowDecimal: false,
        allowNegative: false,
      })
    ).toEqual({
      result: 'syntaxError',
    })
  })

  it('returns syntaxError for a decimal when decimals are not allowed', () => {
    expect(
      parseNumericalInput('1.5', {
        allowDecimal: false,
        allowNegative: false,
      })
    ).toEqual({
      result: 'syntaxError',
    })
    expect(
      parseNumericalInput('.5', {
        allowDecimal: false,
        allowNegative: false,
      })
    ).toEqual({
      result: 'syntaxError',
    })
  })

  it('returns syntaxError for a negative when negatives are not allowed', () => {
    expect(
      parseNumericalInput('-1', {
        allowDecimal: false,
        allowNegative: false,
      })
    ).toEqual({
      result: 'syntaxError',
    })
    expect(
      parseNumericalInput('-.5', {
        allowDecimal: true,
        allowNegative: false,
      })
    ).toEqual({
      result: 'syntaxError',
    })
  })

  it('returns success for an in-range integer, including bounds', () => {
    expect(
      parseNumericalInput('5', {
        allowDecimal: false,
        allowNegative: false,
        min: 1,
        max: 10,
      })
    ).toEqual({
      result: 'success',
      data: 5,
    })
    expect(
      parseNumericalInput('1', {
        allowDecimal: false,
        allowNegative: false,
        min: 1,
        max: 10,
      })
    ).toEqual({
      result: 'success',
      data: 1,
    })
    expect(
      parseNumericalInput('10', {
        allowDecimal: false,
        allowNegative: false,
        min: 1,
        max: 10,
      })
    ).toEqual({
      result: 'success',
      data: 10,
    })
  })

  it('returns rangeError when the value is outside the range', () => {
    expect(
      parseNumericalInput('11', {
        allowDecimal: false,
        allowNegative: false,
        min: 1,
        max: 10,
      })
    ).toEqual({
      result: 'rangeError',
      min: 1,
      max: 10,
    })
    expect(
      parseNumericalInput('0', {
        allowDecimal: false,
        allowNegative: false,
        min: 1,
        max: 10,
      })
    ).toEqual({
      result: 'rangeError',
      min: 1,
      max: 10,
    })
  })
})
