// @flow
import * as React from 'react'
import cx from 'classnames'
import { i18n } from '../../../../localization'
import { Portal } from '../../../portals/MainPageModalPortal'
import {
  Modal,
  OutlineButton,
  PrimaryButton,
  FormGroup,
  DropdownField,
} from '@opentrons/components'
import modalStyles from '../../../modals/modal.css'
import type { WellOrderOption } from '../../../../form-types'

import { WellOrderViz } from './WellOrderViz'
import styles from './WellOrderInput.css'
import stepEditStyles from '../../StepEditForm.css'

const DEFAULT_FIRST: WellOrderOption = 't2b'
const DEFAULT_SECOND: WellOrderOption = 'l2r'
const VERTICAL_VALUES: Array<WellOrderOption> = ['t2b', 'b2t']
const HORIZONTAL_VALUES: Array<WellOrderOption> = ['l2r', 'r2l']
const WELL_ORDER_VALUES: Array<WellOrderOption> = [
  ...VERTICAL_VALUES,
  ...HORIZONTAL_VALUES,
]
type Props = {
  isOpen: boolean,
  closeModal: () => mixed,
  prefix: 'aspirate' | 'dispense' | 'mix',
  firstValue: ?WellOrderOption,
  secondValue: ?WellOrderOption,
  firstName: string,
  secondName: string,
  updateValues: (
    firstValue: ?WellOrderOption,
    secondValue: ?WellOrderOption
  ) => void,
}

type State = {
  firstValue: WellOrderOption,
  secondValue: WellOrderOption,
}

export const ResetButton = (props: { onClick: () => void }): React.Node => (
  <OutlineButton className={modalStyles.button_medium} onClick={props.onClick}>
    {i18n.t('button.reset')}
  </OutlineButton>
)

export const CancelButton = (props: { onClick: () => void }): React.Node => (
  <PrimaryButton
    className={cx(modalStyles.button_medium, modalStyles.button_right_of_break)}
    onClick={props.onClick}
  >
    {i18n.t('button.cancel')}
  </PrimaryButton>
)

export const DoneButton = (props: { onClick: () => void }): React.Node => (
  <PrimaryButton className={modalStyles.button_medium} onClick={props.onClick}>
    {i18n.t('button.done')}
  </PrimaryButton>
)

export class WellOrderModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const {
      initialFirstValue,
      initialSecondValue,
    } = this.getInitialFirstValues()
    this.state = {
      firstValue: initialFirstValue,
      secondValue: initialSecondValue,
    }
  }

  getInitialFirstValues: () => {
    initialFirstValue: WellOrderOption,
    initialSecondValue: WellOrderOption,
  } = () => {
    const { firstValue, secondValue } = this.props
    if (firstValue == null || secondValue == null) {
      return {
        initialFirstValue: DEFAULT_FIRST,
        initialSecondValue: DEFAULT_SECOND,
      }
    }
    return {
      initialFirstValue: firstValue,
      initialSecondValue: secondValue,
    }
  }

  applyChanges: () => void = () => {
    this.props.updateValues(this.state.firstValue, this.state.secondValue)
  }

  handleReset: () => void = () => {
    this.setState(
      { firstValue: DEFAULT_FIRST, secondValue: DEFAULT_SECOND },
      this.applyChanges
    )
    this.props.closeModal()
  }

  handleCancel: () => void = () => {
    const {
      initialFirstValue,
      initialSecondValue,
    } = this.getInitialFirstValues()
    this.setState({
      firstValue: initialFirstValue,
      secondValue: initialSecondValue,
    })
    this.props.closeModal()
  }

  handleDone: () => void = () => {
    this.applyChanges()
    this.props.closeModal()
  }

  makeOnChange: (
    ordinality: 'first' | 'second'
  ) => (
    event: SyntheticEvent<HTMLSelectElement>
  ) => void = ordinality => event => {
    const { value } = event.currentTarget
    let nextState = { [`${ordinality}Value`]: value }
    if (ordinality === 'first') {
      if (
        VERTICAL_VALUES.includes(value) &&
        VERTICAL_VALUES.includes(this.state.secondValue)
      ) {
        nextState = { ...nextState, secondValue: HORIZONTAL_VALUES[0] }
      } else if (
        HORIZONTAL_VALUES.includes(value) &&
        HORIZONTAL_VALUES.includes(this.state.secondValue)
      ) {
        nextState = { ...nextState, secondValue: VERTICAL_VALUES[0] }
      }
    }
    this.setState(nextState)
  }

  isSecondOptionDisabled: WellOrderOption => boolean = (
    value: WellOrderOption
  ) => {
    if (VERTICAL_VALUES.includes(this.state.firstValue)) {
      return VERTICAL_VALUES.includes(value)
    } else if (HORIZONTAL_VALUES.includes(this.state.firstValue)) {
      return HORIZONTAL_VALUES.includes(value)
    } else {
      return false
    }
  }

  render(): React.Node {
    if (!this.props.isOpen) return null

    const { firstValue, secondValue } = this.state
    const { firstName, secondName } = this.props

    return (
      <Portal>
        <Modal
          className={modalStyles.modal}
          contentsClassName={cx(modalStyles.modal_contents)}
          onCloseClick={this.handleCancel}
        >
          <div className={styles.modal_header}>
            <h4>{i18n.t('modal.well_order.title')}</h4>
            <p>{i18n.t('modal.well_order.body')}</p>
          </div>
          <div className={styles.main_row}>
            <FormGroup label={i18n.t('modal.well_order.field_label')}>
              <div className={styles.field_row}>
                <DropdownField
                  name={firstName}
                  value={firstValue}
                  className={cx(
                    stepEditStyles.field,
                    styles.well_order_dropdown
                  )}
                  onChange={this.makeOnChange('first')}
                  options={WELL_ORDER_VALUES.map(value => ({
                    value,
                    name: i18n.t(
                      `form.step_edit_form.field.well_order.option.${value}`
                    ),
                  }))}
                />
                <span className={styles.field_spacer}>
                  {i18n.t('modal.well_order.then')}
                </span>
                <DropdownField
                  name={secondName}
                  value={secondValue}
                  className={cx(
                    stepEditStyles.field,
                    styles.well_order_dropdown
                  )}
                  onChange={this.makeOnChange('second')}
                  options={WELL_ORDER_VALUES.map(value => ({
                    value,
                    name: i18n.t(
                      `form.step_edit_form.field.well_order.option.${value}`
                    ),
                    disabled: this.isSecondOptionDisabled(value),
                  }))}
                />
              </div>
            </FormGroup>
            <FormGroup label={i18n.t('modal.well_order.viz_label')}>
              <WellOrderViz firstValue={firstValue} secondValue={secondValue} />
            </FormGroup>
          </div>
          <div className={modalStyles.button_row_divided}>
            <ResetButton onClick={this.handleReset} />
            <div>
              <CancelButton onClick={this.handleCancel} />
              <DoneButton onClick={this.handleDone} />
            </div>
          </div>
        </Modal>
      </Portal>
    )
  }
}
