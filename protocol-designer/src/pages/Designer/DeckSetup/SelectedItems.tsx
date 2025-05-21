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
import { Fixture } from './constants'
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
    selectedAdapterDefUri,
    selectedFixture,
    selectedModuleModel,
  } = selectedSlotInfo
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getAllLabwareDefs()
  const deckSetup = useSelector(getInitialDeckSetup)
  const { labware, modules, additionalEquipmentOnDeck } = deckSetup
  const matchingSelectedTopLabwareOnDeck = Object.values(labware).find(
    ({ stack, labwareDefURI }) => {
      const matchingSlot = getSlotInLocationStack(stack)
      return (
        labwareDefURI === selectedTopLabware.labwareDefUri &&
        matchingSlot === selectedSlot.slot
      )
    }
  )
  // const selectedModuleModel = Object.values(modules).find(
  //   module => module.slot === selectedSlot.slot
  // )?.model
  // const selectedFixture = Object.values(additionalEquipmentOnDeck).find(
  //   ae => ae.location === selectedSlot.cutout
  // )?.name as Fixture
  // console.log(
  //   'selecteditems selectedModuleModel',
  //   selectedSlot,
  //   selectedModuleModel
  // )
  const selectedAdapterDef =
    selectedAdapterDefUri != null
      ? defs[selectedAdapterDefUri] ?? customLabwareDefs[selectedAdapterDefUri]
      : null
  const selectedTopLabwareDef =
    selectedTopLabware.labwareDefUri != null
      ? defs[selectedTopLabware.labwareDefUri] ??
        customLabwareDefs[selectedTopLabware.labwareDefUri]
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
  if (selectedAdapterDefUri != null) {
    const def =
      defs[selectedAdapterDefUri] ?? customLabwareDefs[selectedAdapterDefUri]
    const selectedAdapterLabel = {
      text: def.metadata.displayName,
      isSelected: true,
      isLast: selectedTopLabware.labwareDefUri == null,
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
          <Module
            key={`${selectedModuleModel}_${selectedSlot.slot}_selected`}
            x={slotPosition[0]}
            y={slotPosition[1]}
            def={getModuleDef2(selectedModuleModel)}
            orientation={orientation}
          >
            <>
              <SelectedModuleLabwareRender
                topLabwareOnDeck={matchingSelectedTopLabwareOnDeck}
                adapterDef={selectedAdapterDef}
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
