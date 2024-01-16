import * as React from 'react'
import { Dispatch } from 'redux'
import { useTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import { COLUMN } from '@opentrons/shared-data'
import { FormGroup, InputField } from '@opentrons/components'
import { Portal } from '../../../portals/MainPageModalPortal'
import {
  actions as stepsActions,
  getSelectedStepId,
  getWellSelectionLabwareKey,
} from '../../../../ui/steps'
import { WellSelectionModal } from './WellSelectionModal'
import styles from '../../StepEditForm.css'

import type { StepIdType } from '../../../../form-types'
import type { BaseState, NozzleType } from '../../../../types'
import type { FieldProps } from '../../types'

export interface SP {
  t: any
  stepId?: StepIdType | null
  wellSelectionLabwareKey?: string | null
}

export interface DP {
  onOpen: (val: string) => unknown
  onClose: () => unknown
}

export type OP = FieldProps & {
  primaryWellCount?: number
  nozzleType?: NozzleType | null
  pipetteId?: string | null
  labwareId?: string | null
}

export type Props = OP & SP & DP

export class WellSelectionInputComponent extends React.Component<Props> {
  handleOpen = (): void => {
    const { labwareId, pipetteId, onFieldFocus } = this.props

    if (onFieldFocus) {
      onFieldFocus()
    }
    if (labwareId && pipetteId) {
      this.props.onOpen(this.getModalKey())
    }
  }

  handleClose = (): void => {
    const { onFieldBlur, onClose } = this.props
    if (onFieldBlur) {
      onFieldBlur()
    }
    onClose()
  }

  getModalKey = (): string => {
    const { name, pipetteId, labwareId, stepId } = this.props
    return `${String(stepId)}${name}${pipetteId || 'noPipette'}${
      labwareId || 'noLabware'
    }`
  }

  render(): JSX.Element {
    const modalKey = this.getModalKey()
    const label =
      this.props.nozzleType === '8-channel' || this.props.nozzleType === COLUMN
        ? this.props.t('step_edit_form.wellSelectionLabel.columns')
        : this.props.t('step_edit_form.wellSelectionLabel.wells')
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
            isOpen={this.props.wellSelectionLabwareKey === modalKey}
            key={modalKey}
            labwareId={this.props.labwareId}
            name={this.props.name}
            onCloseClick={this.handleClose}
            pipetteId={this.props.pipetteId}
            updateValue={this.props.updateValue}
            value={this.props.value}
            nozzleType={this.props.nozzleType}
          />
        </Portal>
      </FormGroup>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => {
  const { t } = useTranslation('form')
  return {
    stepId: getSelectedStepId(state),
    wellSelectionLabwareKey: getWellSelectionLabwareKey(state),
    t: t,
  }
}
const mapDispatchToProps = (dispatch: Dispatch): DP => ({
  onOpen: key => dispatch(stepsActions.setWellSelectionLabwareKey(key)),
  onClose: () => dispatch(stepsActions.clearWellSelectionLabwareKey()),
})

export const WellSelectionInput = connect(
  mapStateToProps,
  mapDispatchToProps
)(WellSelectionInputComponent)
