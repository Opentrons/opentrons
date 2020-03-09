// @flow
import { makeMaskToDecimal, maskToInteger, maskLoadName } from '../fieldMasks'

// TODO(Ian, 2019-07-23): some fancy util could make these tests much less verbose

describe('makeMaskToDecimal', () => {
  it('1 decimal', () => {
    const maskTo1Decimal = makeMaskToDecimal(1)
    expect(maskTo1Decimal('', '1')).toEqual('1')
    expect(maskTo1Decimal('1', '1.')).toEqual('1.')
    expect(maskTo1Decimal('1.', '1.2')).toEqual('1.2')
    // no more decimals
    expect(maskTo1Decimal('1.2', '1.23')).toEqual('1.2')
    // no invalid chars
    expect(maskTo1Decimal('1.2', '1.2a')).toEqual('1.2')
    // can delete
    expect(maskTo1Decimal('1.2', '1.')).toEqual('1.')
    expect(maskTo1Decimal('1', '')).toEqual('')
    // allow leading dot
    expect(maskTo1Decimal('', '.')).toEqual('.')
    expect(maskTo1Decimal('.', '.1')).toEqual('.1')
    // but not too much
    expect(maskTo1Decimal('.1', '.12')).toEqual('.1')
  })

  it('2 decimal', () => {
    const maskTo2Decimal = makeMaskToDecimal(2)
    expect(maskTo2Decimal('', '1')).toEqual('1')
    expect(maskTo2Decimal('1', '1.')).toEqual('1.')
    expect(maskTo2Decimal('1.', '1.2')).toEqual('1.2')
    expect(maskTo2Decimal('1.2', '1.23')).toEqual('1.23')
    // no more decimals
    expect(maskTo2Decimal('1.23', '1.234')).toEqual('1.23')
    // no invalid chars
    expect(maskTo2Decimal('1.2', '1.2a')).toEqual('1.2')
    // can delete
    expect(maskTo2Decimal('1.23', '1.2')).toEqual('1.2')
    expect(maskTo2Decimal('1.2', '1.')).toEqual('1.')
    expect(maskTo2Decimal('1', '')).toEqual('')
    // allow leading dot
    expect(maskTo2Decimal('', '.')).toEqual('.')
    expect(maskTo2Decimal('.', '.1')).toEqual('.1')
    expect(maskTo2Decimal('.1', '.12')).toEqual('.12')
    // but not too much
    expect(maskTo2Decimal('.12', '.123')).toEqual('.12')
  })
})

describe('maskToInteger', () => {
  it('ignores bad chars', () => {
    expect(maskToInteger('', 'x')).toEqual('')
    expect(maskToInteger('1', 'x')).toEqual('1')
    expect(maskToInteger('1', ' ')).toEqual('1')
    expect(maskToInteger('1', '1.')).toEqual('1')
  })

  it('allows [0-9]', () => {
    expect(maskToInteger('', '0')).toEqual('0')
    expect(maskToInteger('', '5')).toEqual('5')
    expect(maskToInteger('1', '12')).toEqual('12')
    expect(maskToInteger('12', '123')).toEqual('123')
  })

  it('allows delete', () => {
    expect(maskToInteger('1', '')).toEqual('')
  })
})

describe('maskLoadName', () => {
  it('lowercases capital letters', () => {
    expect(maskLoadName('', 'X')).toEqual('x')
    expect(maskLoadName('la', 'laB')).toEqual('lab')
  })
  it('allows accepted chars', () => {
    expect(maskLoadName('', 'a')).toEqual('a')
    expect(maskLoadName('la', 'la_')).toEqual('la_')
    expect(maskLoadName('la', 'la.')).toEqual('la.')
  })
  it('ignores bad chars', () => {
    expect(maskLoadName('', '-')).toEqual('')
    expect(maskLoadName('a', 'a-')).toEqual('a')
  })
  it('allows delete', () => {
    expect(maskLoadName('a', '')).toEqual('')
  })
})
