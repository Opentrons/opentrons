// @flow
import { isValidSlot } from '../utils/isValidSlot'

describe('isValidSlot', () => {
  ;['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].forEach(
    slot => {
      it(`should return true when slot is ${slot}`, () => {
        expect(isValidSlot(slot)).toBe(true)
      })
    }
  )
  ;['-1', '0', '13'].forEach(slot => {
    it(`should return false when slot is ${slot}`, () => {
      expect(isValidSlot(slot)).toBe(false)
    })
  })
})
