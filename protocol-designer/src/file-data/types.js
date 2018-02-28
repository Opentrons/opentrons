// @flow
import type {DeckSlot, Mount, Channels} from '@opentrons/components'
import type {Command} from '../step-generation/types'

export type FilePageFields = {
  name: string,
  author: string,
  description: string,

  // pipettes are empty string '' if user selects 'None'
  leftPipette: string,
  rightPipette: string
}

export type FilePageFieldAccessors = $Keys<FilePageFields>

type ISODate = $Subtype<string> // TODO Ian 2018-02-28 ???
type VersionString = $Subtype<string> // TODO Ian 2018-02-28 ???

// A JSON protocol
export type ProtocolFile = {
  'protocol-schema': VersionString,

  metadata: {
    'protocol-name': string,
    author: string,
    description: string,
    created: ISODate,
    'last-modified': ISODate | null,
    // TODO LATER string enums for category/subcategory? Or just strings?
    category: string | null,
    subcategory: string | null,
    tags: Array<string>
  },

  'designer-application': {
    'application-name': 'opentrons/protocol-designer',
    'application-version': VersionString,
    data: {
      // TODO
    }
  },

  robot: {
    model: 'OT-2 Standard' // TODO LATER support additional models
  },

  instruments: {
    [instrumentId: string]: {
      type: 'pipette',
      mount: Mount,
      model: string, // Eg '10' for p10
      channels: Channels
    }
  },

  labware: {
    [labwareId: string]: {
      slot: DeckSlot,
      type: string,
      name: string
    }
  },

  commands: Array<{
    annotation: {
      name: string,
      description: string
    },
    commands: Array<Command>
  }>
}
