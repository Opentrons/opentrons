// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {HoverTooltip, FormGroup, InputField} from '@opentrons/components'
import { getLabware } from '@opentrons/shared-data'
import {selectors as labwareIngredsSelectors} from '../../../labware-ingred/reducers'
import i18n from '../../../localization'
import {selectors} from '../../../steplist'
import stepFormStyles from '../StepEditForm.css'
import styles from './TipPositionInput.css'
import TipPositionModal from './TipPositionModal'
import {getIsTouchTipField} from '../../../form-types'
import {getDefaultMmFromBottom} from './utils'
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
    const {fieldName, mmFromBottom, wellHeightMM} = this.props
    const disabled = !this.props.wellHeightMM
    const isTouchTipField = getIsTouchTipField(this.props.fieldName)

    const Wrapper = ({children, hoverTooltipHandlers}) => isTouchTipField
      ? <React.Fragment>{children}</React.Fragment>
      : <FormGroup
        label={i18n.t('form.step_edit_form.field.tip_position.label')}
        disabled={disabled}
        className={styles.well_order_input}
        hoverTooltipHandlers={hoverTooltipHandlers}>
        {children}
      </FormGroup>

    let value = ''
    if (wellHeightMM != null) {
      // show default value for field in parens if no mmFromBottom value is selected
      value = (mmFromBottom != null)
        ? mmFromBottom
        : `Default (${getDefaultMmFromBottom({fieldName, wellHeightMM})})`
    }

    return (
      <HoverTooltip
        tooltipComponent={i18n.t('tooltip.step_fields.defaults.tipPosition')}
      >{(hoverTooltipHandlers) => (
          <Wrapper hoverTooltipHandlers={hoverTooltipHandlers}>
            <TipPositionModal
              fieldName={fieldName}
              closeModal={this.handleClose}
              wellHeightMM={wellHeightMM}
              mmFromBottom={mmFromBottom}
              isOpen={this.state.isModalOpen} />
            <InputField
              className={isTouchTipField
                ? stepFormStyles.full_width
                : undefined} // TODO Ian 2018-11-16 change InputField props.className to be `?string` so this can be `null` not `undefined`?
              readOnly
              onClick={this.handleOpen}
              value={value}
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
    const labwareById = labwareIngredsSelectors.getLabwareById(state)
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
