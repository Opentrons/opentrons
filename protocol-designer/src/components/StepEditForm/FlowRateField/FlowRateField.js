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

type Props = {
  /** When flow rate is falsey (including 0), it means 'use default' */
  flowRate: ?number,
  flowRateType: 'aspirate' | 'dispense',
  defaultFlowRate: ?number,
  minFlowRate: ?number,
  maxFlowRate: ?number,
  updateValue: (flowRate: ?number) => mixed,
  pipetteModelDisplayName: string
}

type State = {
  showModal: boolean,
  modalFlowRate: ?number,
  modalUseDefault: boolean
}

export default class FlowRateField extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      showModal: false,
      modalFlowRate: props.flowRate,
      modalUseDefault: Boolean(props.flowRate)
    }
  }

  openModal = () => {
    this.setState({showModal: true})
  }

  cancelModal = () => {
    this.setState({
      showModal: false,
      modalFlowRate: this.props.flowRate
    })
  }

  saveModal = () => {
    const {modalUseDefault, modalFlowRate} = this.state

    const newFlowRate = modalUseDefault
      ? null
      : modalFlowRate

    this.props.updateValue(newFlowRate)
    this.setState({showModal: false})
  }

  handleChangeRadio = (e: SyntheticInputEvent<*>) => {
    this.setState({
      modalUseDefault: e.target.value !== 'custom'
    })
  }

  handleChangeNumber = (e: SyntheticInputEvent<*>) => {
    this.setState({
      modalFlowRate: Number(e.target.value),
      modalUseDefault: false
    })
  }

  render () {
    const {
      showModal,
      modalFlowRate,
      modalUseDefault
    } = this.state

    const {
      flowRate,
      flowRateType,
      defaultFlowRate,
      minFlowRate,
      maxFlowRate,
      pipetteModelDisplayName
    } = this.props

    const rangeDescription = `between ${minFlowRate || '?'} and ${maxFlowRate || '?'}`
    const outOfBounds = (minFlowRate && maxFlowRate && modalFlowRate)
      ? (
        minFlowRate > modalFlowRate ||
        modalFlowRate > maxFlowRate
      )
      : false

    const FlowRateInput = (
      <InputField
        numeric
        value={`${modalFlowRate || ''}`}
        units='μL/s'
        caption={rangeDescription}
        error={outOfBounds ? rangeDescription : null}
        onChange={this.handleChangeNumber}
      />
    )

    const FlowRateModal = (
      <Portal>
        <AlertModal
          className={modalStyles.modal}
          buttons={[
            {children: 'Cancel', onClick: this.cancelModal},
            {children: 'Done', onClick: this.saveModal}
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
            value={(modalUseDefault || !modalFlowRate)
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
        <FormGroup label='FLOW RATE'>
          <InputField
            readOnly
            onClick={this.openModal}
            value={(flowRate) ? `${flowRate} μL/s` : 'Default'}
          />
        </FormGroup>

        {showModal && FlowRateModal}
      </React.Fragment>
    )
  }
}
