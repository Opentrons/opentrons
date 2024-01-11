import ot2StandardDeckV3 from './definitions/3/ot2_standard.json'
import ot2StandardDeckV4 from './definitions/4/ot2_standard.json'
import type { DeckDefinition } from '../js/types'

export * from './types/schemaV4'

export { ot2StandardDeckV3, ot2StandardDeckV4 }

export function getDeckDefinitions(): Record<string, DeckDefinition> {
  const deckDefinitions: {
    [filePath: string]: DeckDefinition
  } = import.meta.glob('../labware/definitions/2', {
    eager: true,
  })

  return Object.values(deckDefinitions).reduce<Record<string, DeckDefinition>>(
    (acc, deckDef) => {
      return { ...acc, [deckDef.otId]: deckDef }
    },
    {}
  )
}
