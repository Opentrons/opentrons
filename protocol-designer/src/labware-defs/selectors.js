// @flow
import { createSelector } from 'reselect'
import { getLabware } from '@opentrons/shared-data'
import { _getSharedLabware, getAllDefinitions } from './utils'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { BaseState, Selector } from '../types'
import type { DefsByLabwareId } from './types'
import type { RootState } from './reducers'

// NOTE: labware-defs/ state is nested inside step-forms
export const rootSelector = (state: BaseState): RootState =>
  state.stepForms.labwareDefs

const _getLabwareDef = (
  customDefs: DefsByLabwareId,
  otId: string
): any | LabwareDefinition2 => {
  const customDef = customDefs[otId]
  if (customDef) return customDef
  const sharedDataDef = _getSharedLabware(otId)
  if (sharedDataDef) return sharedDataDef
  // TODO: Ian 2019-04-10 SHIM REMOVAL #3335
  const legacyV1Labware = getLabware(otId)
  if (legacyV1Labware) return legacyV1Labware
  throw Error(
    `No labware definition in PD session's custom labware or builtin shared-data defs for otId "{otId}"`
  )
}

export const getLabwareDefsById: Selector<DefsByLabwareId> = createSelector(
  state => rootSelector(state).customDefs,
  customDefs => {
    const allCustomIds = Object.keys(customDefs)
    const customDefsById = allCustomIds.reduce(
      (acc, id) => ({
        ...acc,
        [id]: _getLabwareDef(customDefs, id),
      }),
      {}
    )

    return { ...getAllDefinitions(), ...customDefsById }
  }
)
