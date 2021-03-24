import assert from 'assert'
import path from 'path'
// replace webpack-specific require.context with Node-based glob in tests
import glob from 'glob'

import type { DeckDefinition } from '@opentrons/shared-data'

const DECK_FIXTURE_PATTERN = path.join(
  __dirname,
  '../../../../shared-data/deck/fixtures/1/*.json'
)

const allDecks: unknown[] = glob.sync(DECK_FIXTURE_PATTERN).map(require)

assert(
  allDecks.length > 0,
  `no deck fixtures found, is the path correct? ${DECK_FIXTURE_PATTERN}`
)

export const getDeckDefinitions = jest.fn(() =>
  (allDecks as DeckDefinition[]).reduce(
    (acc, deck: DeckDefinition): Record<string, DeckDefinition> => ({
      ...acc,
      [deck.otId]: deck,
    }),
    {}
  )
)
