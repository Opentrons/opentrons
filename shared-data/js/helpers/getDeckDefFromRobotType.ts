import standardOt2DeckDef from '../../deck/definitions/5/ot2_standard.json'
import standardFlexDeckDef from '../../deck/definitions/5/ot3_standard.json'

import type { DeckDefinition, RobotType } from '../types'

export const getDeckDefFromRobotType = (
  robotType: RobotType
): DeckDefinition => {
  return robotType === 'OT-3 Standard'
    ? ((standardFlexDeckDef as unknown) as DeckDefinition)
    : ((standardOt2DeckDef as unknown) as DeckDefinition)
}
