// @flow
import type {DeckSlot, Mount, Channels} from '@opentrons/components'
import type {Command} from '../step-generation/types'

export type FilePageFields = {
  name: string,
  author: string,
  description: string
}

export type FilePageFieldAccessors = $Keys<FilePageFields>

type MsSinceEpoch = number
type VersionString = string // eg '1.0.0'

// A JSON protocol
export type ProtocolFile = {
  'protocol-schema': VersionString,

  metadata: {
    'protocol-name': string,
    author: string,
    description: string,
    created: MsSinceEpoch,
    'last-modified': MsSinceEpoch | null,
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
