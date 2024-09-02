import * as React from 'react'
import { useSelector } from 'react-redux'
import { FixtureRender } from './FixtureRender'
import { LabwareRender, Module } from '@opentrons/components'
import {
  getModuleDef2,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import { selectors } from '../../../labware-ingred/selectors'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { ModuleLabel } from './ModuleLabel'
import type {
  CoordinateTuple,
  DeckDefinition,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'
import type { DeckLabelProps } from '@opentrons/components'
import type { Fixture } from './constants'

interface SelectedHoveredItemsProps {
  deckDef: DeckDefinition
  robotType: RobotType
  hoveredLabware: string | null
  hoveredModule: ModuleModel | null
  hoveredFixture: Fixture | null
  slotPosition: CoordinateTuple | null
}
export const SelectedHoveredItems = (
  props: SelectedHoveredItemsProps
): JSX.Element => {
  const {
    deckDef,
    robotType,
    hoveredFixture,
    hoveredModule,
    hoveredLabware,
    slotPosition,
  } = props
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const {
    zoomedInSlot,
    selectedFixture,
    selectedLabwareDefUri,
    selectedModuleModel,
    selectedNestedLabwareDefUri,
  } = zoomedInSlotInfo
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getOnlyLatestDefs()

  const hoveredLabwareDef =
    hoveredLabware != null
      ? defs[hoveredLabware] ?? customLabwareDefs[hoveredLabware] ?? null
      : null
  const orientation =
    slotPosition != null
      ? inferModuleOrientationFromXCoordinate(slotPosition[0])
      : null

  const labwareInfos: DeckLabelProps[] = []
  if (
    (hoveredLabware != null ||
      selectedLabwareDefUri === hoveredLabware ||
      selectedNestedLabwareDefUri === hoveredLabware) &&
    hoveredLabwareDef != null
  ) {
    const hoverLabelLabel = {
      text: hoveredLabwareDef.metadata.displayName,
      isSelected: false,
      isLast: true,
    }
    labwareInfos.push(hoverLabelLabel)
  }
  if (
    selectedLabwareDefUri != null &&
    hoveredLabware !== selectedLabwareDefUri
  ) {
    const def = defs[selectedLabwareDefUri]
    const selectedLabwareLabel = {
      text: def.metadata.displayName,
      isSelected: true,
      isLast: hoveredLabware == null && selectedNestedLabwareDefUri == null,
    }
    labwareInfos.push(selectedLabwareLabel)
  }
  if (
    selectedNestedLabwareDefUri != null &&
    hoveredLabware !== selectedNestedLabwareDefUri
  ) {
    const def = defs[selectedNestedLabwareDefUri]
    const selectedNestedLabwareLabel = {
      text: def.metadata.displayName,
      isSelected: true,
      isLast: hoveredLabware == null,
    }
    labwareInfos.push(selectedNestedLabwareLabel)
  }
  return (
    <>
      {selectedFixture != null &&
      zoomedInSlot.cutout != null &&
      hoveredFixture == null &&
      hoveredModule == null ? (
        <FixtureRender
          fixture={selectedFixture}
          cutout={zoomedInSlot.cutout}
          robotType={robotType}
          deckDef={deckDef}
        />
      ) : null}
      {selectedModuleModel != null &&
      slotPosition != null &&
      hoveredModule == null &&
      hoveredFixture == null &&
      orientation != null ? (
        <>
          <Module
            key={`${selectedModuleModel}_${zoomedInSlot.slot}_selected`}
            x={slotPosition[0]}
            y={slotPosition[1]}
            def={getModuleDef2(selectedModuleModel)}
            orientation={orientation}
          >
            <>
              {selectedLabwareDefUri != null &&
              selectedModuleModel != null &&
              hoveredLabware == null ? (
                <g transform={`translate(0, 0)`}>
                  <LabwareRender definition={defs[selectedLabwareDefUri]} />
                </g>
              ) : null}
              {selectedNestedLabwareDefUri != null &&
              selectedModuleModel != null &&
              hoveredLabware == null ? (
                <g transform={`translate(0, 0)`}>
                  <LabwareRender
                    definition={defs[selectedNestedLabwareDefUri]}
                  />
                </g>
              ) : null}
              {hoveredLabwareDef != null && selectedModuleModel != null ? (
                <g transform={`translate(0, 0)`}>
                  <LabwareRender definition={hoveredLabwareDef} />
                </g>
              ) : null}
            </>
          </Module>
          {selectedModuleModel != null ? (
            <ModuleLabel
              isLast={hoveredLabware == null && selectedLabwareDefUri == null}
              moduleModel={selectedModuleModel}
              position={slotPosition}
              orientation={orientation}
              isSelected={true}
              labwareInfos={labwareInfos}
            />
          ) : null}
        </>
      ) : null}

      {/* TODO(ja): add labware labels with no module in a follow up */}
      {selectedLabwareDefUri != null &&
      slotPosition != null &&
      selectedModuleModel == null &&
      hoveredLabware == null ? (
        <g transform={`translate(${slotPosition[0]}, ${slotPosition[1]})`}>
          <LabwareRender definition={defs[selectedLabwareDefUri]} />
        </g>
      ) : null}
      {selectedNestedLabwareDefUri != null &&
      slotPosition != null &&
      selectedModuleModel == null &&
      hoveredLabware == null ? (
        <g transform={`translate(${slotPosition[0]}, ${slotPosition[1]})`}>
          <LabwareRender definition={defs[selectedNestedLabwareDefUri]} />
        </g>
      ) : null}
    </>
  )
}
