// @flow
import type {DeckSlot, Mount} from '@opentrons/components'
import type {Command} from './step-generation/types'
import type {RootState as IngredRoot} from './labware-ingred/reducers'
import type {RootState as StepformRoot} from './step-forms'
import type {RootState as DismissRoot} from './dismiss'

type VersionString = string // eg '1.0.0'
type PipetteModel = string // TODO Ian 2018-05-11 use shared-data model types enum. Eg 'p10_single_v1.3'
type PipetteName = string // TODO Ian 2018-11-06 use shared-data pipette names types enum. Eg 'p10_single'.

export type FilePipette = {
  mount: Mount,
  // TODO: Ian 2018-11-05 drop 'model' and just use 'name'. Breaking change for JSON protocol files, see JSON schema TODO.
  model: PipetteModel,
  name?: PipetteName,
}

export type FileLabware = {
  slot: DeckSlot,
  model: string,
  'display-name'?: string,
}

export type FlowRateForPipettes = {
  [PipetteModel]: number,
}

export type PDMetadata = {
  // pipetteId to tiprackModel
  pipetteTiprackAssignments: {[pipetteId: string]: string},

  dismissedWarnings: $PropertyType<DismissRoot, 'dismissedWarnings'>,

  ingredients: $PropertyType<IngredRoot, 'ingredients'>,
  ingredLocations: $PropertyType<IngredRoot, 'ingredLocations'>,

  savedStepForms: $PropertyType<StepformRoot, 'savedStepForms'>,
  orderedStepIds: $PropertyType<StepformRoot, 'orderedStepIds'>,
}

// A JSON protocol
// corresponds to shared-data/protocol-json-schema/protocol-schema.json
export type ProtocolFile<DesignerApplicationData> = {
  'protocol-schema': VersionString,

  metadata: {
    'protocol-name'?: string,
    author?: string,
    description?: string,
    created?: number,
    'last-modified'?: number | null,
    category?: string | null,
    subcategory?: string | null,
    tags?: Array<string>,
  },

  'default-values': {
    'aspirate-flow-rate': FlowRateForPipettes,
    'dispense-flow-rate': FlowRateForPipettes,
    'aspirate-mm-from-bottom': number,
    'dispense-mm-from-bottom': number,
    'touch-tip-mm-from-top'?: number, // TODO: Ian 2019-02-12 make required in protocol schema breaking change
  },

  'designer-application': {
    'application-name': string,
    'application-version': ?string,
    data: DesignerApplicationData,
  },

  robot: {
    model: 'OT-2 Standard', // TODO LATER support additional models
  },

  pipettes: {
    [instrumentId: string]: FilePipette,
  },

  labware: {
    [labwareId: string]: FileLabware,
  },

  procedure: Array<{
    annotation: {
      name: string,
      description: string,
    },
    subprocedure: Array<Command>,
  }>,
}

export type PDProtocolFile = ProtocolFile<PDMetadata>

export function getPDMetadata (file: PDProtocolFile): PDMetadata {
  return file['designer-application'].data
}
