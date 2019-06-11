// @flow
import React, { useMemo } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import some from 'lodash/some'
import map from 'lodash/map'
import { type DeckSlotId } from '@opentrons/shared-data'

import {
  RobotWorkSpace,
  Module as ModuleItem,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import { selectors as robotSelectors, type Labware } from '../../robot'

// import ConnectedSlotItem from './ConnectedSlotItem'
import LabwareItem from './LabwareItem'

// import styles from './styles.css'

type OP = {| ...ContextRouter |}

type SP = {|
  labwareBySlot: { [DeckSlotId]: Array<Labware> },
  modulesBySlot: { [DeckSlotId]: SessionModule },
  selectedSlot: DeckSlotId,
  areTipracksConfirmed: boolean,
|}

type Props = {| ...OP, ...SP |}

const deckSetupLayerBlacklist = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'screwHoles',
]

function DeckMap(props: Props) {
  const deckDef = useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  const {
    modulesBySlot,
    labwareBySlot,
    selectedSlot,
    areTipracksConfirmed,
  } = props
  return (
    <RobotWorkSpace
      deckLayerBlacklist={deckSetupLayerBlacklist}
      deckDef={deckDef}
      viewBox={`-46 -70 ${488} ${514}`} // TODO: put these in variables
    >
      {({ slots }) =>
        map(slots, (slot: $Values<typeof slots>, slotId) => {
          if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render anything in it
          const moduleInSlot = modulesBySlot[slotId]
          const labwareInSlot = labwareBySlot[slotId]

          return (
            <>
              {moduleInSlot && (
                <g
                  transform={`translate(${slot.position[0]}, ${
                    slot.position[1]
                  })`}
                >
                  <ModuleItem name={moduleInSlot.name} mode="default" />
                </g>
              )}
              {some(labwareInSlot) &&
                map(labwareInSlot, labware => (
                  <LabwareItem
                    x={slot.position[0]}
                    y={slot.position[1]}
                    labware={labware}
                    areTipracksConfirmed={areTipracksConfirmed}
                    highlighted={slotId === selectedSlot}
                  />
                ))}
            </>
          )
        })
      }
    </RobotWorkSpace>
  )
}

export { LabwareItem }
export type { LabwareItemProps } from './LabwareItem'

function mapStateToProps(state: State, ownProps: OP): SP {
  const {
    match: {
      params: { slot: selectedSlot },
    },
  } = ownProps
  const allLabware = robotSelectors.getLabware(state)
  const areTipracksConfirmed = robotSelectors.getTipracksConfirmed(state)

  const modulesBySlot = robotSelectors.getModulesBySlot(state)

  const labwareBySlot = allLabware.reduce(
    (acc, labware) => ({
      ...acc,
      [labware.slot]: [...(acc[labware.slot] || []), labware],
    }),
    {}
  )

  return {
    labwareBySlot,
    modulesBySlot,
    selectedSlot,
    areTipracksConfirmed,
  }
}

export default withRouter<WithRouterOP>(
  connect<Props, OP, SP, {||}, State, Dispatch>(mapStateToProps)(DeckMap)
)
