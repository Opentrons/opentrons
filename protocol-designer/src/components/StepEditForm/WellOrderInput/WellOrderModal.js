// @flow
import * as React from 'react'
import cx from 'classnames'
import {connect} from 'react-redux'

import i18n from '../../../localization'
import {Portal} from '../../portals/MainPageModalPortal'
import {Modal, OutlineButton, LabeledValue, FormGroup, DropdownField} from '@opentrons/components'
import modalStyles from '../../modals/modal.css'
import {actions, selectors} from '../../../steplist'
import WellOrderViz from './WellOrderViz'

import styles from './WellOrderInput.css'

export type WellOrderOrdinality = 'first' | 'second'
export type WellOrderOption = 'l2r' | 'r2l' | 't2b' | 'b2t'
const VERTICAL_VALUES: Array<WellOrderOption> = ['t2b', 'b2t']
const HORIZONTAL_VALUES: Array<WellOrderOption> = ['l2r', 'r2l']
const WELL_ORDER_VALUES: Array<WellOrderOption> = [...VERTICAL_VALUES, ...HORIZONTAL_VALUES]

type SP = {
  initialFirstValue: WellOrderOption,
  initialSecondValue: WellOrderOption
}
type DP = {
  setDefaults: () => mixed,
  updateValues: (firstValue: WellOrderOption, secondValue: WellOrderOption) => mixed
}

type OP = {
  isOpen: boolean,
  closeModal: (e: SyntheticEvent<*>) => mixed,
  onSave: () => mixed,
  prefix: 'aspirate' | 'dispense'
}

type Props = OP & SP & DP
type State = {
  firstValue: WellOrderOption,
  secondValue: WellOrderOption,
}

class WellOrderModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      firstValue: props.initialFirstValue,
      secondValue: props.initialSecondValue
    }
  }
  handleReset = () => {
    this.props.setDefaults()
    this.props.closeModal()
  }
  handleClose = () => {
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
          onCloseClick={this.handleClose}>
          <div className={styles.top_row}>
            <LabeledValue
              label={i18n.t('modal.well_order.title')}
              value={i18n.t('modal.well_order.body')} />
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
            <FormGroup label={i18n.t('modal.well_order.viz_label')} className={styles.viz_wrapper}>
              <WellOrderViz
                prefix={this.props.prefix}
                firstValue={firstValue}
                secondValue={secondValue} />
            </FormGroup>
          </div>
          <div className={styles.button_row}>
            <OutlineButton className={styles.default_button} onClick={this.handleReset}>
              {i18n.t('button.reset_to_default')}
            </OutlineButton>
            <OutlineButton onClick={this.handleClose}>
              {i18n.t('button.done')}
            </OutlineButton>
          </div>
        </Modal>
      </Portal>
    )
  }
}

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  const {prefix} = ownProps
  const initialFirstValue = formData ? formData[`${prefix}_wellOrder_first`] : null
  const initialSecondValue = formData ? formData[`${prefix}_wellOrder_second`] : null
  return {
    initialFirstValue,
    initialSecondValue
  }
}

const mapDTP = (dispatch: Dispatch, ownProps): DP => {
  const {prefix} = ownProps
  return {
    // TODO: BC 2018-08-19 put these defaults in consolidated location
    setDefaults: () => {
      dispatch(actions.changeFormInput({update: {
        [`${prefix}_wellOrder_first`]: 'l2r',
        [`${prefix}_wellOrder_second`]: 't2b'
      }}))
    },
    updateValues: (firstValue, secondValue) => {
      dispatch(actions.changeFormInput({update: {
        [`${prefix}_wellOrder_first`]: firstValue,
        [`${prefix}_wellOrder_second`]: secondValue
      }}))
    }
  }
}

export default connect(mapSTP, mapDTP)(WellOrderModal)
