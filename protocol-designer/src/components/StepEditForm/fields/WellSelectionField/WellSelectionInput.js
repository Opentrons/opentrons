// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { FormGroup, InputField } from '@opentrons/components'
import { i18n } from '../../../../localization'
import { WellSelectionModal } from './WellSelectionModal'
import { Portal } from '../../../portals/MainPageModalPortal'
import {
  actions as stepsActions,
  getSelectedStepId,
  getWellSelectionLabwareKey,
} from '../../../../ui/steps'
import styles from '../../StepEditForm.css'

import type { Dispatch } from 'redux'
import type { StepIdType } from '../../../../form-types'
import type { BaseState } from '../../../../types'
import type { FieldProps } from '../useSingleEditFieldProps'

type SP = {|
  stepId: ?StepIdType,
  wellSelectionLabwareKey: ?string,
|}

type DP = {|
  onOpen: string => mixed,
  onClose: () => mixed,
|}

type OP = {|
  ...FieldProps,
  primaryWellCount?: number,
  isMulti: ?boolean,
  pipetteId: ?string,
  labwareId: ?string,
|}

type Props = {| ...OP, ...SP, ...DP |}

class WellSelectionInputComponent extends React.Component<Props> {
  handleOpen = () => {
    const { labwareId, pipetteId, onFieldFocus } = this.props

    if (onFieldFocus) {
      onFieldFocus()
    }
    if (labwareId && pipetteId) {
      this.props.onOpen(this.getModalKey())
    }
  }

  handleClose = () => {
    const { onFieldBlur, onClose } = this.props
    if (onFieldBlur) {
      onFieldBlur()
    }
    onClose()
  }

  getModalKey = () => {
    const { name, pipetteId, labwareId, stepId } = this.props
    return `${String(stepId)}${name}${pipetteId || 'noPipette'}${
      labwareId || 'noLabware'
    }`
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
