import { createContainer } from '../../labware-ingred/actions'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'

import type { DeckSlotId } from '@opentrons/shared-data'
import type { ThunkAction } from '../../types'
import type {
  CreateContainerAction,
  RenameLabwareAction,
} from '../../labware-ingred/actions'

export interface CreateContainerAboveModuleArgs {
  slot: DeckSlotId
  labwareDefURI: string
  nestedLabwareDefURI?: string
}

export const createContainerAboveModule: (
  args: CreateContainerAboveModuleArgs
) => ThunkAction<CreateContainerAction | RenameLabwareAction> = args => (
  dispatch,
  getState
) => {
  const { slot, labwareDefURI, nestedLabwareDefURI } = args
  const state = getState()
  const deckSetup = getDeckSetupForActiveItem(state)
  const modules = deckSetup.modules

  const moduleId = Object.values(modules).find(module => module.slot === slot)
    ?.id
  dispatch(
    createContainer({
      slot: moduleId,
      labwareDefURI:
        nestedLabwareDefURI == null ? labwareDefURI : nestedLabwareDefURI,
      adapterUnderLabwareDefURI:
        nestedLabwareDefURI == null ? undefined : labwareDefURI,
    })
  )
}
