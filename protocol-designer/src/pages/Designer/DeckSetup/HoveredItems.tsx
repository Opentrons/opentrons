import * as React from 'react'
import { useSelector } from 'react-redux'
import { FixtureRender } from './FixtureRender'
import { LabwareRender, Module } from '@opentrons/components'
import {
  getModuleDef2,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import { selectors } from '../../../labware-ingred/selectors'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import type {
  DeckDefinition,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'
import type { Fixture } from './constants'

interface HoveredLabwareProps {
  deckDef: DeckDefinition
  robotType: RobotType
  hoveredLabware: string | null
  hoveredModule: ModuleModel | null
  hoveredFixture: Fixture | null
}
export const HoveredItems = (props: HoveredLabwareProps): JSX.Element => {
  const {
    deckDef,
    robotType,
    hoveredLabware,
    hoveredModule,
    hoveredFixture,
  } = props
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { zoomedInSlot, selectedModuleModel } = zoomedInSlotInfo

  const hoveredSlotPosition = React.useMemo(
    () => getPositionFromSlotId(zoomedInSlot.slot ?? '', deckDef),
    [zoomedInSlot, deckDef]
  )
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getOnlyLatestDefs()
  const hoveredModuleDef =
    hoveredModule != null ? getModuleDef2(hoveredModule) : hoveredModule
  const hoveredLabwareDef =
    hoveredLabware != null
      ? defs[hoveredLabware] ?? customLabwareDefs[hoveredLabware] ?? null
      : null

  const orientation =
    hoveredSlotPosition != null
      ? inferModuleOrientationFromXCoordinate(hoveredSlotPosition[0])
      : null

  return (
    <>
      {hoveredFixture != null && zoomedInSlot.cutout != null ? (
        <FixtureRender
          fixture={hoveredFixture}
          cutout={zoomedInSlot.cutout}
          robotType={robotType}
          deckDef={deckDef}
        />
      ) : null}
      {hoveredModuleDef != null &&
      hoveredSlotPosition != null &&
      orientation != null ? (
        <Module
          key={`${hoveredModuleDef.model}_${zoomedInSlot.slot}_hover`}
          x={hoveredSlotPosition[0]}
          y={hoveredSlotPosition[1]}
          def={hoveredModuleDef}
          orientation={orientation}
        />
      ) : null}

      {hoveredLabwareDef != null &&
      hoveredSlotPosition != null &&
      selectedModuleModel == null ? (
        <React.Fragment key={`${hoveredLabwareDef.parameters.loadName}_hover`}>
          <g
            transform={`translate(${hoveredSlotPosition[0]}, ${hoveredSlotPosition[1]})`}
          >
            <LabwareRender definition={hoveredLabwareDef} />
          </g>
        </React.Fragment>
      ) : null}
    </>
  )
}
