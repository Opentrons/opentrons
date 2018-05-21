// @flow
import type {DeckSlot, Mount} from '@opentrons/components'
import type {Command} from '../step-generation/types'

export type FilePageFields = {
  name: string,
  author: string,
  description: string
}

export type FilePageFieldAccessors = $Keys<FilePageFields>

type MsSinceEpoch = number
type VersionString = string // eg '1.0.0'

export type FilePipette = {
  mount: Mount,
  model: string // TODO Ian 2018-05-11 use pipette-definitions model types
}

export type FileLabware = {
  slot: DeckSlot,
  model: string,
  'display-name': string
}

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

  pipettes: {
    [instrumentId: string]: FilePipette
  },

  labware: {
    [labwareId: string]: FileLabware
  },

  procedure: Array<{
    annotation: {
      name: string,
      description: string
    },
    subprocedure: Array<Command>
  }>
}
