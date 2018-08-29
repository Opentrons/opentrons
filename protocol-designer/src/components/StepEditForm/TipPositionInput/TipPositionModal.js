// @flow
import * as React from 'react'
import cx from 'classnames'
import {connect} from 'react-redux'
import {
  Modal,
  OutlineButton,
  PrimaryButton,
  FormGroup,
  InputField,
  Icon,
  HandleKeypress
} from '@opentrons/components'
import i18n from '../../../localization'
import { DEFAULT_MM_FROM_BOTTOM } from '../../../constants'
import {Portal} from '../../portals/MainPageModalPortal'
import modalStyles from '../../modals/modal.css'
import {actions} from '../../../steplist'
import TipPositionViz from './TipPositionViz'

import styles from './TipPositionInput.css'

const SMALL_STEP_MM = 1
const LARGE_STEP_MM = 10

type DP = { updateValue: (string) => mixed }

type OP = {
  tipPosition: number,
  wellHeightMM: number,
  isOpen: boolean,
  closeModal: () => mixed,
  prefix: 'aspirate' | 'dispense'
}

type Props = OP & DP
type State = { value: string}

const formatValue = (value: mixed) => (
  parseFloat(value).toFixed(1)
)

class TipPositionModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = { value: formatValue(props.tipPosition) }
  }
  componentDidUpdate (prevProps) {
    if (prevProps.wellHeightMM !== this.props.wellHeightMM) {
      this.setState({value: formatValue(this.props.tipPosition)})
    }
  }
  applyChanges = () => {
    this.props.updateValue(formatValue(this.state.value))
  }
  handleReset = () => {
    this.setState({value: formatValue(DEFAULT_MM_FROM_BOTTOM)}, this.applyChanges)
    this.props.closeModal()
  }
  handleCancel = () => {
    this.setState({value: formatValue(this.props.tipPosition)}, this.applyChanges)
    this.props.closeModal()
  }
  handleDone = () => {
    this.applyChanges()
    this.props.closeModal()
  }
  handleChange = (e: SyntheticEvent<HTMLSelectElement>) => {
    const {value} = e.currentTarget
    const valueFloat = formatValue(value)
    const maximumHeightMM = (this.props.wellHeightMM * 2)

    if (Number(valueFloat) > maximumHeightMM) {
      this.setState({value: formatValue(maximumHeightMM)})
    } else if (Number(valueFloat) > 0) {
      const numericValue = value.replace(/[^.0-9]/, '')
      this.setState({value: numericValue.replace(/(\d*[.]{1}\d{1})(\d*)/, (match, group1) => group1)})
    } else {
      this.setState({value: formatValue(0)})
    }
  }
  makeHandleIncrement = (step: number) => () => {
    const {value} = this.state
    const incrementedValue = parseFloat(value) + step
    const maximumHeightMM = (this.props.wellHeightMM * 2)
    this.setState({value: formatValue(Math.min(incrementedValue, maximumHeightMM))})
  }
  makeHandleDecrement = (step: number) => () => {
    const nextValueFloat = parseFloat(this.state.value) - step
    this.setState({value: formatValue(nextValueFloat < 0 ? 0 : nextValueFloat)})
  }
  render () {
    if (!this.props.isOpen) return null
    const {value} = this.state
    const {wellHeightMM} = this.props

    return (
      <Portal>
        <HandleKeypress
            preventDefault
            handlers={[
              {key: 'ArrowUp', shiftKey: false, onPress: this.makeHandleIncrement(SMALL_STEP_MM)},
              {key: 'ArrowUp', shiftKey: true, onPress: this.makeHandleIncrement(LARGE_STEP_MM)},
              {key: 'ArrowDown', shiftKey: false, onPress: this.makeHandleDecrement(SMALL_STEP_MM)},
              {key: 'ArrowDown', shiftKey: true, onPress: this.makeHandleDecrement(LARGE_STEP_MM)}
            ]}>
          <Modal
            className={modalStyles.modal}
            contentsClassName={cx(modalStyles.modal_contents)}
            onCloseClick={this.handleCancel}>
            <div className={styles.modal_header}>
                <h4>{i18n.t('modal.tip_position.title')}</h4>
                <p>{i18n.t('modal.tip_position.body')}</p>
            </div>
            <div className={styles.main_row}>
              <div className={styles.leftHalf}>
                <FormGroup label={i18n.t('modal.tip_position.field_label')}>
                  <InputField
                    className={styles.position_from_bottom_input}
                    onChange={this.handleChange}
                    units="mm"
                    value={value ? String(value) : '0'} />
                </FormGroup>
                <div className={styles.viz_group}>
                  <div className={styles.adjustment_buttons}>
                    <OutlineButton
                      className={styles.adjustment_button}
                      disabled={parseFloat(value) >= (wellHeightMM * 2)}
                      onClick={this.makeHandleIncrement(SMALL_STEP_MM)}>
                      <Icon name="plus" />
                    </OutlineButton>
                    <OutlineButton
                      className={styles.adjustment_button}
                      disabled={parseFloat(value) <= 0}
                      onClick={this.makeHandleDecrement(SMALL_STEP_MM)}>
                      <Icon name="minus" />
                    </OutlineButton>
                  </div>
                  <TipPositionViz tipPosition={value} wellHeightMM={wellHeightMM} />
                </div>
              </div>
              <div className={styles.rightHalf}>{/* TODO: xy tip positioning */}</div>
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
        </HandleKeypress>
      </Portal>
    )
  }
}

const mapDTP = (dispatch: Dispatch, ownProps: OP): DP => {
  // NOTE: not interpolating prefix because breaks flow string enum

  let fieldName = 'mmFromBottom'
  if (ownProps.prefix === 'aspirate') fieldName = 'aspirate_mmFromBottom'
  else if (ownProps.prefix === 'dispense') fieldName = 'dispense_mmFromBottom'
  return {
    updateValue: (value) => {
      dispatch(actions.changeFormInput({update: {[fieldName]: value}}))
    }
  }
}

export default connect(null, mapDTP)(TipPositionModal)
