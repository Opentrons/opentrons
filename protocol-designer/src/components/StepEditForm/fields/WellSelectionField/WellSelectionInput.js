// @flow
import { FormGroup, InputField } from '@opentrons/components'
import * as React from 'react'
import { connect } from 'react-redux'
import type { Dispatch } from 'redux'

import type { StepFieldName, StepIdType } from '../../../../form-types'
import { i18n } from '../../../../localization'
import type { BaseState } from '../../../../types'
import {
  actions as stepsActions,
  getSelectedStepId,
  getWellSelectionLabwareKey,
} from '../../../../ui/steps'
import { Portal } from '../../../portals/MainPageModalPortal'
import styles from '../../StepEditForm.css'
import type { FocusHandlers } from '../../types'
import { WellSelectionModal } from './WellSelectionModal'

type SP = {|
  stepId: ?StepIdType,
  wellSelectionLabwareKey: ?string,
|}

type DP = {|
  onOpen: string => mixed,
  onClose: () => mixed,
|}

type OP = {|
  name: StepFieldName,
  primaryWellCount?: number,
  disabled: boolean,
  errorToShow: ?string,
  isMulti: ?boolean,
  pipetteId: ?string,
  labwareId: ?string,
  onFieldBlur: $PropertyType<FocusHandlers, 'onFieldBlur'>,
  onFieldFocus: $PropertyType<FocusHandlers, 'onFieldFocus'>,
|}

type Props = {| ...OP, ...SP, ...DP |}

class WellSelectionInputComponent extends React.Component<Props> {
  handleOpen = () => {
    const { labwareId, pipetteId, name } = this.props
    this.props.onFieldFocus(name)
    if (labwareId && pipetteId) {
      this.props.onOpen(this.getModalKey())
    }
  }

  handleClose = () => {
    this.props.onFieldBlur(this.props.name)
    this.props.onClose()
  }

  getModalKey = () => {
    const { name, pipetteId, labwareId, stepId } = this.props
    return `${String(stepId)}${name}${pipetteId || 'noPipette'}${labwareId ||
      'noLabware'}`
  }
  render() {
    const modalKey = this.getModalKey()
    const label = this.props.isMulti
      ? i18n.t('form.step_edit_form.wellSelectionLabel.columns')
      : i18n.t('form.step_edit_form.wellSelectionLabel.wells')
    return (
      <FormGroup
        label={label}
        disabled={this.props.disabled}
        className={styles.small_field}
      >
        <InputField
          readOnly
          name={this.props.name}
          value={
            this.props.primaryWellCount
              ? String(this.props.primaryWellCount)
              : null
          }
          onClick={this.handleOpen}
          error={this.props.errorToShow}
        />
        <Portal>
          <WellSelectionModal
            key={modalKey}
            pipetteId={this.props.pipetteId}
            labwareId={this.props.labwareId}
            isOpen={this.props.wellSelectionLabwareKey === modalKey}
            onCloseClick={this.handleClose}
            name={this.props.name}
          />
        </Portal>
      </FormGroup>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  stepId: getSelectedStepId(state),
  wellSelectionLabwareKey: getWellSelectionLabwareKey(state),
})
const mapDispatchToProps = (dispatch: Dispatch<*>): DP => ({
  onOpen: key => dispatch(stepsActions.setWellSelectionLabwareKey(key)),
  onClose: () => dispatch(stepsActions.clearWellSelectionLabwareKey()),
})

export const WellSelectionInput: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  DP,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(WellSelectionInputComponent)
