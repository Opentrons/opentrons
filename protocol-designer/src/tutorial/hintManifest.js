// @flow

type Hint = {title: string, body: string}

const hintManifest: {[string]: Hint} = {
  add_liquids_and_labware: {
    title: 'Add Liquids to Deck',
    body: "Go to 'Labware & Liquids' and specify where liquids start on the deck before the robot starts moving."
  }
}

export type HintKey = $Keys<typeof hintManifest>

export default hintManifest
