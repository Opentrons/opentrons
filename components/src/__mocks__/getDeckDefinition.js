// File transformer for Jest
// Makes asset filenames appear in snapshots
// see https://facebook.github.io/jest/docs/en/webpack.html
const path = require('path')
// replace webpack-specific require.context with Node-based glob in tests
const glob = require('glob')
const jest = require('jest-mock')

const DECK_FIXTURE_PATTERN = path.join(
  __dirname,
  '../../../shared-data/js/__tests__/fixtures/decks/*.json'
)

const allDecks = glob.sync(DECK_FIXTURE_PATTERN).map(require)

module.exports = {
  getDeckDefinitions: jest.fn(() =>
    allDecks.reduce(deck => ({ [deck.otId]: deck }), {})
  ),
}
