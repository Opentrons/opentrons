import type { InitialDeckSetup, SavedStepFormState } from '../../step-forms'

export function getLabwareOffDeck(
  initialDeckSetup: InitialDeckSetup,
  savedStepFormState: SavedStepFormState,
  labwareId: string
): boolean {
  //  latest moveLabware step related to labwareId
  const moveLabwareStep = Object.values(savedStepFormState)
    .filter(
      state =>
        state.stepType === 'moveLabware' &&
        labwareId != null &&
        state.labware === labwareId
    )
    .reverse()[0]

  if (moveLabwareStep?.newLocation === 'offDeck') {
    return true
  } else if (
    moveLabwareStep == null &&
    initialDeckSetup.labware[labwareId]?.slot === 'offDeck'
  ) {
    return true
  } else return false
}
