// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import some from 'lodash/some'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import { type DeckSlotId } from '@opentrons/shared-data'
import type { ContextRouter } from 'react-router-dom'

import { RobotWorkSpace, Module as ModuleItem } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import type { State, Dispatch } from '../../types'
import {
  selectors as robotSelectors,
  type Labware,
  type SessionModule,
} from '../../robot'

import { getMissingModules } from '../../modules'

import { LabwareItem } from './LabwareItem'

export * from './LabwareItem'

type OP = {|
  ...ContextRouter,
  modulesRequired?: boolean,
  enableLabwareSelection?: boolean,
  className?: string,
|}

type DP = {| dispatch: Dispatch |}

type DisplayModule = {|
  ...$Exact<SessionModule>,
  mode?: $PropertyType<React.ElementProps<typeof ModuleItem>, 'mode'>,
|}

type SP = {|
  labwareBySlot?: { [DeckSlotId]: Array<Labware> },
  modulesBySlot?: {
    [DeckSlotId]: ?DisplayModule,
  },
  selectedSlot?: ?DeckSlotId,
  areTipracksConfirmed?: boolean,
|}

type Props = {| ...OP, ...SP, ...DP |}

const deckSetupLayerBlacklist = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

function DeckMapComponent(props: Props) {
  const deckDef = React.useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  const {
    modulesBySlot,
    labwareBySlot,
    selectedSlot,
    areTipracksConfirmed,
    className,
  } = props
  return (
    <RobotWorkSpace
      deckLayerBlacklist={deckSetupLayerBlacklist}
      deckDef={deckDef}
      viewBox={`-46 -10 ${488} ${390}`} // TODO: put these in variables
      className={className}
    >
      {({ deckSlotsById }) =>
        map(deckSlotsById, (slot: $Values<typeof deckSlotsById>, slotId) => {
          if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render anything in it
          const moduleInSlot = modulesBySlot && modulesBySlot[slotId]
          const allLabwareInSlot = labwareBySlot && labwareBySlot[slotId]

          return (
            <React.Fragment key={slotId}>
              {moduleInSlot && (
                <g
                  transform={`translate(${slot.position[0]}, ${
                    slot.position[1]
                  })`}
                >
                  <ModuleItem
                    model={moduleInSlot.model}
                    mode={moduleInSlot.mode || 'default'}
                  />
                </g>
              )}
              {some(allLabwareInSlot) &&
                map(allLabwareInSlot, labware => (
                  <LabwareItem
                    key={labware._id}
                    x={
                      slot.position[0] +
                      (labware.position ? labware.position[0] : 0)
                    }
                    y={
                      slot.position[1] +
                      (labware.position ? labware.position[1] : 0)
                    }
                    labware={labware}
                    areTipracksConfirmed={areTipracksConfirmed}
                    highlighted={selectedSlot ? slotId === selectedSlot : null}
                  />
                ))}
            </React.Fragment>
          )
        })
      }
    </RobotWorkSpace>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  let modulesBySlot = mapValues(
    robotSelectors.getModulesBySlot(state),
    module => ({ ...module, mode: 'default' })
  )

  // only show necessary modules if still need to connect some
  if (ownProps.modulesRequired === true) {
    const missingModules = getMissingModules(state)

    modulesBySlot = mapValues(
      robotSelectors.getModulesBySlot(state),
      module => {
        const present = !missingModules.some(mm => mm.model === module.model)
        return { ...module, mode: present ? 'present' : 'missing' }
      }
    )
    return {
      modulesBySlot,
    }
  } else {
    const allLabware = robotSelectors.getLabware(state)
    const labwareBySlot = allLabware.reduce((slotMap, labware) => {
      const { slot } = labware
      const slotContents = slotMap[slot] ?? []

      slotMap[slot] = [...slotContents, labware]
      return slotMap
    }, {})

    if (ownProps.enableLabwareSelection !== true) {
      return {
        labwareBySlot,
        modulesBySlot,
      }
    } else {
      const selectedSlot: ?DeckSlotId = ownProps.match.params.slot
      return {
        labwareBySlot,
        modulesBySlot,
        selectedSlot,
        areTipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
      }
    }
  }
}

export const DeckMap: React.AbstractComponent<
  $Diff<OP, ContextRouter>
> = withRouter(
  connect<Props, OP, SP, DP, State, Dispatch>(mapStateToProps)(DeckMapComponent)
)
