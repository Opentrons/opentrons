// @flow

type HintKey =
  | 'add_liquids_and_labware'

type Hint = {title: string, body: string}

const hintManifest: {[HintKey]: Hint} = {
  add_liquids_and_labware: {
    title: 'Add Liquids to Deck',
    body: "Please add liquids to your deck before creating steps. To add liquids, click on 'Labware & Liquids', hover over your labware, and click 'Name & Liquids'"
  }
}

export default hintManifest
