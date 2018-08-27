// @flow
import * as React from 'react'
import cx from 'classnames'
import {connect} from 'react-redux'

import i18n from '../../../localization'
import {Portal} from '../../portals/MainPageModalPortal'
import {
  Modal,
  OutlineButton,
  PrimaryButton,
  FormGroup,
  DropdownField
} from '@opentrons/components'
import modalStyles from '../../modals/modal.css'
import {actions, selectors} from '../../../steplist'
import type {BaseState} from '../../../types'
import WellOrderViz from './WellOrderViz'
import type {WellOrderOption} from './types'

import styles from './WellOrderInput.css'

const DEFAULT_FIRST: WellOrderOption = 't2b'
const DEFAULT_SECOND: WellOrderOption = 'l2r'
const VERTICAL_VALUES: Array<WellOrderOption> = ['t2b', 'b2t']
const HORIZONTAL_VALUES: Array<WellOrderOption> = ['l2r', 'r2l']
const WELL_ORDER_VALUES: Array<WellOrderOption> = [...VERTICAL_VALUES, ...HORIZONTAL_VALUES]

type SP = {
  initialFirstValue: ?WellOrderOption,
  initialSecondValue: ?WellOrderOption
}
type DP = {
  updateValues: (firstValue: ?WellOrderOption, secondValue: ?WellOrderOption) => mixed
}

type OP = {
  isOpen: boolean,
  closeModal: () => mixed,
  prefix: 'aspirate' | 'dispense'
}

type Props = OP & SP & DP
type State = {
  firstValue: ?WellOrderOption,
  secondValue: ?WellOrderOption
}

class WellOrderModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      firstValue: props.initialFirstValue,
      secondValue: props.initialSecondValue
    }
  }
  applyChanges = () => {
    this.props.updateValues(this.state.firstValue, this.state.secondValue)
  }
  handleReset = () => {
    this.setState({firstValue: DEFAULT_FIRST, secondValue: DEFAULT_SECOND}, this.applyChanges)
    this.props.closeModal()
  }
  handleCancel = () => {
    const {initialFirstValue, initialSecondValue} = this.props
    this.setState({firstValue: initialFirstValue, secondValue: initialSecondValue}, this.applyChanges)
    this.props.closeModal()
  }
  handleDone = () => {
    this.applyChanges()
    this.props.closeModal()
  }
  makeOnChange = (ordinality: 'first' | 'second') => (e: SyntheticEvent<HTMLSelectElement>) => {
    const {value} = e.currentTarget
    let nextState = {[`${ordinality}Value`]: value}
    if (ordinality === 'first') {
      if (VERTICAL_VALUES.includes(value) && VERTICAL_VALUES.includes(this.state.secondValue)) {
        nextState = {...nextState, secondValue: HORIZONTAL_VALUES[0]}
      } else if (HORIZONTAL_VALUES.includes(value) && HORIZONTAL_VALUES.includes(this.state.secondValue)) {
        nextState = {...nextState, secondValue: VERTICAL_VALUES[0]}
      }
    }
    this.setState(nextState)
  }
  isSecondOptionDisabled = (value: WellOrderOption) => {
    if (VERTICAL_VALUES.includes(this.state.firstValue)) {
      return VERTICAL_VALUES.includes(value)
    } else if (HORIZONTAL_VALUES.includes(this.state.firstValue)) {
      return HORIZONTAL_VALUES.includes(value)
    }
  }
  render () {
    if (!this.props.isOpen) return null
    const {firstValue, secondValue} = this.state
    return (
      <Portal>
        <Modal
          className={modalStyles.modal}
          contentsClassName={cx(modalStyles.modal_contents)}
          onCloseClick={this.handleCancel}>
          <div className={styles.modal_header}>
              <h4>{i18n.t('modal.well_order.title')}</h4>
              <p>{i18n.t('modal.well_order.body')}</p>
          </div>
          <div className={styles.main_row}>
            <FormGroup label={i18n.t('modal.well_order.field_label')}>
              <div className={styles.field_row}>
                <DropdownField
                  value={firstValue}
                  onChange={this.makeOnChange('first')}
                  options={
                    WELL_ORDER_VALUES.map((value) => ({
                      value,
                      name: i18n.t(`step_edit_form.field.well_order.option.${value}`)
                    }))
                  } />
                <span className={styles.field_spacer}>{i18n.t('modal.well_order.then')}</span>
                <DropdownField
                  value={secondValue}
                  onChange={this.makeOnChange('second')}
                  options={
                    WELL_ORDER_VALUES.map((value) => ({
                      value,
                      name: i18n.t(`step_edit_form.field.well_order.option.${value}`),
                      disabled: this.isSecondOptionDisabled(value)
                    }))
                  } />
              </div>
            </FormGroup>
            <FormGroup label={i18n.t('modal.well_order.viz_label')}>
              <WellOrderViz
                prefix={this.props.prefix}
                firstValue={firstValue}
                secondValue={secondValue} />
            </FormGroup>
          </div>
          <div className={styles.button_row}>
            <OutlineButton className={styles.reset_button} onClick={this.handleReset}>
              {i18n.t('button.reset')}
            </OutlineButton>
            <div>
              <PrimaryButton className={styles.cancel_button} onClick={this.handleCancel}>
                {i18n.t('button.cancel')}
              </PrimaryButton>
              <PrimaryButton className={styles.done_button} onClick={this.handleDone}>
                {i18n.t('button.done')}
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      </Portal>
    )
  }
}

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  // NOTE: not interpolating prefix because breaks flow string enum
  const firstName = ownProps.prefix === 'aspirate' ? 'aspirate_wellOrder_first' : 'dispense_wellOrder_first'
  const secondName = ownProps.prefix === 'aspirate' ? 'aspirate_wellOrder_second' : 'dispense_wellOrder_second'
  return {
    initialFirstValue: formData && formData[firstName],
    initialSecondValue: formData && formData[secondName]
  }
}

const mapDTP = (dispatch: Dispatch, ownProps: OP): DP => {
  // NOTE: not interpolating prefix because breaks flow string enum
  const firstName = ownProps.prefix === 'aspirate' ? 'aspirate_wellOrder_first' : 'dispense_wellOrder_first'
  const secondName = ownProps.prefix === 'aspirate' ? 'aspirate_wellOrder_second' : 'dispense_wellOrder_second'
  return {
    updateValues: (firstValue, secondValue) => {
      dispatch(actions.changeFormInput({update: {
        [firstName]: firstValue,
        [secondName]: secondValue
      }}))
    }
  }
}

export default connect(mapSTP, mapDTP)(WellOrderModal)
