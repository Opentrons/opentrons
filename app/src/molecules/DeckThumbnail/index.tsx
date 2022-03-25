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
              {moduleInSlot != null ? (
                <Module
                  x={slot.position[0]}
                  y={slot.position[1]}
                  orientation={inferModuleOrientationFromXCoordinate(
                    slot.position[0]
                  )}
                  def={getModuleDef2(moduleInSlot.params.model)}
                  innerProps={
                    moduleInSlot.params.model ? { lidMotorState: 'open' } : {}
                  }
                >
                  {labwareInModule != null ? (
                    <LabwareRender
                      definition={labwareInModule.result.definition}
                    />
                  ) : null}
                </Module>
              ) : null}
              {labwareInSlot != null ? (
                <g
                  transform={`translate(${slot.position[0]},${slot.position[1]})`}
                >
                  <LabwareRender definition={labwareInSlot.result.definition} />
                </g>
              ) : null}
            </React.Fragment>
          )
        })
      }
    </RobotWorkSpace>
  )
}
