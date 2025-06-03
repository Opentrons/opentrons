import { LabwareOnDeck as LabwareOnDeckComponent } from '../../../components/organisms'
import { LabwareLabel } from '../LabwareLabel'
import { LabwareRenderOnDeck } from './LabwareRenderOnDeck'

import type { DeckLabelProps } from '@opentrons/components'
import type {
  CoordinateTuple,
  LabwareDefinition2,
  ModuleModel,
} from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'

interface SelectedLabwareRenderProps {
  labwareDef: LabwareDefinition2 | null
  slotPosition: CoordinateTuple | null
  moduleModel: ModuleModel | null
  showModuleIcon: boolean
  labwareOnDeck?: LabwareOnDeck
  nestedLabwareInfo?: DeckLabelProps[] | undefined
  showLabel?: boolean
}
export function SelectedLabwareRender(
  props: SelectedLabwareRenderProps
): JSX.Element | null {
  const {
    labwareOnDeck,
    labwareDef,
    slotPosition,
    moduleModel,
    nestedLabwareInfo,
    showLabel = true,
    showModuleIcon,
  } = props

  return (labwareOnDeck != null || labwareDef != null) &&
    slotPosition != null &&
    moduleModel == null ? (
    <>
      {labwareDef != null ? (
        <LabwareRenderOnDeck
          // TODO BEFORE MERGE: passing in these slot positions on their own is probably wrong if x/y are the labware render origin.
          labwareDef={labwareDef}
          x={slotPosition[0]}
          y={slotPosition[1]}
        />
      ) : null}
      {labwareOnDeck != null ? (
        <LabwareOnDeckComponent
          // TODO BEFORE MERGE: Oh God. What is the difference between LabwareOnDeckComponent and LabwareRenderOnDeck.
          // Also passing in these slot positions on their own is probably wrong if x/y are the labware render origin.
          x={slotPosition[0]}
          y={slotPosition[1]}
          labwareOnDeck={labwareOnDeck}
        />
      ) : null}
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
