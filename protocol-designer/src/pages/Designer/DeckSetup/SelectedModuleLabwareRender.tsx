import {
  CenterLabwareInModuleChildSlot,
  LabwareRender,
} from '@opentrons/components'
import { getModuleDef } from '@opentrons/shared-data'

import { ModuleChildLabware } from './ModuleChildLabware'

import type { ReactNode } from 'react'
import type {
  DeckDefinition,
  LabwareDefinition2,
  ModuleModel,
} from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'

interface SelectedModuleLabwareRenderProps {
  adapterDef: LabwareDefinition2 | null
  moduleModel: ModuleModel | null
  deckDef: DeckDefinition
  slotId: string | null
  topLabwareOnDeck?: LabwareOnDeck
  lidOnDeck?: LabwareOnDeck
}

export function SelectedModuleLabwareRender(
  props: SelectedModuleLabwareRenderProps
): ReactNode {
  const {
    topLabwareOnDeck,
    moduleModel,
    adapterDef,
    lidOnDeck,
    deckDef,
    slotId,
  } = props

  if (moduleModel == null) {
    return null
  }

  const moduleDefinition = getModuleDef(moduleModel)
  const deckId = deckDef.otId

  return (
    <>
      {adapterDef != null ? (
        <CenterLabwareInModuleChildSlot
          deckId={deckId}
          slotId={slotId}
          moduleDefinition={moduleDefinition}
          labwareDefinition={adapterDef}
        >
          <LabwareRender
            definition={adapterDef}
            positioningMode="passThrough"
          />
        </CenterLabwareInModuleChildSlot>
      ) : null}
      {topLabwareOnDeck != null ? (
        <ModuleChildLabware
          labwareOnDeck={topLabwareOnDeck}
          moduleDefinition={moduleDefinition}
          deckId={deckId}
          slotId={slotId}
        />
      ) : null}
      {lidOnDeck != null ? (
        <ModuleChildLabware
          labwareOnDeck={lidOnDeck}
          moduleDefinition={moduleDefinition}
          deckId={deckId}
          slotId={slotId}
        />
      ) : null}
    </>
  )
}
