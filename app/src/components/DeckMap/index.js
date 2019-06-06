// @flow
import React, { useMemo } from 'react'
import { connect } from 'react-redux'

import { RobotWorkSpace, LabwareOnDeck } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

// import ConnectedSlotItem from './ConnectedSlotItem'
import LabwareItem from './LabwareItem'

// import styles from './styles.css'

type SP = {|
  _calibrator: Mount | null,
  _labware: $PropertyType<LabwareItemProps, 'labware'> | null,
  module: SessionModule | null,
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

function DeckMap() {
  const deckDef = useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  //  <Deck LabwareComponent={ConnectedSlotItem} className={styles.deck} />
  return (
    <RobotWorkSpace
      deckLayerBlacklist={deckSetupLayerBlacklist}
      deckDef={deckDef}
      viewBox={`-46 -70 ${488} ${514}`} // TODO: put these in variables
    >
      {({ slots, getRobotCoordsFromDOMCoords }) => (
        <>
          {map(containedLabware, labwareOnDeck => (
            <LabwareOnDeck
              key={labwareOnDeck.id}
              x={slots[labwareOnDeck.slot].position[0]}
              y={slots[labwareOnDeck.slot].position[1]}
              labwareOnDeck={labwareOnDeck}
            />
          ))}
        </>
      )}
    </RobotWorkSpace>
  )
}

export { LabwareItem }
export type { LabwareItemProps } from './LabwareItem'

function mapStateToProps(state: State, ownProps: OP): SP {
  const {
    slot,
    match: {
      params: { slot: selectedSlot },
    },
  } = ownProps
  const allLabware = robotSelectors.getLabware(state)
  const tipracksConfirmed = robotSelectors.getTipracksConfirmed(state)
  const labware = allLabware.find(lw => lw.slot === slot)
  const highlighted = slot === selectedSlot
  const module = robotSelectors.getModulesBySlot(state)[slot]

  const stateProps: SP = { _calibrator: null, _labware: null, module: null }

  if (labware) {
    const { isTiprack, confirmed, calibratorMount } = labware

    stateProps._calibrator =
      calibratorMount || robotSelectors.getCalibratorMount(state)

    stateProps._labware = {
      ...labware,
      highlighted,
      disabled: (isTiprack && confirmed) || (!isTiprack && !tipracksConfirmed),
      showName: highlighted || confirmed,
      showUnconfirmed: true,
      showSpinner: highlighted && labware.calibration === 'moving-to-slot',
      url: `/calibrate/labware/${slot}`,
    }
  }

  if (module) stateProps.module = module

  return stateProps
}

function mergeProps(stateProps: SP, dispatchProps: DP): Props {
  const { _labware, _calibrator } = stateProps
  const { dispatch } = dispatchProps
  const allProps: Props = stateProps

  if (_labware) {
    allProps.labware = {
      ..._labware,
      onClick: () => {
        if (_calibrator && (!_labware.isTiprack || !_labware.confirmed)) {
          dispatch(robotActions.moveTo(_calibrator, _labware.slot))
        }
      },
    }
  }

  return allProps
}

export default connect<Props, _, SP, {||}, State, Dispatch>(
  mapStateToProps,
  null,
  mergeProps
)(DeckMap)
