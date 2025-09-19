import { LabwareLabel } from '../LabwareLabel'

import type { DeckLabelProps } from '@opentrons/components'
import type {
  CoordinateTuple,
  LabwareDefinition2,
  ModuleModel,
} from '@opentrons/shared-data'

interface SelectedLabwareRenderProps {
  labwareDef: LabwareDefinition2 | null
  slotPosition: CoordinateTuple | null
  moduleModel: ModuleModel | null
  showModuleIcon: boolean
  nestedLabwareInfo?: DeckLabelProps[] | undefined
  showLabel?: boolean
}
export function SelectedLabwareRender(
  props: SelectedLabwareRenderProps
): JSX.Element | null {
  const {
    labwareDef,
    slotPosition,
    moduleModel,
    nestedLabwareInfo,
    showLabel = true,
    showModuleIcon,
  } = props
  return labwareDef != null && slotPosition != null && moduleModel == null ? (
    <>
      {labwareDef != null && showLabel ? (
        <LabwareLabel
          isLast
          isSelected={true}
          labwareDef={labwareDef}
          position={slotPosition}
          nestedLabwareInfo={nestedLabwareInfo}
          showModuleIcon={showModuleIcon}
        />
      ) : null}
    </>
  ) : null
}
