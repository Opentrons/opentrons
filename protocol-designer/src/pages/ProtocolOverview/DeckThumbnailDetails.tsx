import { Fragment } from 'react'
import values from 'lodash/values'

import { Module } from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getModuleDef2,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
  isAddressableAreaStandardSlot,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { LabwareOnDeck } from '../../components/organisms'
import {
  getSlotIdsBlockedBySpanningForThermocycler,
  getSlotIsEmpty,
} from '../../step-forms'
import {
  getStagingAreaAddressableAreas,
  getTopmostLabwareOnModuleFromStack,
} from '../../utils'
import { SlotHover } from './SlotHover'
import { getShowTCLid } from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CutoutId,
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
        const moduleDef = getModuleDef2(model)
        const labwareLoadedOnModuleId = getTopmostLabwareOnModuleFromStack(
          id,
          allLabware
        )
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
            >
              {labwareLoadedOnModuleId != null ? (
                <>
                  <LabwareOnDeck
                    x={0}
                    y={0}
                    labwareOnDeck={
                      initialDeckSetup.labware[labwareLoadedOnModuleId]
                    }
                  />
                  <SlotHover
                    robotType={robotType}
                    hover={hover}
                    setHover={setHover}
                    slotPosition={[0, 0, 0]}
                    slotId={slotId}
                  />
                </>
              ) : (
                <SlotHover
                  robotType={robotType}
                  hover={hover}
                  setHover={setHover}
                  slotPosition={[0, 0, 0]}
                  slotId={slotId}
                />
              )}
            </Module>
          </Fragment>
        )
      })}
      {/* all labware on deck NOT those in modules */}
      {allLabware.map(labware => {
        if (
          getSlotInLocationStack(labware.stack) === 'offDeck' ||
          allModules.some(m => labware.stack.includes(m.id)) ||
          getShowTCLid(labware)
        ) {
          return null
        }
        const slot = getSlotInLocationStack(labware.stack)

        const slotPosition = getPositionFromSlotId(slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(slot, deckDef)
          ?.boundingBox
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
          const stagingAreaAddressableAreas = getStagingAreaAddressableAreas(
            stagingAreaCutoutIds
          )
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
