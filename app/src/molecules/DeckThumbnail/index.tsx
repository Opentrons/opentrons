import * as React from 'react'
import { useSelector } from 'react-redux'
import map from 'lodash/map'

import {
  RobotWorkSpace,
  Module,
  LabwareRender,
  SlotLabels,
  COLORS,
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  getModuleDef2,
  getDeckDefFromRobotType,
  getRobotTypeFromLoadedLabware,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import {
  parseInitialLoadedLabwareBySlot,
  parseInitialLoadedLabwareByModuleId,
  parseInitialLoadAdapterBySlot,
  parseInitialLoadedModulesBySlot,
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
  parseInitialLoadedLabwareByAdapter,
} from '@opentrons/api-client'
import { getWellFillFromLabwareId } from '../../organisms/Devices/ProtocolRun/SetupLiquids/utils'
import { getIsOnDevice } from '../../redux/config'
import { getStandardDeckViewLayerBlockList } from './utils/getStandardDeckViewLayerBlockList'
import { getStandardDeckViewBox } from './utils/getStandardViewBox'

import type { StyleProps } from '@opentrons/components'
import type {
  DeckSlot,
  Liquid,
  LoadedLabware,
  RunTimeCommand,
} from '@opentrons/shared-data'

interface DeckThumbnailProps extends StyleProps {
  commands: RunTimeCommand[]
  labware: LoadedLabware[]
  liquids?: Liquid[]
  showSlotLabels?: boolean
}

export function DeckThumbnail(props: DeckThumbnailProps): JSX.Element {
  const {
    commands,
    liquids,
    labware = [],
    showSlotLabels = false,
    ...styleProps
  } = props
  const robotType = getRobotTypeFromLoadedLabware(labware)
  const deckDef = getDeckDefFromRobotType(robotType)
  const initialLoadedLabwareBySlot = parseInitialLoadedLabwareBySlot(commands)
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    commands
  )
  const initialLoadedAdapterBySlot = parseInitialLoadAdapterBySlot(commands)
  const initialLoadedModulesBySlot = parseInitialLoadedModulesBySlot(commands)
  const initialLoadedLabwareByModuleId = parseInitialLoadedLabwareByModuleId(
    commands
  )
  const liquidsInLoadOrder = parseLiquidsInLoadOrder(
    liquids != null ? liquids : [],
    commands
  )
  const labwareByLiquidId = parseLabwareInfoByLiquidId(commands)
  const isOnDevice = useSelector(getIsOnDevice)
  // TODO(bh, 2023-7-12): replace with color constant when added to design system
  const deckFill = isOnDevice ? COLORS.light1 : '#e6e6e6'

  return (
    // PR #10488 changed size
    // revert the height
    // Note add offset 18px to right and left
    <RobotWorkSpace
      deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
      deckDef={deckDef}
      deckFill={deckFill}
      trashSlotName="A3"
      viewBox={getStandardDeckViewBox(robotType)}
      {...styleProps}
    >
      {({ deckSlotsById }) => (
        <>
          {map<DeckSlot>(deckSlotsById, (slot: DeckSlot, slotId: string) => {
            if (slot.matingSurfaceUnitVector == null) return null // if slot has no mating surface, don't render anything in it
            const moduleInSlot =
              slotId in initialLoadedModulesBySlot
                ? initialLoadedModulesBySlot[slotId]
                : null
            const labwareInSlot =
              slotId in initialLoadedLabwareBySlot
                ? initialLoadedLabwareBySlot[slotId]
                : null
            const adapterInSlot =
              slotId in initialLoadedAdapterBySlot
                ? initialLoadedAdapterBySlot[slotId]
                : null
            const labwareInModule =
              moduleInSlot?.result?.moduleId != null &&
              moduleInSlot.result.moduleId in initialLoadedLabwareByModuleId
                ? initialLoadedLabwareByModuleId[moduleInSlot.result.moduleId]
                : null
            let labwareInAdapterInMod = null
            let labwareId =
              labwareInSlot != null ? labwareInSlot.result?.labwareId : null
            let labwareInAdapter = null
            let labwareInModuleId
            if (
              labwareInModule?.result != null &&
              'labwareId' in labwareInModule.result
            ) {
              labwareInAdapter =
                initialLoadedLabwareByAdapter[labwareInModule?.result.labwareId]

              labwareInModuleId = labwareInModule?.result.labwareId

              labwareId =
                labwareInAdapter != null
                  ? labwareInAdapter.result?.labwareId
                  : labwareInModule?.result.labwareId
            } else if (
              labwareInModule?.result != null &&
              'adapterId' in labwareInModule.result
            ) {
              labwareInAdapterInMod =
                initialLoadedLabwareByAdapter[labwareInModule?.result.adapterId]
              labwareInModuleId = labwareInModule?.result.adapterId
              labwareId = labwareInAdapterInMod.result?.labwareId
            }
            const wellFill =
              labwareId != null && liquids != null
                ? getWellFillFromLabwareId(
                    labwareId,
                    liquidsInLoadOrder,
                    labwareByLiquidId
                  )
                : null
            return (
              <React.Fragment key={slotId}>
                {moduleInSlot != null ? (
                  <Module
                    x={slot.position[0]}
                    y={slot.position[1]}
                    orientation={inferModuleOrientationFromXCoordinate(
                      slot.position[0]
                    )}
                    def={getModuleDef2(moduleInSlot.params.model)}
                    innerProps={
                      moduleInSlot.params.model === THERMOCYCLER_MODULE_V1
                        ? { lidMotorState: 'open' }
                        : {}
                    }
                  >
                    {labwareInModule?.result?.definition != null ? (
                      <LabwareRender
                        definition={
                          labwareInAdapterInMod?.result != null
                            ? labwareInAdapterInMod?.result?.definition
                            : labwareInModule?.result?.definition
                        }
                        wellFill={wellFill ?? undefined}
                      />
                    ) : null}
                  </Module>
                ) : null}
                {labwareInSlot?.result?.definition != null ? (
                  <g
                    transform={`translate(${slot.position[0]},${slot.position[1]})`}
                  >
                    <LabwareRender
                      definition={
                        labwareInAdapter?.result != null
                          ? labwareInAdapter.result.definition
                          : labwareInSlot.result.definition
                      }
                      wellFill={wellFill ?? undefined}
                    />
                  </g>
                ) : null}
                {adapterInSlot?.result?.definition != null ? (
                  <g
                    transform={`translate(${slot.position[0]},${slot.position[1]})`}
                  >
                    <LabwareRender
                      definition={adapterInSlot.result.definition}
                      wellFill={wellFill ?? undefined}
                    />
                  </g>
                ) : null}
              </React.Fragment>
            )
          })}
          {showSlotLabels ? <SlotLabels robotType={robotType} /> : null}
        </>
      )}
    </RobotWorkSpace>
  )
}
