// @flow
import mapValues from 'lodash/mapValues'
import { createSelector } from 'reselect'
import { getLabware } from '@opentrons/shared-data'
import { _getSharedLabware, getAllDefinitions } from './utils'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { BaseState, Selector } from '../types'
import type { LabwareDefByDefId } from './types'
import type { RootState } from './reducers'
import type { RootState as StepFormRootState } from '../step-forms'

// NOTE: labware-defs/ state is nested inside step-forms
export const rootSelector = (state: BaseState): RootState =>
  state.stepForms.labwareDefs

const _getLabwareDef = (
  customDefs: LabwareDefByDefId,
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

// NOTE: this mapping should be reviewed before using it in migration later
export const V1_NAME_TO_V2_OTID = {
  '12-well-plate': 'a4961650-54c9-11e9-989a-e90aec2c3723',
  '24-well-plate': '4373e820-54c9-11e9-9364-556fc2c8a783',
  '384-plate': 'cf69e110-f50e-11e8-bb2a-e7b1dd90654d',
  '48-well-plate': '3d53c440-f50d-11e8-bb2a-e7b1dd90654d',
  '6-well-plate': 'bd10e8d0-f4da-11e8-bb2a-e7b1dd90654d',
  '96-PCR-flat': 'a07a3f50-ec38-11e8-a3cc-d7bd32b6c4b1',
  '96-flat': '54d2f430-d602-11e8-80b1-6965467d172c',
  'biorad-hardshell-96-PCR': 'a07a3f50-ec38-11e8-a3cc-d7bd32b6c4b1',
  'opentrons-aluminum-block-2ml-eppendorf':
    'cf9cbb20-f401-11e8-a244-69cb0fde6293',
  'opentrons-aluminum-block-2ml-screwcap':
    'cf9cbb20-f401-11e8-a244-69cb0fde6293',
  'opentrons-aluminum-block-96-PCR-plate':
    'd88a5b70-f4c9-11e8-83b8-c3ba5d2a3baa',
  'opentrons-tiprack-300ul': '3d278f00-ffe0-11e8-abfa-95044b186e81',
  'opentrons-tuberack-1.5ml-eppendorf': '9467f4b0-fa3d-11e8-b76d-25864338afc4',
  'opentrons-tuberack-15_50ml': 'f65f2960-0f76-11e9-8659-e18ed15996f5',
  'opentrons-tuberack-15ml': 'e57a7130-54c8-11e9-a8d4-c1917c1bf74f',
  'opentrons-tuberack-2ml-eppendorf': 'b28e5eb0-e8f0-11e8-b93b-5f6727dde048',
  'opentrons-tuberack-2ml-screwcap': 'e8c55910-e8f1-11e8-b93b-5f6727dde048',
  'opentrons-tuberack-50ml': '23784a80-5563-11e9-bf87-f7b718396190',
  'tiprack-1000ul': 'd4e462c0-ffde-11e8-abfa-95044b186e81',
  'tiprack-10ul': '88154cc0-ffde-11e8-abfa-95044b186e81',
  'trough-12row': 'a41d9ef0-f4b6-11e8-90c2-7106f0eae5a7',
}

// TODO: Ian 2019-04-10 SHIM REMOVAL #3335
const V1_FALLBACKS = mapValues(
  V1_NAME_TO_V2_OTID,
  v1Type => getAllDefinitions()[v1Type]
)

const _makeLabwareDefsObj = (customDefs: LabwareDefByDefId) => {
  const allCustomIds = Object.keys(customDefs)
  const customDefsById = allCustomIds.reduce(
    (acc, id) => ({
      ...acc,
      [id]: _getLabwareDef(customDefs, id),
    }),
    {}
  )

  return { ...V1_FALLBACKS, ...getAllDefinitions(), ...customDefsById }
}

// $FlowFixMe TODO IMMEDIATELY
export const _getLabwareDefsByIdRootState: StepFormRootState => LabwareDefByDefId = createSelector(
  rootState => rootState.customDefs,
  _makeLabwareDefsObj
)

export const getLabwareDefsById: Selector<LabwareDefByDefId> = createSelector(
  state => rootSelector(state).customDefs,
  _makeLabwareDefsObj
)
