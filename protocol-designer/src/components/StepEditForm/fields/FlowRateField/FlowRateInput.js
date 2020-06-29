// @flow
import {
  AlertModal,
  FormGroup,
  InputField,
  RadioGroup,
} from '@opentrons/components'
import round from 'lodash/round'
import * as React from 'react'

import { i18n } from '../../../../localization'
import modalStyles from '../../../modals/modal.css'
import { Portal } from '../../../portals/MainPageModalPortal'
import stepFormStyles from '../../StepEditForm.css'
import styles from './FlowRateInput.css'

const DEFAULT_LABEL = 'Flow Rate'
const DECIMALS_ALLOWED = 1

type Props = {
  /** When flow rate is falsey (including 0), it means 'use default' */
  defaultFlowRate: ?number,
  disabled?: boolean,
  formFlowRate: ?number,
  flowRateType: 'aspirate' | 'dispense',
  label: ?string,
  minFlowRate: number,
  maxFlowRate: number,
  updateValue: (flowRate: ?number) => mixed,
  pipetteDisplayName: ?string,
  className?: string,
}

type State = {
  showModal: boolean,
  modalFlowRate: ?string,
  modalUseDefault: boolean,
  pristine: boolean,
}

export class FlowRateInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = this.getStateFromProps(props)
  }

  getStateFromProps: (props: Props) => State = props => {
    const { formFlowRate } = props
    return {
      showModal: false,
      modalFlowRate: formFlowRate ? formFlowRate.toString() : null,
      modalUseDefault: !formFlowRate,
      pristine: true,
    }
  }

  cancelModal: () => void = () => {
    this.setState(this.getStateFromProps(this.props))
  }

  openModal: () => void = () => {
    this.setState({ showModal: true })
  }

  makeSaveModal: (allowSave: boolean) => () => void = allowSave => () => {
    const { modalUseDefault, modalFlowRate } = this.state

    const newFlowRate = modalUseDefault ? null : Number(modalFlowRate)

    if (!allowSave) {
      this.setState({ pristine: false })
      return
    }

    this.setState({ showModal: false, pristine: false })
    this.props.updateValue(newFlowRate)
  }

  handleChangeRadio: (e: SyntheticInputEvent<>) => void = e => {
    this.setState({
      modalUseDefault: e.target.value !== 'custom',
    })
  }

  handleChangeNumber: (e: SyntheticInputEvent<>) => void = e => {
    const value = e.target.value
    if (value === '' || value === '.' || !Number.isNaN(Number(value))) {
      this.setState({
        modalFlowRate: value,
        modalUseDefault: false,
      })
    }
  }

  render(): React.Node {
    const { showModal, modalUseDefault, pristine } = this.state

    const {
      defaultFlowRate,
      disabled,
      formFlowRate,
      flowRateType,
      label,
      minFlowRate,
      maxFlowRate,
      pipetteDisplayName,
    } = this.props

    const modalFlowRateNum = Number(this.state.modalFlowRate)

    // show 0.1 not 0 as minimum, since bottom of range is non-inclusive
    const displayMinFlowRate = minFlowRate || Math.pow(10, -DECIMALS_ALLOWED)
    const rangeDescription = `between ${displayMinFlowRate} and ${maxFlowRate}`
    const outOfBounds =
      modalFlowRateNum === 0 ||
      minFlowRate > modalFlowRateNum ||
      modalFlowRateNum > maxFlowRate
    const correctDecimals =
      round(modalFlowRateNum, DECIMALS_ALLOWED) === modalFlowRateNum
    const allowSave = modalUseDefault || (!outOfBounds && correctDecimals)

    let errorMessage = null
    // validation only happens when "Custom" is selected, not "Default"
    // and pristinity only masks the outOfBounds error, not the correctDecimals error
    if (!modalUseDefault) {
      if (!Number.isNaN(modalFlowRateNum) && !correctDecimals) {
        errorMessage = `a max of ${DECIMALS_ALLOWED} decimal place${
          DECIMALS_ALLOWED > 1 ? 's' : ''
        } is allowed`
      } else if (!pristine && outOfBounds) {
        errorMessage = `accepted range is ${displayMinFlowRate} to ${maxFlowRate}`
      }
    }

    const FlowRateInput = (
      <InputField
        value={`${this.state.modalFlowRate || ''}`}
        units={i18n.t('application.units.microliterPerSec')}
        caption={rangeDescription}
        error={errorMessage}
        onChange={this.handleChangeNumber}
      />
    )

    const FlowRateModal = pipetteDisplayName && (
      <Portal>
        <AlertModal
          className={modalStyles.modal}
          buttons={[
            {
              children: 'Cancel',
              onClick: this.cancelModal,
            },
            {
              children: 'Done',
              onClick: this.makeSaveModal(allowSave),
              disabled: pristine ? false : !allowSave,
            },
          ]}
        >
          <h3 className={styles.header}>Flow Rate</h3>

          <div className={styles.description}>
            {`Our default aspirate speed is optimal for a ${pipetteDisplayName}
            aspirating liquids with a viscosity similar to water`}
          </div>

          <div className={styles.flow_rate_type_label}>
            {`${flowRateType} speed`}
          </div>

          <RadioGroup
            inline
            value={modalUseDefault ? 'default' : 'custom'}
            onChange={this.handleChangeRadio}
            options={[
              {
                name: `${defaultFlowRate || '?'} ${i18n.t(
                  'application.units.microliterPerSec'
                )} (default)`,
                value: 'default',
              },
              { name: 'Custom', value: 'custom', children: FlowRateInput },
            ]}
          />
        </AlertModal>
      </Portal>
    )

    return (
      <React.Fragment>
        <FormGroup label={label || DEFAULT_LABEL} disabled={disabled}>
          <InputField
            units="μL/s"
            readOnly
            disabled={disabled}
            onClick={this.openModal}
            className={this.props.className || stepFormStyles.small_field}
            value={formFlowRate ? `${formFlowRate}` : 'default'}
          />
        </FormGroup>

        {showModal && FlowRateModal}
      </React.Fragment>
    )
  }
}
