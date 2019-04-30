// @flow

import assert from 'assert'
import definitions from '../build/decks.json'
import type {DeckDefinition} from './types'

const getDeck = (deckLoadName: string): ?DeckDefinition => {
  const deckDef: ?DeckDefinition = definitions[deckLoadName]
  assert(deckDef, `Deck ${deckLoadName} could not be found`)

  return deckDef
}

export default getDeck
