// @flow
import { createSelector } from 'reselect'
import { _getSharedLabware, getAllDefinitions } from './utils'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { BaseState, Selector } from '../types'
import type { LabwareDefByDefURI } from './types'
import type { RootState } from './reducers'
import type { RootState as StepFormRootState } from '../step-forms'

// NOTE: labware-defs/ state is nested inside step-forms
export const rootSelector = (state: BaseState): RootState =>
  state.stepForms.labwareDefs

const _getLabwareDef = (
  customDefs: LabwareDefByDefURI,
  labwareDefURI: string
): LabwareDefinition2 => {
  const customDef = customDefs[labwareDefURI]
  if (customDef) return customDef
  const sharedDataDef = _getSharedLabware(labwareDefURI)
  if (sharedDataDef) return sharedDataDef
  throw Error(
    `No labware definition in PD session's custom labware or builtin shared-data defs for labwareDefURI "{labwareDefURI}"`
  )
}

const _makeLabwareDefsObj = (customDefs: LabwareDefByDefURI) => {
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

export const _getLabwareDefsByIdRootState: StepFormRootState => LabwareDefByDefURI = createSelector(
  (rootState: StepFormRootState) => rootState.labwareDefs.customDefs,
  _makeLabwareDefsObj
)

export const getLabwareDefsByURI: Selector<LabwareDefByDefURI> = createSelector(
  state => rootSelector(state).customDefs,
  _makeLabwareDefsObj
)
