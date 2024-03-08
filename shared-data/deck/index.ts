// v3 deck defs
import ot2StandardDeckV3 from './definitions/3/ot2_standard.json'
import ot2ShortFixedTrashDeckV3 from './definitions/3/ot2_short_trash.json'
import ot3StandardDeckV3 from './definitions/3/ot3_standard.json'

// v4 deck defs
import ot2StandardDeckV4 from './definitions/4/ot2_standard.json'
import ot2ShortFixedTrashDeckV4 from './definitions/4/ot2_short_trash.json'
import ot3StandardDeckV4 from './definitions/4/ot3_standard.json'

<<<<<<< HEAD
// v5 deck defs
import ot2StandardDeckV5 from './definitions/5/ot2_standard.json'
import ot2ShortFixedTrashDeckV5 from './definitions/5/ot2_short_trash.json'
import ot3StandardDeckV5 from './definitions/5/ot3_standard.json'

=======
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import deckExample from './fixtures/3/deckExample.json'

import type { DeckDefinition } from '../js/types'

<<<<<<< HEAD
export * from './types/schemaV5'
=======
export * from './types/schemaV4'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))

export {
  ot2StandardDeckV3,
  ot2ShortFixedTrashDeckV3,
  ot3StandardDeckV3,
  ot2StandardDeckV4,
  ot2ShortFixedTrashDeckV4,
  ot3StandardDeckV4,
<<<<<<< HEAD
  ot2StandardDeckV5,
  ot2ShortFixedTrashDeckV5,
  ot3StandardDeckV5,
=======
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  deckExample,
}

const latestDeckDefinitions = {
<<<<<<< HEAD
  ot2StandardDeckV5,
  ot2ShortFixedTrashDeckV5,
  ot3StandardDeckV5,
=======
  ot2StandardDeckV4,
  ot2ShortFixedTrashDeckV4,
  ot3StandardDeckV4,
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
}

export function getDeckDefinitions(): Record<string, DeckDefinition> {
  return Object.values(
    (latestDeckDefinitions as unknown) as DeckDefinition[]
  ).reduce<Record<string, DeckDefinition>>((acc, deckDef) => {
    return { ...acc, [deckDef.otId]: deckDef }
  }, {})
}
