import { getModuleParentOriginToLabwareOrigin } from '@opentrons/shared-data'

import type { PropsWithChildren } from 'react'
import type {
  LabwareDefinition,
  ModuleDefinition,
} from '@opentrons/shared-data'

export type AlignLabwareToModuleProps = PropsWithChildren<{
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
 * Use this to realistically position a labware in or atop a module.
 *
 * This only deals with x/y translation, not rotation. Rotation is currently handled
 * by a prop on `<Labware>`/`<LabwareRender>`.
 *
 * @example
 * <Module ...>
 *   <AlignLabwareToModule ...>
 *     <LabwareRender ... />
 *   </AlignLabwareToModule>
 * </Module>
 */
export function AlignLabwareToModule(
  props: AlignLabwareToModuleProps
): JSX.Element {
  const {
    deckId,
    slotId,
    moduleDefinition,
    labwareDefinition,
    children,
  } = props
  const { x, y } = getModuleParentOriginToLabwareOrigin(
    deckId,
    slotId,
    moduleDefinition,
    labwareDefinition
  )
  return <g transform={`translate(${x} ${y})`}>{children}</g>
}
