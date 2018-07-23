// @flow

type Hint = {title: string, body: string}

const hintManifest: {[string]: Hint} = {
  add_liquids_and_labware: {
    title: 'Add Liquids to Deck',
    body: "Please add liquids to your deck before creating steps. To add liquids, click on 'Labware & Liquids', hover over your labware, and click 'Name & Liquids'"
  }
}

export type HintKey = $Keys<typeof hintManifest>

export default hintManifest
