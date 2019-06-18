// @flow
import type { Mount } from '@opentrons/components'
import type { DeckSlotId } from '@opentrons/shared-data'

// COMMANDS

export type PipetteLabwareFields = {|
  pipette: string,
  labware: string,
  well: string,
|}

export type AspirateDispenseArgs = {|
  ...PipetteLabwareFields,
  volume: number,
  offsetFromBottomMm?: ?number,
  'flow-rate'?: ?number,
|}

export type Command =
  | {|
      command: 'aspirate' | 'dispense',
      params: AspirateDispenseArgs,
    |}
  | {|
      command: 'pick-up-tip' | 'drop-tip' | 'blowout',
      params: PipetteLabwareFields,
    |}
  | {|
      command: 'touch-tip',
      params: {|
        ...PipetteLabwareFields,
        offsetFromBottomMm?: ?number,
      |},
    |}
  | {|
      command: 'delay',
      /** number of seconds to delay (fractional values OK),
    or `true` for delay until user input */
      params: {|
        wait: number | true,
        message: ?string,
      |},
    |}
  | {|
      command: 'air-gap',
      params: {|
        pipette: string,
        volume: number,
      |},
    |}

// File Subtypes

type VersionString = string // eg '1.0.0'

// NOTE: these are an enum type in the spec, but it's inconvenient to flow-type them.
type PipetteModel = string
type PipetteName = string

export type FilePipette = {
  mount: Mount,
  model: PipetteModel,
  name?: PipetteName,
}

export type FileLabware = {
  slot: DeckSlotId,
  model: string,
  'display-name'?: string,
}

type FlowRateForPipettes = {
  [PipetteModel]: number,
}

// A v1 JSON protocol file
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
    'touch-tip-mm-from-top'?: number,
  },

  // TODO(mc, 2019-04-17): this key isn't marked required in JSON schema
  'designer-application': {
    'application-name': string,
    'application-version': ?string,
    data: DesignerApplicationData,
  },

  robot: {
    model: 'OT-2 Standard',
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
