import { AlignToModuleChildSlot } from './AlignToModuleChildSlot'
import { CenterLabwareInSlot } from './CenterLabwareInSlot'

import type { PropsWithChildren } from 'react'
import type {
  LabwareDefinition,
  ModuleDefinition,
} from '@opentrons/shared-data'

export type CenterLabwareInModuleChildSlotProps = PropsWithChildren<{
  /** Should match the `deckId` passed to the parent `<Module>`. */
  deckId: string | null
  /** Should match the `slotId` passed to the parent `<Module>`. */
  slotId: string | null
  /** Should match the module definition passed to the parent `<Module>`. */
  moduleDefinition: ModuleDefinition
  /** Should match the labware definition passed to the child `<Labware>`/`<LabwareRender>`. */
  labwareDefinition: LabwareDefinition
}>

/**
 * Goes from the origin of the module to
 */
export function CenterLabwareInModuleChildSlot(
  props: CenterLabwareInModuleChildSlotProps
): JSX.Element {
  const { deckId, slotId, moduleDefinition, labwareDefinition, children } =
    props
  return (
    <AlignToModuleChildSlot
      deckId={deckId}
      slotId={slotId}
      moduleDefinition={moduleDefinition}
    >
      <CenterLabwareInSlot definition={labwareDefinition}>
        {children}
      </CenterLabwareInSlot>
    </AlignToModuleChildSlot>
  )
}
