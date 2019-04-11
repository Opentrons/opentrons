// @flow
import { _getSharedLabware } from './utils'
import { getLabware } from '@opentrons/shared-data'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { BaseState } from '../types'
import type { RootState } from './reducers'

export const rootSelector = (state: BaseState): RootState => state.labwareDefs

export const getLabwareDef = (
  state: BaseState,
  otId: string
): any | LabwareDefinition2 => {
  const customDef = rootSelector(state).customDefs[otId]
  if (customDef) return customDef
  const sharedDataDef = _getSharedLabware(otId)
  if (sharedDataDef) return sharedDataDef
  // TODO: Ian 2019-04-10 this is a short-term shim, remove soon
  const legacyV1Labware = getLabware(otId)
  if (legacyV1Labware) return legacyV1Labware
  // TODO IMMEDIATELY would it be super painful to make this return null here instead,
  // and have this fn return a Maybe?
  throw Error(
    `No labware definition in PD session's custom labware or builtin shared-data defs for otId "{otId}"`
  )
}
