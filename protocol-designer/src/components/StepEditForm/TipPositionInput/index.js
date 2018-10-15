// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {HoverTooltip, FormGroup, InputField} from '@opentrons/components'
import { getLabware } from '@opentrons/shared-data'
import {selectors as labwareIngredsSelectors} from '../../../labware-ingred/reducers'
import i18n from '../../../localization'
import {selectors} from '../../../steplist'
import styles from './TipPositionInput.css'
import TipPositionModal from './TipPositionModal'
import type {BaseState} from '../../../types'

type OP = {prefix?: 'aspirate' | 'dispense'}
type SP = {
  mmFromBottom: ?string,
  wellHeightMM: ?number,
}

type TipPositionInputState = {isModalOpen: boolean}
class TipPositionInput extends React.Component<OP & SP, TipPositionInputState> {
  state: TipPositionInputState = {isModalOpen: false}

  handleOpen = () => {
    if (this.props.wellHeightMM) {
      this.setState({isModalOpen: true})
    }
  }
  handleClose = () => { this.setState({isModalOpen: false}) }

  render () {
    return (
      <HoverTooltip
        tooltipComponent={i18n.t('tooltip.step_fields.defaults.tipPosition')}
      >{(hoverTooltipHandlers) => (
        <FormGroup
          label={i18n.t('form.step_edit_form.field.tip_position.label')}
          disabled={!this.props.wellHeightMM}
          className={styles.well_order_input}
          hoverTooltipHandlers={hoverTooltipHandlers}
        >
          <TipPositionModal
            prefix={this.props.prefix}
            closeModal={this.handleClose}
            wellHeightMM={this.props.wellHeightMM}
            mmFromBottom={this.props.mmFromBottom}
            isOpen={this.state.isModalOpen} />
            <InputField
              readOnly
              onClick={this.handleOpen}
              value={this.props.wellHeightMM ? this.props.mmFromBottom : null}
              units="mm" />
        </FormGroup>
      )}
    </HoverTooltip>
    )
  }
}
const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  // NOTE: not interpolating prefix because breaks flow string enum
  let fieldName = 'mmFromBottom'
  if (ownProps.prefix === 'aspirate') fieldName = 'aspirate_mmFromBottom'
  else if (ownProps.prefix === 'dispense') fieldName = 'dispense_mmFromBottom'

  let labwareFieldName = 'labware'
  if (ownProps.prefix === 'aspirate') labwareFieldName = 'aspirate_labware'
  else if (ownProps.prefix === 'dispense') labwareFieldName = 'dispense_labware'

  let wellHeightMM = null
  if (formData && formData[labwareFieldName]) {
    const labwareById = labwareIngredsSelectors.getLabware(state)
    const labware = labwareById[formData[labwareFieldName]]
    const labwareDef = labware && labware.type && getLabware(labware.type)
    if (labwareDef) {
      // NOTE: only taking depth of first well in labware def, UI not currently equipped for multiple depths
      const firstWell = labwareDef.wells['A1']
      if (firstWell) wellHeightMM = firstWell.depth
    } else {
      console.warn('the specified source labware definition could not be located')
    }
  }
  return {
    wellHeightMM,
    mmFromBottom: formData && formData[fieldName],
  }
}

export default connect(mapSTP)(TipPositionInput)
