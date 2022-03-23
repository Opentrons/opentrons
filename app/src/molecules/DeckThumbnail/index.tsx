import * as React from 'react'
import map from 'lodash/map'

import { RobotWorkSpace, Module, LabwareRender } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'

import {
  inferModuleOrientationFromXCoordinate,
  getModuleDef2,
} from '@opentrons/shared-data'
import {
  parseInitialLoadedLabwareBySlot,
  parseInitialLoadedLabwareByModuleId,
  parseInitialLoadedModulesBySlot,
} from '@opentrons/api-client'

import type { DeckSlot, ProtocolFile } from '@opentrons/shared-data'

interface DeckThumbnailProps {
  analysis: ProtocolFile<{}>
}

const deckSetupLayerBlocklist = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

export function DeckThumbnail(props: DeckThumbnailProps): JSX.Element {
  const deckDef = React.useMemo(() => getDeckDefinitions().ot2_standard, [])
  const { analysis } = props
  const initialLoadedLabwareBySlot = parseInitialLoadedLabwareBySlot(analysis)
  const initialLoadedModulesBySlot = parseInitialLoadedModulesBySlot(analysis)
  const initialLoadedLabwareByModuleId = parseInitialLoadedLabwareByModuleId(
    analysis
  )

  return (
    <RobotWorkSpace
      deckLayerBlocklist={deckSetupLayerBlocklist}
      deckDef={deckDef}
      viewBox="-80 -20 550 460"
    >
      {({ deckSlotsById }) =>
        map<DeckSlot>(deckSlotsById, (slot: DeckSlot, slotId: string) => {
          if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render anything in it

          const moduleInSlot =
            slotId in initialLoadedModulesBySlot
              ? initialLoadedModulesBySlot[slotId]
              : null
          const labwareInSlot =
            slotId in initialLoadedLabwareBySlot
              ? initialLoadedLabwareBySlot[slotId]
              : null
          const labwareInModule =
            slotId in initialLoadedLabwareByModuleId
              ? initialLoadedLabwareByModuleId[slotId]
              : null

          return (
            <React.Fragment key={slotId}>
              {['1', '3'].includes(slotId) &&
              <Module
                  x={slot.position[0]}
                  y={slot.position[1]}
                  orientation={inferModuleOrientationFromXCoordinate(
                    slot.position[0]
                  )}
                  def={getModuleDef2('temperatureModuleV2')}
                />
              }
            {['7'].includes(slotId) &&
              <Module
                  x={slot.position[0]}
                  y={slot.position[1]}
                  orientation={inferModuleOrientationFromXCoordinate(
                    slot.position[0]
                  )}
                  def={getModuleDef2('thermocyclerModuleV1')}
                />
              }
              {/* {moduleInSlot != null ? (
                <Module
                  x={slot.position[0]}
                  y={slot.position[1]}
                  orientation={inferModuleOrientationFromXCoordinate(
                    slot.position[0]
                  )}
                  def={getModuleDef2(
                    analysis.modules[moduleInSlot.result.moduleId].model
                  )}
                  innerProps={
                    analysis.modules[moduleInSlot.result.moduleId].model
                      ? { lidMotorState: 'open' }
                      : {}
                  }
                >
                  {labwareInModule != null ? (
                    <LabwareRender
                      definition={
                        analysis.labwareDefinitions[
                          analysis.labware[labwareInModule.result.labwareId]
                            .definitionId
                        ]
                      }
                    />
                  ) : null}
                </Module>
              ) : null} */}
              {labwareInSlot != null ? (
                <LabwareRender
                  definition={
                    analysis.labwareDefinitions[
                      analysis.labware[labwareInSlot.result.labwareId]
                        .definitionId
                    ]
                  }
                />
              ) : null}
            </React.Fragment>
          )
        })
      }
    </RobotWorkSpace>
  )
}

