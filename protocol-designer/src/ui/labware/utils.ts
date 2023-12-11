import { COLUMN_4_SLOTS } from '@opentrons/step-generation'
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

export function getLabwareInColumn4(
  initialDeckSetup: InitialDeckSetup,
  savedStepForms: SavedStepFormState,
  labwareId: string
): boolean {
  const isStartingInColumn4 = COLUMN_4_SLOTS.includes(
    initialDeckSetup.labware[labwareId]?.slot
  )
  const isMovedIntoColumn4 =
    savedStepForms != null
      ? Object.values(savedStepForms)
          ?.reverse()
          .find(
            form =>
              form.stepType === 'moveLabware' &&
              form.labware === labwareId &&
              COLUMN_4_SLOTS.includes(form.newLocation)
          ) != null
      : false

  const isLabwareMoved =
    savedStepForms != null
      ? Object.values(savedStepForms)
          ?.reverse()
          .some(
            form =>
              form.stepType === 'moveLabware' && form.labware === labwareId
          )
      : false
  const labwareStayedInColumn4 = !isLabwareMoved && isStartingInColumn4

  return isMovedIntoColumn4 || labwareStayedInColumn4
}
