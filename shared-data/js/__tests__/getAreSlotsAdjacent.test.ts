import { getAreSlotsHorizontallyAdjacent } from '../helpers'

describe('getAreSlotsAdjacent', () => {
  it('should return false if a slots are falsey', () => {
    expect(getAreSlotsHorizontallyAdjacent(null, null)).toBe(false)
    expect(getAreSlotsHorizontallyAdjacent()).toBe(false)
    expect(getAreSlotsHorizontallyAdjacent('1')).toBe(false)
    expect(getAreSlotsHorizontallyAdjacent(null, '1')).toBe(false)
    expect(getAreSlotsHorizontallyAdjacent('1', null)).toBe(false)
  })
  it('should return false if called with a non numerical slot', () => {
    expect(getAreSlotsHorizontallyAdjacent('1', 'not a numerical slot')).toBe(
      false
    )
  })
  it('should return false if called with a slot that is larger than the number of slots in the deck def', () => {
    expect(getAreSlotsHorizontallyAdjacent('1', '12')).toBe(false) // trash slot does not count
    expect(getAreSlotsHorizontallyAdjacent('1', '13')).toBe(false)
  })
  it('should return false if the slots vertically adjacent', () => {
    expect(getAreSlotsHorizontallyAdjacent('1', '4')).toBe(false)
    expect(getAreSlotsHorizontallyAdjacent('2', '5')).toBe(false)
    expect(getAreSlotsHorizontallyAdjacent('3', '6')).toBe(false)
  })
  it('should return false if slots are horizontal but separated by a slot', () => {
    expect(getAreSlotsHorizontallyAdjacent('1', '3')).toBe(false)
    expect(getAreSlotsHorizontallyAdjacent('4', '6')).toBe(false)
    expect(getAreSlotsHorizontallyAdjacent('7', '9')).toBe(false)
  })
  it('should return true if the slots horizontally adjacent', () => {
    expect(getAreSlotsHorizontallyAdjacent('1', '2')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('2', '3')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('4', '5')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('5', '6')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('7', '8')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('8', '9')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('8', '9')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('10', '11')).toBe(true)
  })
})
