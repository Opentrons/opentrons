import { useSelector } from 'react-redux'

import { Module } from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_TYPE,
  getAllDefinitions,
  getModuleDef,
  getModuleType,
  inferModuleOrientationFromXCoordinate,
  VACUUM_MODULE_V1,
} from '@opentrons/shared-data'
import {
  getSlotInLocationStack,
  VACUUM_DOCK_ADDRESSABLE_AREA,
} from '@opentrons/step-generation'

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
  isSlotAHopper: boolean
}
export const SelectedItems = (props: SelectedItemsProps): JSX.Element => {
  const { deckDef, robotType, slotPosition, isSlotAHopper } = props
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const {
    selectedSlot,
    selectedTopLabware,
    selectedAdapterDefURI,
    selectedFixture,
    selectedModuleModel,
    selectedLidLabware,
  } = selectedSlotInfo
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getAllDefinitions()
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
  const matchingSelectedLidOnDeck = Object.values(labware).find(
    ({ stack, labwareDefURI }) => {
      const matchingSlot = getSlotInLocationStack(stack)
      return (
        labwareDefURI === selectedLidLabware &&
        matchingSlot === selectedSlot.slot
      )
    }
  )
  const selectedAdapterDef =
    selectedAdapterDefURI != null
      ? (defs[selectedAdapterDefURI] ??
        customLabwareDefs[selectedAdapterDefURI])
      : null
  const selectedTopLabwareDef =
    selectedTopLabware.labwareDefURI != null
      ? (defs[selectedTopLabware.labwareDefURI] ??
        customLabwareDefs[selectedTopLabware.labwareDefURI])
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
  const lengthOfStack =
    (selectedLidLabware ? 1 : 0) +
    (selectedAdapterDefURI ? 1 : 0) +
    (selectedTopLabware?.labwareDefURI ? 1 : 0)

  const isVacuumDock = selectedSlot.slot === VACUUM_DOCK_ADDRESSABLE_AREA

  const transformedModuleModel = isVacuumDock
    ? VACUUM_MODULE_V1
    : selectedModuleModel

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
      {transformedModuleModel != null &&
      slotPosition != null &&
      orientation != null ? (
        <>
          {/*
          todo(mm, 2025-07-10): This <Module> and <ModuleLabel> positioning is not
          quite right, most obviously for the Thermocycler on a Flex. We aren't
          passing a targetSlotId and targetDeckId down to <Module>, which means
          it isn't applying slot-specific adjustments.

          note: we need to special-case labware on the hopper since it is the 2nd slot
          available for labware on the stacker. so we don't want to re-render the stacker
          in the hopper slot
          */}
          {isSlotAHopper || isVacuumDock ? null : (
            <Module
              key={`${transformedModuleModel}_${selectedSlot.slot}_selected`}
              x={slotPosition[0]}
              y={slotPosition[1]}
              def={getModuleDef(transformedModuleModel)}
              orientation={orientation}
              targetDeckId={null}
              targetSlotId={null}
              childrenPositioningMode={
                getModuleType(transformedModuleModel) ===
                FLEX_STACKER_MODULE_TYPE
                  ? 'passThrough'
                  : 'offsetToSlot'
              }
            >
              <SelectedModuleLabwareRender
                topLabwareOnDeck={matchingSelectedTopLabwareOnDeck}
                adapterDef={selectedAdapterDef}
                moduleModel={transformedModuleModel}
                lidOnDeck={matchingSelectedLidOnDeck}
              />
            </Module>
          )}
          {transformedModuleModel != null ? (
            <ModuleLabel
              isLast={selectedAdapterDefURI == null}
              moduleModel={transformedModuleModel}
              position={slotPosition}
              orientation={orientation}
              isSelected={true}
              labwareInfos={labwareInfos}
              slot={selectedSlot.slot}
              showModuleIcon={
                selectedTopLabware.amount > 1 || lengthOfStack > 1
              }
              isVacuumDock={isVacuumDock}
            />
          ) : null}
        </>
      ) : null}
      <SelectedLabwareRender
        showModuleIcon={selectedTopLabware.amount > 1 || lengthOfStack > 1}
        labwareDef={selectedTopLabwareDef ?? selectedAdapterDef}
        slotPosition={slotPosition}
        moduleModel={transformedModuleModel}
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
