import { describe, expect, it } from 'vitest'
import {
  getAreSlotsAdjacent,
  getAreSlotsHorizontallyAdjacent,
  getAreSlotsVerticallyAdjacent,
} from '../helpers'

describe('getAreSlotsHorizontallyAdjacent', () => {
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
describe('getAreSlotsVerticallyAdjacent', () => {
  it('should return false if a slots are falsey', () => {
    expect(getAreSlotsVerticallyAdjacent(null, null)).toBe(false)
    expect(getAreSlotsVerticallyAdjacent()).toBe(false)
    expect(getAreSlotsVerticallyAdjacent('1')).toBe(false)
    expect(getAreSlotsVerticallyAdjacent(null, '1')).toBe(false)
    expect(getAreSlotsVerticallyAdjacent('1', null)).toBe(false)
  })
  it('should return false if called with a non numerical slot', () => {
    expect(getAreSlotsVerticallyAdjacent('1', 'not a numerical slot')).toBe(
      false
    )
  })
  it('should return false if called with a slot that is larger than the number of slots in the deck def', () => {
    expect(getAreSlotsVerticallyAdjacent('1', '12')).toBe(false) // trash slot does not count
    expect(getAreSlotsVerticallyAdjacent('1', '13')).toBe(false)
  })
  it('should return false if the slots horizontally adjacent', () => {
    expect(getAreSlotsVerticallyAdjacent('1', '2')).toBe(false)
    expect(getAreSlotsVerticallyAdjacent('2', '3')).toBe(false)
    expect(getAreSlotsVerticallyAdjacent('4', '5')).toBe(false)
  })
  it('should return false if slots are vetical but separated by a slot', () => {
    expect(getAreSlotsVerticallyAdjacent('1', '7')).toBe(false)
    expect(getAreSlotsVerticallyAdjacent('2', '8')).toBe(false)
    expect(getAreSlotsVerticallyAdjacent('3', '9')).toBe(false)
  })
  it('should return true if the slots vertically adjacent', () => {
    expect(getAreSlotsVerticallyAdjacent('1', '4')).toBe(true)
    expect(getAreSlotsVerticallyAdjacent('2', '5')).toBe(true)
    expect(getAreSlotsVerticallyAdjacent('3', '6')).toBe(true)
    expect(getAreSlotsVerticallyAdjacent('4', '7')).toBe(true)
    expect(getAreSlotsVerticallyAdjacent('5', '8')).toBe(true)
    expect(getAreSlotsVerticallyAdjacent('6', '9')).toBe(true)
    expect(getAreSlotsVerticallyAdjacent('7', '10')).toBe(true)
    expect(getAreSlotsVerticallyAdjacent('8', '11')).toBe(true)
  })
})
describe('getAreSlotsAdjacent', () => {
  it('should return false if a slots are falsey', () => {
    expect(getAreSlotsAdjacent(null, null)).toBe(false)
    expect(getAreSlotsAdjacent()).toBe(false)
    expect(getAreSlotsAdjacent('1')).toBe(false)
    expect(getAreSlotsAdjacent(null, '1')).toBe(false)
    expect(getAreSlotsAdjacent('1', null)).toBe(false)
  })
  it('should return false if called with a non numerical slot', () => {
    expect(getAreSlotsAdjacent('1', 'not a numerical slot')).toBe(false)
  })
  it('should return false if called with a slot that is larger than the number of slots in the deck def', () => {
    expect(getAreSlotsAdjacent('1', '12')).toBe(false) // trash slot does not count
    expect(getAreSlotsAdjacent('1', '13')).toBe(false)
  })
  it('should return false if slots are horizontal but separated by a slot', () => {
    expect(getAreSlotsHorizontallyAdjacent('1', '3')).toBe(false)
    expect(getAreSlotsHorizontallyAdjacent('4', '6')).toBe(false)
    expect(getAreSlotsHorizontallyAdjacent('7', '9')).toBe(false)
  })
  it('should return false if slots are vetical but separated by a slot', () => {
    expect(getAreSlotsAdjacent('1', '7')).toBe(false)
    expect(getAreSlotsAdjacent('2', '8')).toBe(false)
    expect(getAreSlotsAdjacent('3', '9')).toBe(false)
  })
  it('should return true if the slots adjacent', () => {
    // horizontally
    expect(getAreSlotsHorizontallyAdjacent('1', '2')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('2', '3')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('4', '5')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('5', '6')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('7', '8')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('8', '9')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('8', '9')).toBe(true)
    expect(getAreSlotsHorizontallyAdjacent('10', '11')).toBe(true)
    // vertically
    expect(getAreSlotsAdjacent('1', '4')).toBe(true)
    expect(getAreSlotsAdjacent('2', '5')).toBe(true)
    expect(getAreSlotsAdjacent('3', '6')).toBe(true)
    expect(getAreSlotsAdjacent('4', '7')).toBe(true)
    expect(getAreSlotsAdjacent('5', '8')).toBe(true)
    expect(getAreSlotsAdjacent('6', '9')).toBe(true)
    expect(getAreSlotsAdjacent('7', '10')).toBe(true)
    expect(getAreSlotsAdjacent('8', '11')).toBe(true)
  })
})
