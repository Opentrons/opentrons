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
import {getIsTouchTipField} from '../../../form-types'
import type {BaseState} from '../../../types'
import type {StepFieldName, TipOffsetFields} from '../../../form-types'

function getLabwareFieldForPositioningField (fieldName: TipOffsetFields): StepFieldName {
  const fieldMap: {[TipOffsetFields]: StepFieldName} = {
    aspirate_mmFromBottom: 'aspirate_labware',
    aspirate_touchTipMmFromBottom: 'aspirate_labware',
    dispense_mmFromBottom: 'dispense_labware',
    dispense_touchTipMmFromBottom: 'dispense_labware',
    mix_mmFromBottom: 'labware',
    mix_touchTipMmFromBottom: 'labware',
  }
  return fieldMap[fieldName]
}

type OP = {fieldName: TipOffsetFields}
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
    const Wrapper = ({children, hoverTooltipHandlers}) =>
      getIsTouchTipField(this.props.fieldName)
        ? <div>{children}</div>
        : <FormGroup
          label={i18n.t('form.step_edit_form.field.tip_position.label')}
          disabled={!this.props.wellHeightMM}
          className={styles.well_order_input}
          hoverTooltipHandlers={hoverTooltipHandlers}>
          {children}
        </FormGroup>

    return (
      <HoverTooltip
        tooltipComponent={i18n.t('tooltip.step_fields.defaults.tipPosition')}
      >{(hoverTooltipHandlers) => (
          <Wrapper hoverTooltipHandlers={hoverTooltipHandlers}>
            <TipPositionModal
              fieldName={this.props.fieldName}
              closeModal={this.handleClose}
              wellHeightMM={this.props.wellHeightMM}
              mmFromBottom={this.props.mmFromBottom}
              isOpen={this.state.isModalOpen} />
            <InputField
              readOnly
              onClick={this.handleOpen}
              value={this.props.wellHeightMM ? this.props.mmFromBottom : null}
              units="mm" />
          </Wrapper>
        )}
      </HoverTooltip>
    )
  }
}

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  const {fieldName} = ownProps
  const labwareFieldName = getLabwareFieldForPositioningField(ownProps.fieldName)

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
