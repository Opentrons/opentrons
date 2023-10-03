import { v4 as uuidv4 } from 'uuid'

import type { Fixture } from '../types'

export const DECK_CONFIG_STUB: { [fixtureLocation: string]: Fixture } = {
  B3: { fixtureLocation: 'B3', loadName: 'standardSlot', fixtureId: uuidv4() },
  C3: { fixtureLocation: 'C3', loadName: 'extensionSlot', fixtureId: uuidv4() },
  D3: { fixtureLocation: 'D3', loadName: 'wasteChute', fixtureId: uuidv4() },
}
