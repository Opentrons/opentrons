// @flow
// Named arguments to createFile selector. This data would be the result of several selectors.
import { fixtureP10Single } from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_trash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'
import type { DismissedWarningState } from '../../../dismiss/reducers'
import type { IngredientsState } from '../../../labware-ingred/reducers'
import type { LabwareDefByDefURI } from '../../../labware-defs'
import type { LabwareEntities, PipetteEntities } from '../../../step-forms'
import type { LabwareLiquidState } from '../../../step-generation'
import type { FileMetadataFields } from '../../types'

export const fileMetadata: FileMetadataFields = {
  protocolName: 'Test Protocol',
  author: 'The Author',
  description: 'Protocol description',
  created: 1582667312515,
}

export const dismissedWarnings: DismissedWarningState = {
  form: {},
  timeline: {},
}

export const ingredients: IngredientsState = {}

export const ingredLocations: LabwareLiquidState = {}

export const labwareEntities: LabwareEntities = {
  trashId: {
    labwareDefURI: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
    id: 'trashId',
    def: fixture_trash,
  },
  tiprackId: {
    labwareDefURI: 'opentrons/opentrons_96_tiprack_10ul/1',
    id: 'tiprackId',
    def: fixture_tiprack_10_ul,
  },
  plateId: {
    labwareDefURI: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
    id: 'plateId',
    def: fixture_96_plate,
  },
}

export const pipetteEntities: PipetteEntities = {
  pipetteId: {
    id: 'pipetteId',
    name: 'p10_single',
    spec: fixtureP10Single,
    tiprackDefURI: 'opentrons/opentrons_96_tiprack_10ul/1',
    tiprackLabwareDef: fixture_tiprack_10_ul,
  },
}
export const labwareNicknamesById: { [labwareId: string]: string } = {
  trashId: 'Trash',
  tiprackId: 'Opentrons 96 Tip Rack 10 µL',
  plateId: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
}
export const labwareDefsByURI: LabwareDefByDefURI = {
  'opentrons/opentrons_96_tiprack_10ul/1': fixture_tiprack_10_ul,
  'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1': fixture_96_plate,
  'opentrons/opentrons_1_trash_1100ml_fixed/1': fixture_trash,
}
