import { AlignToModuleChildSlot } from './AlignToModuleChildSlot'
import { CenterLabwareInSlot } from './CenterLabwareInSlot'

import type { PropsWithChildren, ReactNode } from 'react'
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
 * This visually aligns a labware so it's centered in the slot atop a module.
 *
 * Certain modules, like the Thermocycler and Heater-Shaker, don't have slots. In those
 * cases, the labware will be centered over the thermal block or whatever the module has
 * instead.
 *
 * The parent SVG origin should be the front-left (-x,-y) corner of the slot that the
 * module is in, which is also the origin of the module.
 *
 * Example:
 *
 * ```
 * <Module childrenPositioningMode="passThrough" ...>
 *   <CenterLabwareInModuleChildSlot ...>
 *     <LabwareRender positioningMode="passThrough" ... />
 *   </CenterLabwareInModuleChildSlot>
 * </Module>
 * ```
 */
export function CenterLabwareInModuleChildSlot(
  props: CenterLabwareInModuleChildSlotProps
): ReactNode {
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
