import { Fragment } from 'react'
import values from 'lodash/values'

import { Module } from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_TYPE,
  getAddressableAreaFromSlotId,
  getModuleDef,
  getPositionFromAddressableAreaId,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
  isAddressableAreaStandardSlot,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_A3_ADDRESSABLE_AREA,
  VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  getSlotInLocationStack,
  VACUUM_DOCK_LOCATION,
} from '@opentrons/step-generation'

import { HOPPER_LABWARE_X_OFFSET } from '/protocol-designer/constants'

import { LabwareOnDeck } from '../../components/organisms'
import {
  getSlotIdsBlockedBySpanningForThermocycler,
  getSlotIsEmpty,
} from '../../step-forms'
import {
  getLabwaresOnModuleFromStack,
  getStagingAreaAddressableAreas,
} from '../../utils'
import { SlotHover } from './SlotHover'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CutoutId,
  DeckConfiguration,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type { InitialDeckSetup, ModuleOnDeck } from '../../step-forms'

interface DeckSetupDetailsProps {
  initialDeckSetup: InitialDeckSetup
  deckDef: DeckDefinition
  stagingAreaCutoutIds: CutoutId[]
  hover: string | null
  setHover: Dispatch<SetStateAction<string | null>>
  robotType: RobotType
  deckConfig: DeckConfiguration
}

export const DeckThumbnailDetails = (
  props: DeckSetupDetailsProps
): JSX.Element => {
  const {
    initialDeckSetup,
    deckDef,
    stagingAreaCutoutIds,
    robotType,
    hover,
    setHover,
    deckConfig,
  } = props
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanningForThermocycler(
    initialDeckSetup,
    robotType
  )

  const allLabware = Object.values(initialDeckSetup.labware)
  const allModules: ModuleOnDeck[] = values(initialDeckSetup.modules)

  return (
    <>
      {/* all modules */}
      {allModules.map(({ id, slot, model, moduleState }) => {
        const slotId = slot
        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        if (slotPosition == null) {
          console.warn(`no slot ${slotId} for module ${id}`)
          return null
        }
        const moduleDef = getModuleDef(model)
        const { type: moduleType } = moduleState
        const { topMostId, rightBelowTopId, hopperTopMostId } =
          getLabwaresOnModuleFromStack(id, allLabware)
        return (
          <Fragment key={id}>
            <Module
              key={slot}
              x={slotPosition[0]}
              y={slotPosition[1]}
              def={moduleDef}
              orientation={inferModuleOrientationFromXCoordinate(
                slotPosition[0]
              )}
              innerProps={
                moduleState.type === THERMOCYCLER_MODULE_TYPE
                  ? { lidMotorState: 'open' }
                  : {}
              }
              targetSlotId={slotId}
              targetDeckId={deckDef.otId}
              childrenPositioningMode={
                moduleState.type === FLEX_STACKER_MODULE_TYPE
                  ? 'passThrough'
                  : 'offsetToSlot'
              }
            >
              <>
                {hopperTopMostId != null ? (
                  <>
                    <LabwareOnDeck
                      x={HOPPER_LABWARE_X_OFFSET}
                      y={0}
                      labwareOnDeck={initialDeckSetup.labware[hopperTopMostId]}
                    />
                  </>
                ) : null}
                {rightBelowTopId != null ? (
                  <LabwareOnDeck
                    x={0}
                    y={0}
                    labwareOnDeck={initialDeckSetup.labware[rightBelowTopId]}
                  />
                ) : null}
                {topMostId != null ? (
                  <LabwareOnDeck
                    x={0}
                    y={0}
                    labwareOnDeck={initialDeckSetup.labware[topMostId]}
                  />
                ) : null}
                <SlotHover
                  robotType={robotType}
                  hover={hover}
                  setHover={setHover}
                  slotPosition={[0, 0, 0]}
                  slotId={
                    moduleState.type === VACUUM_MODULE_TYPE
                      ? VACUUM_MODULE_A3_ADDRESSABLE_AREA
                      : slotId
                  }
                />
                {moduleType === FLEX_STACKER_MODULE_TYPE ? (
                  <SlotHover
                    robotType={robotType}
                    hover={hover}
                    setHover={setHover}
                    slotPosition={[HOPPER_LABWARE_X_OFFSET, 0, 0]}
                    slotId={`hopper${slotId}`}
                  />
                ) : null}
              </>
            </Module>
          </Fragment>
        )
      })}
      {/* vacuum dock labware rendered at addressable area position rather than within module */}
      {allModules
        .filter(module => module.type === VACUUM_MODULE_TYPE)
        .map(vacuumModule => {
          const dockSlotPosition = getPositionFromAddressableAreaId({
            addressableAreaId: VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA,
            deckDef,
            deckConfiguration: deckConfig,
          })
          if (dockSlotPosition == null) {
            return null
          }
          const dockLabware = allLabware
            .filter(
              lw =>
                lw.stack.includes(vacuumModule.id) &&
                lw.stack.includes(VACUUM_DOCK_LOCATION)
            )
            .sort((a, b) => a.stack.length - b.stack.length)
          return (
            <Fragment key={`${vacuumModule.id}_dock`}>
              {dockLabware.map(lw => (
                <LabwareOnDeck
                  key={lw.id}
                  x={dockSlotPosition[0]}
                  y={dockSlotPosition[1]}
                  labwareOnDeck={lw}
                />
              ))}
              {/* SlotHover rendered after labware so it appears on top in SVG */}
              <SlotHover
                robotType={robotType}
                hover={hover}
                setHover={setHover}
                slotPosition={dockSlotPosition}
                slotId={VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA}
              />
            </Fragment>
          )
        })}
      {/* all labware on deck NOT those in modules */}
      {allLabware.map(labware => {
        if (
          getSlotInLocationStack(labware.stack) === 'offDeck' ||
          allModules.some(m => labware.stack.includes(m.id)) ||
          labware.stack.includes('fixedTrash')
        ) {
          return null
        }
        const slot = getSlotInLocationStack(labware.stack)

        const slotPosition = getPositionFromSlotId(slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          slot,
          deckDef
        )?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(`no slot ${slot} for labware ${labware.id}!`)
          return null
        }
        return (
          <Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            <SlotHover
              robotType={robotType}
              hover={hover}
              setHover={setHover}
              slotPosition={slotPosition}
              slotId={slot}
            />
          </Fragment>
        )
      })}

      {/* SlotControls for all empty deck */}
      {deckDef.locations.addressableAreas
        .filter(addressableArea => {
          const stagingAreaAddressableAreas =
            getStagingAreaAddressableAreas(stagingAreaCutoutIds)
          const addressableAreas =
            isAddressableAreaStandardSlot(addressableArea.id, deckDef) ||
            stagingAreaAddressableAreas.includes(addressableArea.id)
          return (
            addressableAreas &&
            !slotIdsBlockedBySpanning.includes(addressableArea.id) &&
            getSlotIsEmpty(initialDeckSetup, addressableArea.id, false)
          )
        })
        .map(addressableArea => {
          return (
            <Fragment key={addressableArea.id}>
              <SlotHover
                robotType={robotType}
                hover={hover}
                setHover={setHover}
                slotPosition={getPositionFromSlotId(
                  addressableArea.id,
                  deckDef
                )}
                slotId={addressableArea.id}
              />
            </Fragment>
          )
        })}
    </>
  )
}
