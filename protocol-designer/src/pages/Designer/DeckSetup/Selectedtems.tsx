import { useSelector } from 'react-redux'

import { Module } from '@opentrons/components'
import {
  getAllLabwareDefs,
  getModuleDef2,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { selectors } from '../../../labware-ingred/selectors'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { FixtureRender } from './FixtureRender'
import { ModuleLabel } from './ModuleLabel'
import { SelectedLabwareRender } from './SelectedLabwareRender'
import { SelectedModuleLabwareRender } from './SelectedModuleLabwareRender'

import type { DeckLabelProps } from '@opentrons/components'
import type {
  CoordinateTuple,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'

interface SelectedHoveredItemsProps {
  deckDef: DeckDefinition
  robotType: RobotType
  slotPosition: CoordinateTuple | null
}
export const SelectedItems = (
  props: SelectedHoveredItemsProps
): JSX.Element => {
  const { deckDef, robotType, slotPosition } = props
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const {
    selectedSlot,
    selectedFixture,
    selectedTopLabwareDefUri,
    selectedModuleModel,
    selectedAdapterDefUri,
  } = selectedSlotInfo
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getAllLabwareDefs()
  const deckSetup = useSelector(getInitialDeckSetup)
  const { labware } = deckSetup
  const matchingSelectedLabwareOnDeck = Object.values(labware).find(labware => {
    const matchingSlot = getSlotInLocationStack(labware.stack)
    return (
      matchingSlot === selectedSlot.slot &&
      labware.labwareDefURI === selectedAdapterDefUri
    )
  })
  const matchingSelectedNestedLabwareOnDeck = Object.values(labware).find(
    lw => {
      const matchingSlot = getSlotInLocationStack(lw.stack)
      return (
        lw.labwareDefURI === selectedTopLabwareDefUri &&
        matchingSlot === selectedSlot.slot
      )
    }
  )
  const selectedLabwareDef =
    selectedAdapterDefUri != null
      ? defs[selectedAdapterDefUri] ?? customLabwareDefs[selectedAdapterDefUri]
      : null
  const selectedNestedLabwareDef =
    selectedTopLabwareDefUri != null
      ? defs[selectedTopLabwareDefUri] ??
        customLabwareDefs[selectedTopLabwareDefUri]
      : null

  const orientation =
    slotPosition != null
      ? inferModuleOrientationFromXCoordinate(slotPosition[0])
      : null

  const labwareInfos: DeckLabelProps[] = []

  if (selectedNestedLabwareDef != null) {
    const selectedNestedLabwareLabel = {
      text: selectedNestedLabwareDef.metadata.displayName,
      isSelected: true,
      isLast: true,
      isZoomed: true,
    }
    labwareInfos.push(selectedNestedLabwareLabel)
  }
  if (selectedAdapterDefUri != null) {
    const def =
      defs[selectedAdapterDefUri] ?? customLabwareDefs[selectedAdapterDefUri]
    const selectedLabwareLabel = {
      text: def.metadata.displayName,
      isSelected: true,
      isLast: selectedTopLabwareDefUri == null,
      isZoomed: true,
    }
    labwareInfos.push(selectedLabwareLabel)
  }

  return (
    <>
      {selectedFixture != null && selectedSlot.cutout != null ? (
        <FixtureRender
          fixture={selectedFixture}
          cutout={selectedSlot.cutout}
          robotType={robotType}
          deckDef={deckDef}
        />
      ) : null}
      {selectedModuleModel != null &&
      slotPosition != null &&
      orientation != null ? (
        <>
          <Module
            key={`${selectedModuleModel}_${selectedSlot.slot}_selected`}
            x={slotPosition[0]}
            y={slotPosition[1]}
            def={getModuleDef2(selectedModuleModel)}
            orientation={orientation}
          >
            <>
              <SelectedModuleLabwareRender
                nestedLabwareDef={selectedNestedLabwareDef}
                labwareOnDeck={matchingSelectedLabwareOnDeck}
                labwareDef={selectedLabwareDef}
                moduleModel={selectedModuleModel}
              />
            </>
          </Module>
          {selectedModuleModel != null ? (
            <ModuleLabel
              isLast={selectedAdapterDefUri == null}
              moduleModel={selectedModuleModel}
              position={slotPosition}
              orientation={orientation}
              isSelected={true}
              labwareInfos={labwareInfos}
              slot={selectedSlot.slot}
            />
          ) : null}
        </>
      ) : null}
      <SelectedLabwareRender
        labwareOnDeck={matchingSelectedLabwareOnDeck}
        labwareDef={selectedLabwareDef}
        slotPosition={slotPosition}
        moduleModel={selectedModuleModel}
        showLabel={selectedNestedLabwareDef == null}
      />
      <SelectedLabwareRender
        labwareOnDeck={matchingSelectedNestedLabwareOnDeck}
        labwareDef={selectedNestedLabwareDef}
        slotPosition={slotPosition}
        moduleModel={selectedModuleModel}
        nestedLabwareInfo={[
          {
            text: selectedLabwareDef?.metadata.displayName ?? 'unknown name',
            isSelected: true,
            isLast: true,
            isZoomed: true,
          },
        ]}
      />
    </>
  )
}
