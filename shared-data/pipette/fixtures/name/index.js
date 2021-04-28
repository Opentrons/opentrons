// @flow
// TODO(mc, 2021-04-27): remove or rewrite this file when PD tests are in TS
import pipetteNameSpecFixtures from './pipetteNameSpecFixtures.json'

// import from @opentrons/shared-data instead of relative to pick up
// generated flow types
import type { PipetteNameSpecs } from '@opentrons/shared-data'

export const fixtureP10Single: $Shape<PipetteNameSpecs> =
  pipetteNameSpecFixtures['p10_single']
export const fixtureP10Multi: $Shape<PipetteNameSpecs> =
  pipetteNameSpecFixtures['p10_multi']
export const fixtureP300Single: $Shape<PipetteNameSpecs> =
  pipetteNameSpecFixtures['p300_single']
export const fixtureP300Multi: $Shape<PipetteNameSpecs> =
  pipetteNameSpecFixtures['p300_multi']
export const fixtureP1000Single: $Shape<PipetteNameSpecs> =
  pipetteNameSpecFixtures['p1000_single']
export const fixtureP1000Multi: $Shape<PipetteNameSpecs> =
  pipetteNameSpecFixtures['p1000_multi']
