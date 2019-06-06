// @flow
import React, { useMemo } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import some from 'lodash/some'
import map from 'lodash/map'
import { type DeckSlotId } from '@opentrons/shared-data'

import { RobotWorkSpace, LabwareRender } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

// import ConnectedSlotItem from './ConnectedSlotItem'
import LabwareItem from './LabwareItem'

// import styles from './styles.css'
type DeckSlotSessionItem =
  | $PropertyType<LabwareItemProps, 'labware'>
  | SessionModule

type OP = {| ...ContextRouter |}

type SP = {|
  calibrator: Mount | null,
  itemsBySlot: { [DeckSlotId]: Array<DeckSlotSessionItem> },
  selectedSlot: DeckSlotId,
  areTipracksConfirmed: boolean,
|}

type DP = {| dispatch: Dispatch |}

type Props = {
  ...SP,
  labware?: $PropertyType<LabwareItemProps, 'labware'>,
  module?: SessionModule,
}

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
  //  <Deck LabwareComponent={ConnectedSlotItem} className={styles.deck} />
  return (
    <RobotWorkSpace
      deckLayerBlacklist={deckSetupLayerBlacklist}
      deckDef={deckDef}
      viewBox={`-46 -70 ${488} ${514}`} // TODO: put these in variables
    >
      {({ slots }) =>
        map(slots, (slot: $Values<typeof slots>, slotId) => {
          if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render labware or overlays
          const itemsInSlot = props.itemsBySlot[slot]
          if (some()) {
            return (
              <React.Fragment key={slot.id}>
                {map(itemsInSlot, slotItem => (
                  <DeckSlotItem
                    item={slotItem}
                    x={slots[labwareOnDeck.slot].position[0]}
                    y={slots[labwareOnDeck.slot].position[1]}
                  />
                ))}
              </React.Fragment>
            )
          }
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

  const itemsBySlot = allLabware.reduce((acc, labware) => {
    let itemsInSlot = [...acc[labware.slot], labware]
    const moduleInSlot = modulesBySlot[labware.slot]
    if (moduleInSlot) itemsInSlot = [moduleInSlot, ...itemsInSlot]

    return {
      ...acc,
      [labware.slot]: itemsInSlot,
    }
  }, {})

  return {
    _calibrator: robotSelectors.getCalibratorMount(state),
    itemsBySlot,
    selectedSlot,
    areTipracksConfirmed,
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  // if (_calibrator && (!_labware.isTiprack || !_labware.confirmed)) {
  return {
    moveToSlot: (calibrator, slot) =>
      dispatch(robotActions.moveTo(calibrator, slot)),
  }
}

export default withRouter<WithRouterOP>(
  connect<Props, OP, SP, {||}, State, Dispatch>(
    mapStateToProps,
    mapDispatchToProps
  )(DeckMap)
)
