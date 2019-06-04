// @flow
import type { Mount } from '@opentrons/components'
import type { DeckSlotId } from '@opentrons/shared-data'

// NOTE: this is an enum type in the spec, but it's inconvenient to flow-type them.
type PipetteName = string

export type FilePipetteV3 = {
  mount: Mount,
  name: PipetteName,
}

export type FileLabwareV3 = {
  slot: DeckSlotId,
  labwareDefURI: string,
  'display-name'?: string,
}
