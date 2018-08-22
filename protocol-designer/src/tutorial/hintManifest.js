// @flow

type Hint = {title: string, body: string}

const hintManifest: {[string]: Hint} = {
  add_liquids_and_labware: {
    title: 'Add Liquids to Deck',
    body: "Go to Starting Deck State and hover over labware to specify where liquids start before the robot starts moving."
  }
}

export type HintKey = $Keys<typeof hintManifest>

export default hintManifest
