import _pipetteNameSpecFixtures from './pipetteNameSpecFixtures.json'
import type { PipetteName, PipetteNameSpecs } from '../../../js'

const pipetteNameSpecFixtures = _pipetteNameSpecFixtures as Record<
  PipetteName,
  PipetteNameSpecs
>

export const fixtureP10Single: PipetteNameSpecs =
  pipetteNameSpecFixtures.p10_single
export const fixtureP10Multi: PipetteNameSpecs =
  pipetteNameSpecFixtures.p10_multi
export const fixtureP300Single: PipetteNameSpecs =
  pipetteNameSpecFixtures.p300_single
export const fixtureP300Multi: PipetteNameSpecs =
  pipetteNameSpecFixtures.p300_multi
export const fixtureP1000Single: PipetteNameSpecs =
  pipetteNameSpecFixtures.p1000_single
export const fixtureP100096: PipetteNameSpecs = pipetteNameSpecFixtures.p1000_96
