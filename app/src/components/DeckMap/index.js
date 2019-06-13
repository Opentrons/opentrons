// @flow
import React, { useMemo } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import some from 'lodash/some'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import countBy from 'lodash/countBy'
import { type DeckSlotId } from '@opentrons/shared-data'

import {
  RobotWorkSpace,
  Module as ModuleItem,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import { selectors as robotSelectors, type Labware } from '../../robot'

import { getModulesState } from '../../robot-api'
import { getConnectedRobot } from '../../discovery'

// import ConnectedSlotItem from './ConnectedSlotItem'
import LabwareItem from './LabwareItem'

// import styles from './styles.css'

type OP = {|
  ...ContextRouter,
  modulesRequired: boolean,
  enableLabwareSelection: boolean,
|}

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
      viewBox={`-46 -10 ${488} ${390}`} // TODO: put these in variables
    >
      {({ slots }) =>
        map(slots, (slot: $Values<typeof slots>, slotId) => {
          if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render anything in it
          const moduleInSlot = modulesBySlot && modulesBySlot[slotId]
          const labwareInSlot = labwareBySlot && labwareBySlot[slotId]

          return (
            <>
              {moduleInSlot && (
                <g
                  transform={`translate(${slot.position[0]}, ${
                    slot.position[1]
                  })`}
                >
                  <ModuleItem
                    name={moduleInSlot.name}
                    mode={moduleInSlot.displayMode}
                  />
                </g>
              )}
              {some(labwareInSlot) &&
                map(labwareInSlot, labware => (
                  <LabwareItem
                    key={labware._id}
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

// TODO: IMMEDIATELY when you re in the review deck "modal" no labware is disable

export { LabwareItem }
export type { LabwareItemProps } from './LabwareItem'

function mapStateToProps(state: State, ownProps: OP): SP {
  let modulesBySlot = robotSelectors.getModulesBySlot(state)

  // only show necessary modules if still need to connect some
  if (ownProps.modulesRequired) {
    const robot = getConnectedRobot(state)
    const sessionModules = robotSelectors.getModules(state)
    const actualModules = robot ? getModulesState(state, robot.name) : []

    const requiredNames = countBy(sessionModules, 'name')
    const actualNames = countBy(actualModules, 'name')

    modulesBySlot = mapValues(
      robotSelectors.getModulesBySlot(state),
      module => {
        const present =
          !module || requiredNames[module.name] === actualNames[module.name]
        return {
          ...module,
          displayMode: present ? 'present' : 'missing',
        }
      }
    )
    return {
      modulesBySlot,
    }
  } else {
    const allLabware = robotSelectors.getLabware(state)
    const labwareBySlot = allLabware.reduce(
      (acc, labware) => ({
        ...acc,
        [labware.slot]: [...(acc[labware.slot] || []), labware],
      }),
      {}
    )
    if (!ownProps.enableLabwareSelection) {
      return {
        labwareBySlot,
        modulesBySlot,
      }
    } else {
      return {
        labwareBySlot,
        modulesBySlot,
        selectedSlot: ownProps.match.params.slot,
        areTipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
      }
    }
  }
}

//   <ModuleItem
//     name={props.module.name}
//     mode={props.present ? 'present' : 'missing'}
//   />
// )
// }

// function mapStateToProps(state: State, ownProps: OP): SP {
//   // TODO(mc, 2018-07-23): this logic is duplicated because can only get props
//   // into Deck.props.LabwareComponent via redux
//   const robot = getConnectedRobot(state)
//   const module = robotSelectors.getModulesBySlot(state)[ownProps.slot]
//   const sessionModules = robotSelectors.getModules(state)
//   const actualModules = robot ? getModulesState(state, robot.name) : []

//   const requiredNames = countBy(sessionModules, 'name')
//   const actualNames = countBy(actualModules, 'name')
//   const present =
//     !module || requiredNames[module.name] === actualNames[module.name]

//   return { present, module }
// }

export default withRouter<WithRouterOP>(
  connect<Props, OP, SP, {||}, State, Dispatch>(mapStateToProps)(DeckMap)
)
