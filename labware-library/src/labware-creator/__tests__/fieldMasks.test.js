// @flow
import { makeMaskToDecimal, maskToInteger, maskLoadName } from '../fieldMasks'

describe('makeMaskToDecimal', () => {
  test('1 decimal', () => {
    const maskTo1Decimal = makeMaskToDecimal(1)
    expect(maskTo1Decimal('', '1')).toEqual('1')
    expect(maskTo1Decimal('1', '1.')).toEqual('1.')
    expect(maskTo1Decimal('1.', '1.2')).toEqual('1.2')
    // no more decimals
    expect(maskTo1Decimal('1.2', '1.23')).toEqual('1.2')
    // no invalid chars
    expect(maskTo1Decimal('1.2', '1.2a')).toEqual('1.2')
  })

  test('2 decimal', () => {
    const maskTo2Decimal = makeMaskToDecimal(1)
    expect(maskTo2Decimal('', '1')).toEqual('1')
    expect(maskTo2Decimal('1', '1.')).toEqual('1.')
    expect(maskTo2Decimal('1.', '1.2')).toEqual('1.2')
    expect(maskTo2Decimal('1.2', '1.23')).toEqual('1.2')
    // no more decimals
    expect(maskTo2Decimal('1.23', '1.234')).toEqual('1.23')
    // no invalid chars
    expect(maskTo2Decimal('1.2', '1.2a')).toEqual('1.2')
  })
})

describe('maskToInteger', () => {
  test('ignores bad chars', () => {
    expect(maskToInteger('', 'x')).toEqual('')
    expect(maskToInteger('1', 'x')).toEqual('1')
    expect(maskToInteger('1', ' ')).toEqual('1')
    expect(maskToInteger('1', '1.')).toEqual('1')
  })

  test('allows [0-9]', () => {
    expect(maskToInteger('', '0')).toEqual('0')
    expect(maskToInteger('', '5')).toEqual('5')
    expect(maskToInteger('1', '12')).toEqual('12')
    expect(maskToInteger('12', '123')).toEqual('123')
  })
})

describe('maskLoadName', () => {
  test('lowercases capital letters', () => {
    expect(maskLoadName('', 'X')).toEqual('x')
    expect(maskLoadName('la', 'laB')).toEqual('lab')
  })
  test('allows accepted chars', () => {
    expect(maskLoadName('', 'a')).toEqual('a')
    expect(maskLoadName('la', 'la_')).toEqual('la_')
    expect(maskLoadName('la', 'la.')).toEqual('la.')
  })
  test('ignores bad chars', () => {
    expect(maskLoadName('', '-')).toEqual('')
    expect(maskLoadName('a', 'a-')).toEqual('a')
  })
})
