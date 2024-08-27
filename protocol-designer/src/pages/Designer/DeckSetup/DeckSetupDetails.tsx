import * as React from 'react'
import compact from 'lodash/compact'
import values from 'lodash/values'

import { Module } from '@opentrons/components'
import { MODULES_WITH_COLLISION_ISSUES } from '@opentrons/step-generation'
import {
  getAddressableAreaFromSlotId,
  getLabwareHasQuirk,
  getModuleDef2,
  getPositionFromSlotId,
  inferModuleOrientationFromSlot,
  inferModuleOrientationFromXCoordinate,
  isAddressableAreaStandardSlot,
  SPAN7_8_10_11_SLOT,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  getSlotIdsBlockedBySpanning,
  getSlotIsEmpty,
} from '../../../step-forms'
import { LabwareOnDeck } from '../../../components/DeckSetup/LabwareOnDeck'
import { SlotWarning } from '../../../components/DeckSetup/SlotWarning'
import { getStagingAreaAddressableAreas } from '../../../utils'
import { DeckItemHover } from './DeckItemHover'

import type { ModuleTemporalProperties } from '@opentrons/step-generation'
import type {
  AddressableAreaName,
  CutoutId,
  DeckDefinition,
  Dimensions,
} from '@opentrons/shared-data'
import type {
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '../../../step-forms'
import type { TerminalItemId } from '../../../steplist'

interface DeckSetupDetailsProps {
  activeDeckSetup: InitialDeckSetup
  showGen1MultichannelCollisionWarnings: boolean
  deckDef: DeckDefinition
  stagingAreaCutoutIds: CutoutId[]
  trashSlot: string | null
  addEquipment: (slotId: string) => void
  hover: string | null
  setHover: React.Dispatch<React.SetStateAction<string | null>>
  selectedTerminalItemId?: TerminalItemId | null
}

export const DeckSetupDetails = (props: DeckSetupDetailsProps): JSX.Element => {
  const {
    activeDeckSetup,
    showGen1MultichannelCollisionWarnings,
    deckDef,
    trashSlot,
    addEquipment,
    stagingAreaCutoutIds,
    selectedTerminalItemId,
    hover,
    setHover,
  } = props
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanning(activeDeckSetup)

  const allLabware: LabwareOnDeckType[] = Object.keys(
    activeDeckSetup.labware
  ).reduce<LabwareOnDeckType[]>((acc, labwareId) => {
    const labware = activeDeckSetup.labware[labwareId]
    return getLabwareHasQuirk(labware.def, 'fixedTrash')
      ? acc
      : [...acc, labware]
  }, [])

  const allModules: ModuleOnDeck[] = values(activeDeckSetup.modules)

  // NOTE: naively hard-coded to show warning north of slots 1 or 3 when occupied by any module
  const multichannelWarningSlotIds: AddressableAreaName[] = showGen1MultichannelCollisionWarnings
    ? compact([
        allModules.some(
          moduleOnDeck =>
            moduleOnDeck.slot === '1' &&
            MODULES_WITH_COLLISION_ISSUES.includes(moduleOnDeck.model)
        )
          ? deckDef.locations.addressableAreas.find(s => s.id === '4')?.id
          : null,
        allModules.some(
          moduleOnDeck =>
            moduleOnDeck.slot === '3' &&
            MODULES_WITH_COLLISION_ISSUES.includes(moduleOnDeck.model)
        )
          ? deckDef.locations.addressableAreas.find(s => s.id === '6')?.id
          : null,
      ])
    : []

  return (
    <>
      {/* all modules */}
      {allModules.map(moduleOnDeck => {
        const slotId =
          moduleOnDeck.slot === SPAN7_8_10_11_SLOT ? '7' : moduleOnDeck.slot

        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        if (slotPosition == null) {
          console.warn(`no slot ${slotId} for module ${moduleOnDeck.id}`)
          return null
        }
        const moduleDef = getModuleDef2(moduleOnDeck.model)

        const getModuleInnerProps = (
          moduleState: ModuleTemporalProperties['moduleState']
        ): React.ComponentProps<typeof Module>['innerProps'] => {
          if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
            let lidMotorState = 'unknown'
            if (
              selectedTerminalItemId === '__initial_setup__' ||
              moduleState.lidOpen === true
            ) {
              lidMotorState = 'open'
            } else if (moduleState.lidOpen === false) {
              lidMotorState = 'closed'
            }
            return {
              lidMotorState,
              blockTargetTemp: moduleState.blockTargetTemp,
            }
          } else if (
            'targetTemperature' in moduleState &&
            moduleState.type === 'temperatureModuleType'
          ) {
            return {
              targetTemperature: moduleState.targetTemperature,
            }
          } else if ('targetTemp' in moduleState) {
            return {
              targetTemp: moduleState.targetTemp,
            }
          }
        }
        const labwareLoadedOnModule = allLabware.find(
          lw => lw.slot === moduleOnDeck.id
        )
        const labwareInterfaceBoundingBox = {
          xDimension: moduleDef.dimensions.labwareInterfaceXDimension ?? 0,
          yDimension: moduleDef.dimensions.labwareInterfaceYDimension ?? 0,
          zDimension: 0,
        }
        const controlSelectDimensions = {
          xDimension: labwareLoadedOnModule?.def.dimensions.xDimension ?? 0,
          yDimension: labwareLoadedOnModule?.def.dimensions.yDimension ?? 0,
          zDimension: labwareLoadedOnModule?.def.dimensions.zDimension ?? 0,
        }
        return (
          <React.Fragment key={moduleOnDeck.id}>
            <Module
              key={moduleOnDeck.slot}
              x={slotPosition[0]}
              y={slotPosition[1]}
              def={moduleDef}
              orientation={inferModuleOrientationFromXCoordinate(
                slotPosition[0]
              )}
              innerProps={getModuleInnerProps(moduleOnDeck.moduleState)}
              targetSlotId={slotId}
              targetDeckId={deckDef.otId}
            >
              {labwareLoadedOnModule != null ? (
                <>
                  <LabwareOnDeck
                    x={0}
                    y={0}
                    labwareOnDeck={labwareLoadedOnModule}
                  />
                  <DeckItemHover
                    hover={hover}
                    setHover={setHover}
                    addEquipment={addEquipment}
                    slotBoundingBox={controlSelectDimensions}
                    slotPosition={[0, 0, 0]}
                    itemId={slotId}
                    selectedTerminalItemId={props.selectedTerminalItemId}
                  />
                </>
              ) : null}

              {labwareLoadedOnModule == null ? (
                <DeckItemHover
                  hover={hover}
                  setHover={setHover}
                  addEquipment={addEquipment}
                  slotBoundingBox={labwareInterfaceBoundingBox}
                  slotPosition={[0, 0, 0]}
                  itemId={slotId}
                  selectedTerminalItemId={props.selectedTerminalItemId}
                />
              ) : null}
            </Module>
          </React.Fragment>
        )
      })}

      {/* on-deck warnings for OT-2 and GEN1 8-channels only */}
      {multichannelWarningSlotIds.map(slotId => {
        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(slotId, deckDef)
          ?.boundingBox
        return slotPosition != null && slotBoundingBox != null ? (
          <SlotWarning
            key={slotId}
            warningType="gen1multichannel"
            x={slotPosition[0]}
            y={slotPosition[1]}
            xDimension={slotBoundingBox.xDimension}
            yDimension={slotBoundingBox.yDimension}
            orientation={inferModuleOrientationFromSlot(slotId)}
          />
        ) : null
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
            getSlotIsEmpty(activeDeckSetup, addressableArea.id) &&
            addressableArea.id !== trashSlot
          )
        })
        .map(addressableArea => {
          return (
            <React.Fragment key={addressableArea.id}>
              <DeckItemHover
                hover={hover}
                setHover={setHover}
                addEquipment={addEquipment}
                slotBoundingBox={addressableArea.boundingBox}
                slotPosition={getPositionFromSlotId(
                  addressableArea.id,
                  deckDef
                )}
                itemId={addressableArea.id}
                selectedTerminalItemId={props.selectedTerminalItemId}
              />
            </React.Fragment>
          )
        })}
      {/* all labware on deck NOT those in modules */}
      {allLabware.map(labware => {
        if (
          labware.slot === 'offDeck' ||
          allModules.some(m => m.id === labware.slot) ||
          allLabware.some(lab => lab.id === labware.slot)
        )
          return null

        const slotPosition = getPositionFromSlotId(labware.slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          labware.slot,
          deckDef
        )?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            <DeckItemHover
              hover={hover}
              setHover={setHover}
              addEquipment={addEquipment}
              slotBoundingBox={slotBoundingBox}
              slotPosition={slotPosition}
              itemId={labware.slot}
              selectedTerminalItemId={props.selectedTerminalItemId}
            />
          </React.Fragment>
        )
      })}

      {/* all nested labwares on deck  */}
      {allLabware.map(labware => {
        if (
          allModules.some(m => m.id === labware.slot) ||
          labware.slot === 'offDeck'
        )
          return null
        if (
          deckDef.locations.addressableAreas.some(
            addressableArea => addressableArea.id === labware.slot
          )
        ) {
          return null
        }
        const slotForOnTheDeck = allLabware.find(lab => lab.id === labware.slot)
          ?.slot
        const slotForOnMod = allModules.find(mod => mod.id === slotForOnTheDeck)
          ?.slot
        let slotPosition = null
        if (slotForOnMod != null) {
          slotPosition = getPositionFromSlotId(slotForOnMod, deckDef)
        } else if (slotForOnTheDeck != null) {
          slotPosition = getPositionFromSlotId(slotForOnTheDeck, deckDef)
        }
        if (slotPosition == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        const slotBoundingBox: Dimensions = {
          xDimension: labware.def.dimensions.xDimension,
          yDimension: labware.def.dimensions.yDimension,
          zDimension: labware.def.dimensions.zDimension,
        }
        const slotOnDeck =
          slotForOnTheDeck != null
            ? allModules.find(module => module.id === slotForOnTheDeck)?.slot
            : null
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            <DeckItemHover
              hover={hover}
              setHover={setHover}
              addEquipment={addEquipment}
              slotBoundingBox={slotBoundingBox}
              slotPosition={slotPosition}
              itemId={slotOnDeck ?? ''}
              selectedTerminalItemId={props.selectedTerminalItemId}
            />
          </React.Fragment>
        )
      })}
    </>
  )
}
