import ot2DeckDef from '../../../deck/definitions/3/ot2_standard.json'
import ot3DeckDef from '../../../deck/definitions/3/ot3_standard.json'
import { getDeckDefFromRobotName } from '..'

describe('getDeckDefFromRobotName', () => {
  it('should return an OT-2 deck when the protocol is for an OT-2', () => {
    expect(getDeckDefFromRobotName('OT-2 Standard')).toBe(ot2DeckDef)
  })
  it('should return an OT-3 deck when the protocol is for an OT-3', () => {
    expect(getDeckDefFromRobotName('OT-3 Standard')).toBe(ot3DeckDef)
  })
})
