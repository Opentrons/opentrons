// @flow
import mapValues from 'lodash/mapValues'
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

// NOTE: this mapping should be reviewed before using it in migration later
// NOTE: Ian 2019-06-04 These are more up-to-date than map in api/src/opentrons/protocol_api/back_compat.py
export const V1_NAME_TO_V2_LOADNAME = {
  '12-well-plate': 'corning_12_wellplate_6.9ml_flat',
  '24-well-plate': 'corning_24_wellplate_3.4ml_flat',
  '384-plate': 'corning_384_wellplate_112ul_flat',
  '48-well-plate': 'corning_48_wellplate_1.6ml_flat',
  '6-well-plate': 'corning_6_wellplate_16.8ml_flat',
  '96-PCR-flat': 'biorad_96_wellplate_200ul_pcr',
  '96-flat': 'generic_96_wellplate_340ul_flat',
  'biorad-hardshell-96-PCR': 'biorad_96_wellplate_200ul_pcr',
  'opentrons-aluminum-block-2ml-eppendorf':
    'opentrons_24_aluminumblock_generic_2ml_screwcap',
  'opentrons-aluminum-block-2ml-screwcap':
    'opentrons_24_aluminumblock_generic_2ml_screwcap',
  'opentrons-aluminum-block-96-PCR-plate':
    'opentrons_96_aluminumblock_biorad_wellplate_200ul',
  'opentrons-tiprack-300ul': 'opentrons_96_tiprack_300ul',
  'opentrons-tuberack-1.5ml-eppendorf':
    'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap',
  'opentrons-tuberack-15_50ml':
    'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical',
  'opentrons-tuberack-15ml': 'opentrons_15_tuberack_falcon_15ml_conical',
  'opentrons-tuberack-2ml-eppendorf':
    'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap',
  'opentrons-tuberack-2ml-screwcap':
    'opentrons_24_tuberack_generic_2ml_screwcap',
  'opentrons-tuberack-50ml': 'opentrons_6_tuberack_falcon_50ml_conical',
  'tiprack-1000ul': 'opentrons_96_tiprack_1000ul',
  'tiprack-10ul': 'opentrons_96_tiprack_10ul',
  'trough-12row': 'usascientific_12_reservoir_22ml',
  'fixed-trash': 'opentrons_1_trash_1100ml_fixed',
}

// TODO: Ian 2019-04-10 SHIM REMOVAL #3335
const V1_FALLBACKS = mapValues(
  V1_NAME_TO_V2_LOADNAME,
  (v2LoadName, v1Type) => getAllDefinitions()[`opentrons/${v2LoadName}/1`]
)

const _makeLabwareDefsObj = (customDefs: LabwareDefByDefURI) => {
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

export const _getLabwareDefsByIdRootState: StepFormRootState => LabwareDefByDefURI = createSelector(
  (rootState: StepFormRootState) => rootState.labwareDefs.customDefs,
  _makeLabwareDefsObj
)

export const getLabwareDefsById: Selector<LabwareDefByDefURI> = createSelector(
  state => rootSelector(state).customDefs,
  _makeLabwareDefsObj
)
