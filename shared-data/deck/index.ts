// v3 deck defs
import ot2StandardDeckV3 from './definitions/3/ot2_standard.json'
import ot2ShortFixedTrashDeckV3 from './definitions/3/ot2_short_trash.json'
import ot3StandardDeckV3 from './definitions/3/ot3_standard.json'

// v4 deck defs
import ot2StandardDeckV4 from './definitions/4/ot2_standard.json'
import ot2ShortFixedTrashDeckV4 from './definitions/4/ot2_short_trash.json'
import ot3StandardDeckV4 from './definitions/4/ot3_standard.json'

import type { DeckDefinition } from '../js/types'

export * from './types/schemaV4'

export {
  ot2StandardDeckV3,
  ot2ShortFixedTrashDeckV3,
  ot3StandardDeckV3,
  ot2StandardDeckV4,
  ot2ShortFixedTrashDeckV4,
  ot3StandardDeckV4,
}

const latestDeckDefinitions = {
  ot2StandardDeckV4,
  ot2ShortFixedTrashDeckV4,
  ot3StandardDeckV4,
}

export function getDeckDefinitions(): Record<string, DeckDefinition> {
  return Object.values(
    (latestDeckDefinitions as unknown) as DeckDefinition[]
  ).reduce<Record<string, DeckDefinition>>((acc, deckDef) => {
    return { ...acc, [deckDef.otId]: deckDef }
  }, {})
}
