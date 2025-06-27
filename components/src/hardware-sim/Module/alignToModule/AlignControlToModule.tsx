import { getModuleParentOriginToChildSlotOrigin } from '@opentrons/shared-data'

import type { PropsWithChildren } from 'react'
import type { ModuleDefinition } from '@opentrons/shared-data'

export type AlignControlToModuleProps = PropsWithChildren<{
  /** Should match the `deckId` passed to the parent `<Module>`. */
  deckId: string
  /** Should match the `slotId` passed to the parent `<Module>`. */
  slotId: string | null
  /** Should match the module definition passed to the parent `<Module>`. */
  moduleDefinition: ModuleDefinition
}>

/**
 * Applies an SVG transform to children so that their SVG origin is at the front-left
 * (-x, -y) corner of the "slot" atop a module.
 *
 * This is deprecated if the children are labware, because some modules do not really
 * have "slots," and in labware schema 3 we stopped pretending they do. This component
 * cannot correctly deal with labware schema 3. Use `<AlignLabwareToModule>` instead,
 * because it has a more sophisticated understanding of all the ways that labware and
 * modules can physically fit together.
 *
 * This component is intended for UI controls like an "add labware" button when you
 * hover over a module's labware area. We have historically written such components
 * to assume the "slot front-left" behavior described above.
 *
 * @example
 * <Module ...>
 *   <AlignControlToModule ...>
 *     <SomeUIControl ... />
 *   </AlignLabwareToModule>
 * </Module>
 */
export function AlignControlToModule(
  props: AlignControlToModuleProps
): JSX.Element {
  const { deckId, slotId, moduleDefinition, children } = props
  const { x, y } = getModuleParentOriginToChildSlotOrigin(
    deckId,
    slotId,
    moduleDefinition
  )
  return <g transform={`translate(${x} ${y})`}>{children}</g>
}
