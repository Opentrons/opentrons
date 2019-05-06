// File transformer for Jest
// Makes asset filenames appear in snapshots
// see https://facebook.github.io/jest/docs/en/webpack.html
import path from 'path'
// replace webpack-specific require.context with Node-based glob in tests
import glob from 'glob'

const DECK_FIXTURE_PATTERN = path.join(
  __dirname,
  '../../../shared-data/js/__tests__/fixtures/decks/*.json'
)

const allDecks = glob.sync(DECK_FIXTURE_PATTERN).map(require)

export const getDeckDefinitions = jest.fn(() =>
  allDecks.reduce(deck => ({ [deck.otId]: deck }), {})
)
