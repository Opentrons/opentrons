// @flow
import assert from 'assert'
import uniq from 'lodash/uniq'
import {getWellSetForMultichannel} from '../../../well-selection/utils'

import type {PipetteChannels} from '@opentrons/shared-data'
import type {FormPatch} from '../../actions/types'
import type {PipetteEntities} from '../../../step-forms/types'

// process a form patch thru an chain of functions, each taking as its input
// the output of the previous function
export function chainFormUpdaters (initialPatch: FormPatch, fns: Array<?(FormPatch => FormPatch)>): FormPatch {
  return fns.reduce((patchAcc: FormPatch, fn) => {
    // passing in a null acts like an identity function in the chain,
    // which allows you to do conditional functions in the array
    return fn ? fn(patchAcc) : patchAcc
  }, {...initialPatch})
}

// given an array of primary wells (for a multichannel), return all unique wells
// included in that set. Used to convert multi to single.
export function getAllWellsFromPrimaryWells (
  primaryWells: ?Array<string>,
  labwareType: ?string
): Array<string> {
  if (!labwareType || !primaryWells) {
    return []
  }

  const _labwareType = labwareType // TODO Ian 2018-05-04 remove this weird flow workaround

  const allWells = primaryWells.reduce((acc: Array<string>, well: string) => {
    const nextWellSet = getWellSetForMultichannel(_labwareType, well)
    // filter out any nulls (but you shouldn't get any)
    return (nextWellSet) ? [...acc, ...nextWellSet] : acc
  }, [])

  // remove duplicates (eg trough: [A1, A1, A1, A1, A1, A1, A1, A1] -> [A1])
  return uniq(allWells)
}

export function getChannels (pipetteId: string, pipetteEntities: PipetteEntities): PipetteChannels {
  const pipette: ?* = pipetteEntities[pipetteId]
  if (!pipette) {
    assert(false, `${pipetteId} not found in pipettes, cannot handleFormChange properly`)
    return 1
  }
  return pipette.spec.channels
}
