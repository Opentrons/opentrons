// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { HoverTooltip, FormGroup, InputField } from '@opentrons/components'
import i18n from '../../../../localization'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { getDisabledFields } from '../../../../steplist/formLevel'
import stepFormStyles from '../../StepEditForm.css'
import styles from './TipPositionInput.css'
import TipPositionModal from './TipPositionModal'
import { getIsTouchTipField } from '../../../../form-types'
import { getDefaultMmFromBottom } from './utils'
import type { BaseState } from '../../../../types'
import type { StepFieldName, TipOffsetFields } from '../../../../form-types'

function getLabwareFieldForPositioningField(
  fieldName: TipOffsetFields
): StepFieldName {
  const fieldMap: { [TipOffsetFields]: StepFieldName } = {
    aspirate_mmFromBottom: 'aspirate_labware',
    aspirate_touchTip_mmFromBottom: 'aspirate_labware',
    dispense_mmFromBottom: 'dispense_labware',
    dispense_touchTip_mmFromBottom: 'dispense_labware',
    mix_mmFromBottom: 'labware',
    mix_touchTip_mmFromBottom: 'labware',
  }
  return fieldMap[fieldName]
}

type OP = { fieldName: TipOffsetFields, className?: string }
type SP = {
  disabled: boolean,
  mmFromBottom: ?string,
  wellHeightMM: ?number,
}

type TipPositionInputState = { isModalOpen: boolean }
class TipPositionInput extends React.Component<OP & SP, TipPositionInputState> {
  state: TipPositionInputState = { isModalOpen: false }

  handleOpen = () => {
    if (this.props.wellHeightMM) {
      this.setState({ isModalOpen: true })
    }
  }
  handleClose = () => {
    this.setState({ isModalOpen: false })
  }

  render() {
    const { disabled, fieldName, mmFromBottom, wellHeightMM } = this.props
    const isTouchTipField = getIsTouchTipField(this.props.fieldName)

    const Wrapper = ({ children, hoverTooltipHandlers }) =>
      isTouchTipField ? (
        <div {...hoverTooltipHandlers}>{children}</div>
      ) : (
        <FormGroup
          label={i18n.t('form.step_edit_form.field.tip_position.label')}
          disabled={disabled}
          className={styles.well_order_input}
          hoverTooltipHandlers={hoverTooltipHandlers}
        >
          {children}
        </FormGroup>
      )

    let value = ''
    if (wellHeightMM != null) {
      // show default value for field in parens if no mmFromBottom value is selected
      value =
        mmFromBottom != null
          ? mmFromBottom
          : getDefaultMmFromBottom({ fieldName, wellHeightMM })
    }

    return (
      <HoverTooltip
        tooltipComponent={i18n.t('tooltip.step_fields.defaults.tipPosition')}
      >
        {hoverTooltipHandlers => (
          <Wrapper hoverTooltipHandlers={hoverTooltipHandlers}>
            <TipPositionModal
              fieldName={fieldName}
              closeModal={this.handleClose}
              wellHeightMM={wellHeightMM}
              mmFromBottom={mmFromBottom}
              isOpen={this.state.isModalOpen}
            />
            <InputField
              className={this.props.className || stepFormStyles.small_field}
              readOnly
              onClick={this.handleOpen}
              value={String(value)}
              units={i18n.t('application.units.millimeter')}
            />
          </Wrapper>
        )}
      </HoverTooltip>
    )
  }
}

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const rawForm = stepFormSelectors.getUnsavedForm(state)
  const { fieldName } = ownProps
  const labwareFieldName = getLabwareFieldForPositioningField(
    ownProps.fieldName
  )

  let wellHeightMM = null
  const labwareId: ?string = rawForm && rawForm[labwareFieldName]
  if (labwareId != null) {
    const labwareDef = stepFormSelectors.getHydratedLabwareEntities(state)[
      labwareId
    ].def

    // NOTE: only taking depth of first well in labware def, UI not currently equipped for multiple depths
    const firstWell = labwareDef.wells['A1']
    if (firstWell) wellHeightMM = firstWell.depth
  }

  return {
    disabled: rawForm ? getDisabledFields(rawForm).has(fieldName) : false,
    wellHeightMM,
    mmFromBottom: rawForm && rawForm[fieldName],
  }
}

export default connect(mapSTP)(TipPositionInput)
