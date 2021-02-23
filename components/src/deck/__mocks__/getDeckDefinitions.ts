s
import assert from 'assert'
import path from 'path'
// replace webpack-specific require.context with Node-based glob in tests
import glob from 'glob'

const DECK_FIXTURE_PATTERN = path.join(
  __dirname,
  '../../../../shared-data/deck/fixtures/1/*.json'
)

const allDecks = glob.sync(DECK_FIXTURE_PATTERN).map(require)

assert(
  allDecks.length > 0,
  `no deck fixtures found, is the path correct? ${DECK_FIXTURE_PATTERN}`
)

export const getDeckDefinitions = jest.fn(() =>
  allDecks.reduce(deck => ({ [deck.otId]: deck }), {})
)
