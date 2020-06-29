// @flow
import last from 'lodash/last'

import type { FormData, StepIdType } from '../../../form-types'

export function getNextDefaultBlockIsActive(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>
): boolean {
  const prevBlockSteps = orderedStepIds
    .map(stepId => savedForms[stepId])
    .filter(form => form && form.blockIsActive !== null)

  const lastBlockStep = last(prevBlockSteps)

  const nextDefaultBlockIsActive =
    (lastBlockStep && lastBlockStep.blockIsActive) || false

  return nextDefaultBlockIsActive
}

export function getNextDefaultBlockTemperature(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>
): ?string {
  const prevBlockSteps = orderedStepIds
    .map(stepId => savedForms[stepId])
    .filter(form => form && form.blockTargetTemp)

  const lastBlockTempStep = last(prevBlockSteps)

  let nextDefaultBlockTemp: string | null = null

  if (lastBlockTempStep && lastBlockTempStep.blockIsActive) {
    nextDefaultBlockTemp = lastBlockTempStep.blockTargetTemp
      ? lastBlockTempStep.blockTargetTemp
      : null
  }

  return nextDefaultBlockTemp
}

export function getNextDefaultLidIsActive(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>
): boolean {
  const prevLidSteps = orderedStepIds
    .map(stepId => savedForms[stepId])
    .filter(form => form && form.lidIsActive !== null)

  const lastLidStep = last(prevLidSteps)

  const nextDefaultLidIsActive =
    (lastLidStep && lastLidStep.lidIsActive) || false

  return nextDefaultLidIsActive
}

export function getNextDefaultLidTemperature(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>
): ?string {
  const prevLidSteps = orderedStepIds
    .map(stepId => savedForms[stepId])
    .filter(form => form && form.lidTargetTemp)

  const lastLidTempStep = last(prevLidSteps)

  let nextDefaultLidTemp: string | null = null

  if (lastLidTempStep && lastLidTempStep.lidIsActive) {
    nextDefaultLidTemp = lastLidTempStep.lidTargetTemp
      ? lastLidTempStep.lidTargetTemp
      : null
  }

  return nextDefaultLidTemp
}

export function getNextDefaultLidOpen(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>
): ?boolean {
  const prevLidSteps = orderedStepIds
    .map(stepId => savedForms[stepId])
    .filter(form => form && form.lidOpen !== null)

  const lastLidStep = last(prevLidSteps)

  const nextDefaultLidOpen = lastLidStep ? lastLidStep.lidOpen : null

  return nextDefaultLidOpen
}
