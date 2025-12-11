import { repeatArray } from './misc'

import type {
  AtomicProfileStep,
  TCExtendedProfileParams,
} from '@opentrons/shared-data'

interface ThermocyclerProfileRepetitionsForPython {
  repeatingProfileSteps: AtomicProfileStep[]
  numRepetitions: number
}

/**
 * Protocol Engine and step-generation specify Thermocycler profiles as an array of
 * loops. The Python Protocol API's `execute_profile()` method, on the other hand,
 * currently only takes a single loop.
 *
 * This converts the array-of-loops format to the single-loop format.
 */
export function getThermocyclerProfileRepetitionsForPython(
  profileElements: TCExtendedProfileParams['profileElements']
): ThermocyclerProfileRepetitionsForPython {
  const soleElement = profileElements.length === 1 ? profileElements[0] : null
  if (soleElement != null && 'steps' in soleElement) {
    return {
      numRepetitions: soleElement.repetitions,
      repeatingProfileSteps: soleElement.steps,
    }
  } else {
    return {
      numRepetitions: 1,
      repeatingProfileSteps: profileElements.flatMap(element =>
        'steps' in element
          ? repeatArray(element.steps, element.repetitions)
          : element
      ),
    }
  }
}
