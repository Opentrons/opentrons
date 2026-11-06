import {
  CenterLabwareInModuleChildSlot,
  LabwareRender,
} from '@opentrons/components'
import { getModuleDef } from '@opentrons/shared-data'

import { LabwareOnDeck as LabwareOnDeckComponent } from '../../../components/organisms'

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
        <CenterLabwareInModuleChildSlot
          deckId={deckId}
          slotId={slotId}
          moduleDefinition={moduleDefinition}
          labwareDefinition={topLabwareOnDeck.def}
        >
          <LabwareOnDeckComponent
            labwareOnDeck={topLabwareOnDeck}
            x={0}
            y={0}
            centerInSlot={false}
          />
        </CenterLabwareInModuleChildSlot>
      ) : null}
      {lidOnDeck != null ? (
        <CenterLabwareInModuleChildSlot
          deckId={deckId}
          slotId={slotId}
          moduleDefinition={moduleDefinition}
          labwareDefinition={lidOnDeck.def}
        >
          <LabwareOnDeckComponent
            labwareOnDeck={lidOnDeck}
            x={0}
            y={0}
            centerInSlot={false}
          />
        </CenterLabwareInModuleChildSlot>
      ) : null}
    </>
  )
}
