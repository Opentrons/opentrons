import * as React from 'react'
import {
  DeckSlot,
  RobotType,
  getDeckDefFromRobotType,
  ModuleModel,
  ModuleLocation,
  getModuleDef2,
  LabwareDefinition2,
  inferModuleOrientationFromXCoordinate,
  LabwareLocation,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { Module } from '../Module'
import { LabwareRender } from '../Labware'
import { FlexTrash } from '../Deck/FlexTrash'
import { DeckSlotLocation } from '../DeckSlotLocation'
import { DeckFromData } from '../Deck/DeckFromData'
import { SlotLabels } from '../Deck'
import { COLORS } from '../../ui-style-constants'

interface BaseDeckProps {
  robotType: RobotType
  labwareLocations: Array<{
    labwareLocation: LabwareLocation
    definition: LabwareDefinition2
  }>
  moduleLocations: Array<{
    moduleModel: ModuleModel
    moduleLocation: ModuleLocation
    nestedLabwareDef?: LabwareDefinition2
    innerProps?: React.ComponentProps<typeof Module>['innerProps']
  }>
  lightFill?: string
  darkFill?: string
  trashSlotName?: DeckSlot['id']
  children?: React.ReactNode
}

export function BaseDeck(props: BaseDeckProps): JSX.Element {
  const {
    robotType,
    trashSlotName,
    moduleLocations,
    labwareLocations,
    lightFill = COLORS.light1,
    darkFill = COLORS.darkGreyEnabled,
    children,
  } = props
  const deckDef = getDeckDefFromRobotType(robotType)
  return (
    <RobotCoordinateSpace
      height="400px"
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
    >
      {robotType === OT2_ROBOT_TYPE ? (
        <DeckFromData def={deckDef} layerBlocklist={[]} />
      ) : (
        deckDef.locations.orderedSlots.map(slotDef => (
          <>
            <DeckSlotLocation
              slotName={slotDef.id}
              deckDefinition={deckDef}
              slotClipColor={
                slotDef.id === trashSlotName ? 'transparent' : darkFill
              }
              slotBaseColor={lightFill}
            />
            {slotDef.id === trashSlotName ? (
              <FlexTrash
                robotType={robotType}
                trashIconColor={lightFill}
                backgroundColor={darkFill}
              />
            ) : null}
          </>
        ))
      )}
      {moduleLocations.map(
        ({ moduleModel, moduleLocation, nestedLabwareDef, innerProps }) => {
          const slotDef = deckDef.locations.orderedSlots.find(
            s => s.id === moduleLocation.slotName
          )
          return slotDef != null ? (
            <Module
              def={getModuleDef2(moduleModel)}
              x={slotDef.position[0]}
              y={slotDef.position[1]}
              orientation={inferModuleOrientationFromXCoordinate(
                slotDef.position[0]
              )}
              innerProps={innerProps}
            >
              {nestedLabwareDef != null ? (
                <LabwareRender definition={nestedLabwareDef} />
              ) : null}
            </Module>
          ) : null
        }
      )}
      {labwareLocations.map(({ labwareLocation, definition }) => {
        const slotDef = deckDef.locations.orderedSlots.find(
          s =>
            labwareLocation !== 'offDeck' &&
            'slotName' in labwareLocation &&
            s.id === labwareLocation.slotName
        )
        return slotDef != null ? (
          <g
            transform={`translate(${slotDef.position[0]},${slotDef.position[1]})`}
          >
            <LabwareRender definition={definition} />
          </g>
        ) : null
      })}
      <SlotLabels robotType={robotType} color={darkFill} />
      {children}
    </RobotCoordinateSpace>
  )
}
