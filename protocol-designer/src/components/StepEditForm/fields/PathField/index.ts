import * as React from 'react'
import { connect } from 'react-redux'
import { Path } from './Path'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { getDisabledPathMap } from './getDisabledPathMap'
import { BaseState } from '../../../../types'
type Props = React.ComponentProps<typeof Path>
interface SP {
  disabledPathMap: Props['disabledPathMap']
}
type OP = Omit<Props, keyof SP>

function mapSTP(state: BaseState, ownProps: OP): SP {
  const {
    aspirate_airGap_checkbox,
    aspirate_airGap_volume,
    aspirate_wells,
    changeTip,
    dispense_wells,
    pipette,
    volume,
    tipRack,
  } = ownProps
  const pipetteEntities = stepFormSelectors.getPipetteEntities(state)
  const labwareEntities = stepFormSelectors.getLabwareEntities(state)
  const disabledPathMap = getDisabledPathMap(
    {
      aspirate_airGap_checkbox,
      aspirate_airGap_volume,
      aspirate_wells,
      changeTip,
      dispense_wells,
      pipette,
      volume,
      tipRack,
    },
    pipetteEntities,
    labwareEntities
  )
  return {
    disabledPathMap,
  }
}

export const PathField = connect(mapSTP, () => ({}))(Path)
