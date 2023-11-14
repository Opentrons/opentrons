import ot2DeckDef from '../../../deck/definitions/4/ot2_standard.json'
import ot3DeckDef from '../../../deck/definitions/4/ot3_standard.json'
import { getDeckDefFromRobotType } from '..'

describe('getDeckDefFromRobotType', () => {
  it('should return an OT-2 deck when the protocol is for an OT-2', () => {
    expect(getDeckDefFromRobotType('OT-2 Standard')).toBe(ot2DeckDef)
  })
  it('should return an OT-3 deck when the protocol is for an OT-3', () => {
    expect(getDeckDefFromRobotType('OT-3 Standard')).toBe(ot3DeckDef)
  })
})
