// @flow
import * as React from 'react'
import {
  AlertModal,
  FormGroup,
  InputField,
  RadioGroup
} from '@opentrons/components'
import {Portal} from '../../portals/MainPageModalPortal'
import modalStyles from '../../modals/modal.css'
import styles from './FlowRateField.css'

const DEFAULT_LABEL = 'FLOW RATE'

type Props = {
  /** When flow rate is falsey (including 0), it means 'use default' */
  defaultFlowRate: ?number,
  formFlowRate: ?number,
  flowRateType: 'aspirate' | 'dispense',
  label: ?string,
  minFlowRate: number,
  maxFlowRate: number,
  updateValue: (flowRate: ?number) => mixed,
  pipetteModelDisplayName: string
}

type State = {
  showModal: boolean,
  modalFlowRate: ?string,
  modalUseDefault: boolean
}

export default class FlowRateField extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = this.getStateFromProps(props)
  }

  getStateFromProps = (props: Props): State => {
    const {formFlowRate} = props
    return {
      showModal: false,
      modalFlowRate: formFlowRate ? formFlowRate.toString() : null,
      modalUseDefault: !formFlowRate
    }
  }

  cancelModal = () => {
    this.setState(this.getStateFromProps(this.props))
  }

  openModal = () => {
    this.setState({showModal: true})
  }

  saveModal = () => {
    const {modalUseDefault, modalFlowRate} = this.state

    const newFlowRate = modalUseDefault
      ? null
      : Number(modalFlowRate)

    this.setState({showModal: false})
    this.props.updateValue(newFlowRate)
  }

  handleChangeRadio = (e: SyntheticInputEvent<*>) => {
    this.setState({
      modalUseDefault: e.target.value !== 'custom'
    })
  }

  handleChangeNumber = (e: SyntheticInputEvent<*>) => {
    const value = e.target.value
    if (
      value === '' ||
      value === '.' ||
      !Number.isNaN(Number(value))
    ) {
      this.setState({
        modalFlowRate: value
      })
    }
  }

  render () {
    const {
      showModal,
      modalUseDefault
    } = this.state

    const {
      defaultFlowRate,
      formFlowRate,
      flowRateType,
      label,
      minFlowRate,
      maxFlowRate,
      pipetteModelDisplayName
    } = this.props

    const modalFlowRateNum = Number(this.state.modalFlowRate)
    const rangeDescription = `between ${minFlowRate} and ${maxFlowRate}`
    const outOfBounds = (
        modalFlowRateNum === 0 ||
        minFlowRate > modalFlowRateNum ||
        modalFlowRateNum > maxFlowRate
      )
    const allowSave = modalUseDefault || !outOfBounds

    const FlowRateInput = (
      <InputField
        value={`${this.state.modalFlowRate || ''}`}
        units='μL/s'
        caption={rangeDescription}
        error={allowSave ? null : rangeDescription}
        onChange={this.handleChangeNumber}
      />
    )

    const FlowRateModal = (
      <Portal>
        <AlertModal
          className={modalStyles.modal}
          buttons={[
            {children: 'Cancel', onClick: this.cancelModal},
            {children: 'Done', onClick: this.saveModal, disabled: !allowSave}
          ]}
        >
          <h3 className={styles.header}>Flow Rate</h3>

          <div className={styles.description}>
            {`Our default aspirate speed is optimal for a ${pipetteModelDisplayName}
            aspirating liquids with a viscosity similar to water`}
          </div>

          <div className={styles.flow_rate_type_label}>
            {`${flowRateType} speed:`}
          </div>

          <RadioGroup
            inline
            value={(modalUseDefault)
              ? 'default'
              : 'custom'
            }
            onChange={this.handleChangeRadio}
            options={[
              {name: `${defaultFlowRate || '?'} μL/s (default)`, value: 'default'},
              {name: 'Custom', value: 'custom', 'children': FlowRateInput}
            ]}
          />
        </AlertModal>
      </Portal>
    )

    return (
      <React.Fragment>
        <FormGroup label={label || DEFAULT_LABEL}>
          <InputField
            readOnly
            onClick={this.openModal}
            value={(formFlowRate) ? `${formFlowRate} μL/s` : 'Default'}
          />
        </FormGroup>

        {showModal && FlowRateModal}
      </React.Fragment>
    )
  }
}
