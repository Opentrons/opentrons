import round from 'lodash/round'
import uniq from 'lodash/uniq'
import { UAParser } from 'ua-parser-js'

import { getStepVisibilities } from '/protocol-designer/steplist/utils/getStepVisibilities'
import { convertStepHierarchyToArray } from '/protocol-designer/steplist/utils/stepHierarchy'

import type { MouseEvent } from 'react'
import type { StepIdType } from '/protocol-designer/form-types'
import type { StepHierarchy } from '/protocol-designer/steplist/utils/stepHierarchy'

export const capitalizeFirstLetterAfterNumber = (title: string): string =>
  title.replace(
    /(^[\d\W]*)([a-zA-Z])|(-[a-zA-Z])/g,
    (match, prefix, firstLetter) => {
      if (prefix != null) {
        return `${prefix}${firstLetter.toUpperCase()}`
      } else {
        return `${match.charAt(0)}${match.charAt(1).toUpperCase()}`
      }
    }
  )

const VOLUME_SIG_DIGITS_DEFAULT = 2
export function formatVolume(
  inputVolume?: string | number | null,
  sigDigits: number = VOLUME_SIG_DIGITS_DEFAULT
): string {
  if (typeof inputVolume === 'number') {
    // don't add digits to numbers with nothing to the right of the decimal
    const digits = inputVolume.toString().split('.')[1] ? sigDigits : 0
    return String(round(inputVolume, digits))
  }

  return inputVolume || ''
}
const PERCENTAGE_DECIMALS_ALLOWED = 1
export const formatPercentage = (part: number, total: number): string => {
  return `${round((part / total) * 100, PERCENTAGE_DECIMALS_ALLOWED)}%`
}

export const getMetaSelectedSteps = (
  priorMultiSelectedItemIds: StepIdType[] | null,
  newlySelectedStepId: StepIdType,
  priorSingleSelectedStepId: StepIdType | null
): StepIdType[] => {
  let stepsToSelect: StepIdType[]
  if (priorMultiSelectedItemIds?.length) {
    // already have a selection, add/remove the meta-clicked item
    stepsToSelect = priorMultiSelectedItemIds.includes(newlySelectedStepId)
      ? priorMultiSelectedItemIds.filter(id => id !== newlySelectedStepId)
      : [...priorMultiSelectedItemIds, newlySelectedStepId]
  } else if (
    priorSingleSelectedStepId &&
    priorSingleSelectedStepId === newlySelectedStepId
  ) {
    // meta-clicked on the selected single step
    stepsToSelect = [priorSingleSelectedStepId]
  } else if (priorSingleSelectedStepId) {
    // meta-clicked on a different step, multi-select both
    stepsToSelect = [priorSingleSelectedStepId, newlySelectedStepId]
  } else {
    // meta-clicked on a step when a terminal item was selected
    stepsToSelect = [newlySelectedStepId]
  }
  return stepsToSelect
}

export const getShiftSelectedSteps = (
  priorSingleSelectedStepId: StepIdType | null,
  stepHierarchy: StepHierarchy,
  newlySelectedStepId: StepIdType,
  priorMultiSelectedItemIds: StepIdType[] | null,
  lastMultiSelectedStepId: StepIdType | null
): StepIdType[] => {
  let stepsToSelect: StepIdType[]
  if (priorSingleSelectedStepId) {
    stepsToSelect = getOrderedVisibleStepsInRange(
      priorSingleSelectedStepId,
      newlySelectedStepId,
      stepHierarchy
    )
  } else if (priorMultiSelectedItemIds?.length && lastMultiSelectedStepId) {
    const potentialStepsToSelect = getOrderedVisibleStepsInRange(
      lastMultiSelectedStepId,
      newlySelectedStepId,
      stepHierarchy
    )

    const allSelected: boolean = potentialStepsToSelect
      .slice(1)
      .every(stepId => priorMultiSelectedItemIds.includes(stepId))

    if (allSelected) {
      // if they're all selected, deselect them all
      if (
        priorMultiSelectedItemIds.length - potentialStepsToSelect.length >
        0
      ) {
        stepsToSelect = priorMultiSelectedItemIds.filter(
          (id: StepIdType) => !potentialStepsToSelect.includes(id)
        )
      } else {
        // unless deselecting them all results in none being selected
        stepsToSelect = [potentialStepsToSelect[0]]
      }
    } else {
      stepsToSelect = uniq([
        ...priorMultiSelectedItemIds,
        ...potentialStepsToSelect,
      ])
    }
  } else {
    stepsToSelect = [newlySelectedStepId]
  }
  return stepsToSelect
}

const getOrderedVisibleStepsInRange = (
  lastSelectedStepId: StepIdType,
  stepId: StepIdType,
  stepHierarchy: StepHierarchy
): StepIdType[] => {
  const orderedStepIds = convertStepHierarchyToArray(stepHierarchy)
  const stepVisibilities = getStepVisibilities(stepHierarchy)

  const prevIndex: number = orderedStepIds.indexOf(lastSelectedStepId)
  const currentIndex: number = orderedStepIds.indexOf(stepId)
  const [startIndex, endIndex] = [prevIndex, currentIndex].sort((a, b) => a - b)

  const orderedVisibleSteps = orderedStepIds
    .slice(startIndex, endIndex + 1)
    .filter(stepId => stepVisibilities[stepId].isVisibleToUser)
  return orderedVisibleSteps
}

export const nonePressed = (keysPressed: boolean[]): boolean =>
  keysPressed.every(keyPress => keyPress === false)

export const getMouseClickKeyInfo = (
  event: MouseEvent
): { isShiftKeyPressed: boolean; isMetaKeyPressed: boolean } => {
  const isMac: boolean = getUserOS() === 'Mac OS'
  const isShiftKeyPressed: boolean = event.shiftKey
  const isMetaKeyPressed: boolean =
    (isMac && event.metaKey) || (!isMac && event.ctrlKey)
  return { isShiftKeyPressed, isMetaKeyPressed }
}

export const getUserOS = (): string | undefined => new UAParser().getOS().name
