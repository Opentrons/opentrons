import { useSelector } from 'react-redux'

import { Module } from '@opentrons/components'
import {
  getAllLabwareDefs,
  getModuleDef,
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

interface SelectedItemsProps {
  deckDef: DeckDefinition
  robotType: RobotType
  slotPosition: CoordinateTuple | null
}
export const SelectedItems = (props: SelectedItemsProps): JSX.Element => {
  const { deckDef, robotType, slotPosition } = props
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const {
    selectedSlot,
    selectedTopLabware,
    selectedAdapterDefURI,
    selectedFixture,
    selectedModuleModel,
  } = selectedSlotInfo
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getAllLabwareDefs()
  const deckSetup = useSelector(getInitialDeckSetup)
  const { labware } = deckSetup
  const matchingSelectedTopLabwareOnDeck = Object.values(labware).find(
    ({ stack, labwareDefURI }) => {
      const matchingSlot = getSlotInLocationStack(stack)
      return (
        labwareDefURI === selectedTopLabware.labwareDefURI &&
        matchingSlot === selectedSlot.slot
      )
    }
  )
  const selectedAdapterDef =
    selectedAdapterDefURI != null
      ? defs[selectedAdapterDefURI] ?? customLabwareDefs[selectedAdapterDefURI]
      : null
  const selectedTopLabwareDef =
    selectedTopLabware.labwareDefURI != null
      ? defs[selectedTopLabware.labwareDefURI] ??
        customLabwareDefs[selectedTopLabware.labwareDefURI]
      : null

  const orientation =
    slotPosition != null
      ? inferModuleOrientationFromXCoordinate(slotPosition[0])
      : null

  const labwareInfos: DeckLabelProps[] = []

  if (selectedTopLabwareDef != null) {
    const selectedTopLabwareLabel = {
      text: selectedTopLabwareDef.metadata.displayName,
      isSelected: true,
      isLast: true,
      isZoomed: true,
    }
    labwareInfos.push(selectedTopLabwareLabel)
  }
  if (selectedAdapterDefURI != null) {
    const def =
      defs[selectedAdapterDefURI] ?? customLabwareDefs[selectedAdapterDefURI]
    const selectedAdapterLabel = {
      text: def.metadata.displayName,
      isSelected: true,
      isLast: selectedTopLabware.labwareDefURI == null,
      isZoomed: true,
    }
    labwareInfos.push(selectedAdapterLabel)
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
          {/*
          todo(mm, 2025-07-10): This <Module> and <ModuleLabel> positioning is not
          quite right, most obviously for the Thermocycler on a Flex. We aren't
          passing a targetSlotId and targetDeckId down to <Module>, which means
          it isn't applying slot-specific adjustments.
          */}
          <Module
            key={`${selectedModuleModel}_${selectedSlot.slot}_selected`}
            x={slotPosition[0]}
            y={slotPosition[1]}
            def={getModuleDef(selectedModuleModel)}
            orientation={orientation}
            targetDeckId={null}
            targetSlotId={null}
            childrenPositioningMode="offsetToSlot"
          >
            <SelectedModuleLabwareRender
              topLabwareOnDeck={matchingSelectedTopLabwareOnDeck}
              adapterDef={selectedAdapterDef}
              moduleModel={selectedModuleModel}
            />
          </Module>
          {selectedModuleModel != null ? (
            <ModuleLabel
              isLast={selectedAdapterDefURI == null}
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
        showModuleIcon={selectedTopLabware.amount > 1}
        labwareOnDeck={matchingSelectedTopLabwareOnDeck}
        labwareDef={selectedTopLabwareDef ?? selectedAdapterDef}
        slotPosition={slotPosition}
        moduleModel={selectedModuleModel ?? null}
        nestedLabwareInfo={
          selectedAdapterDef != null && selectedTopLabwareDef != null
            ? [
                {
                  text: selectedAdapterDef?.metadata.displayName,
                  isSelected: true,
                  isLast: true,
                  isZoomed: true,
                },
              ]
            : undefined
        }
      />
    </>
  )
}
