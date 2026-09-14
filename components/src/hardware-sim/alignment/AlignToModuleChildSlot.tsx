import { getModuleParentOriginToChildSlotOrigin } from '@opentrons/shared-data'

import type { PropsWithChildren, ReactNode } from 'react'
import type { ModuleDefinition } from '@opentrons/shared-data'

export type AlignToModuleChildSlotProps = PropsWithChildren<{
  /** Should match the `deckId` passed to the parent `<Module>`. */
  deckId: string | null
  /** Should match the `slotId` passed to the parent `<Module>`. */
  slotId: string | null
  /** Should match the module definition passed to the parent `<Module>`. */
  moduleDefinition: ModuleDefinition
}>

/**
 * Applies an SVG transform to children so that their SVG origin is at the front-left
 * (-x, -y) corner of the "slot" atop a module.
 *
 * See `getModuleParentOriginToChildSlotOrigin()` for nuances of what "the 'slot' atop
 * the module" means for things like the Thermocycler and Heater-Shaker.
 *
 * @example
 * <Module ...>
 *   <AlignToModuleChildSlot ...>
 *     <SomeUIControl ... />
 *   </AlignToModuleChildSlot>
 * </Module>
 */
export function AlignToModuleChildSlot(
  props: AlignToModuleChildSlotProps
): ReactNode {
  const { deckId, slotId, moduleDefinition, children } = props
  const { x, y } = getModuleParentOriginToChildSlotOrigin(
    deckId,
    slotId,
    moduleDefinition
  )
  return <g transform={`translate(${x} ${y})`}>{children}</g>
}
