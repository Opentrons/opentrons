// @flow
import * as React from 'react'
import cx from 'classnames'
import {connect} from 'react-redux'
import round from 'lodash/round'
import {
  Modal,
  OutlineButton,
  PrimaryButton,
  FormGroup,
  InputField,
  Icon,
  HandleKeypress,
} from '@opentrons/components'
import i18n from '../../../localization'
import {
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../../constants'
import {Portal} from '../../portals/MainPageModalPortal'
import modalStyles from '../../modals/modal.css'
import {actions} from '../../../steplist'
import TipPositionZAxisViz from './TipPositionZAxisViz'

import styles from './TipPositionInput.css'

import {getIsTouchTipField, type TipOffsetFields} from '../../../form-types'

const SMALL_STEP_MM = 1
const LARGE_STEP_MM = 10
const DECIMALS_ALLOWED = 1

type DP = { updateValue: (?string) => mixed }

type OP = {
  mmFromBottom: number,
  wellHeightMM: number,
  isOpen: boolean,
  closeModal: () => mixed,
  defaultMm: number,
  fieldName: TipOffsetFields,
}

type Props = OP & DP
type State = { value: ?string }

const formatValue = (value: number | string): string => (
  String(round(Number(value), DECIMALS_ALLOWED))
)

class TipPositionModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const initialValue = props.mmFromBottom
      ? formatValue(props.mmFromBottom)
      : formatValue(this.getDefaultMmFromBottom())
    this.state = { value: initialValue }
  }
  componentDidUpdate (prevProps) {
    if (prevProps.wellHeightMM !== this.props.wellHeightMM) {
      this.setState({value: formatValue(this.props.mmFromBottom)})
    }
  }
  applyChanges = () => {
    const {value} = this.state
    this.props.updateValue(value && formatValue(value))
  }
  getDefaultMmFromBottom = (): number => {
    const {fieldName, wellHeightMM} = this.props
    switch (fieldName) {
      case 'aspirate_mmFromBottom':
        return DEFAULT_MM_FROM_BOTTOM_ASPIRATE
      case 'dispense_mmFromBottom':
        return DEFAULT_MM_FROM_BOTTOM_DISPENSE
      case 'mix_mmFromBottom':
        // TODO: Ian 2018-11-131 figure out what offset makes most sense for mix
        return DEFAULT_MM_FROM_BOTTOM_DISPENSE
      default:
        // touch tip fields
        return DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP + wellHeightMM
    }
  }

  handleReset = () => {
    this.setState({value: null}, this.applyChanges)
    this.props.closeModal()
  }
  handleCancel = () => {
    this.setState({value: formatValue(this.props.mmFromBottom)}, this.applyChanges)
    this.props.closeModal()
  }
  handleDone = () => {
    this.applyChanges()
    this.props.closeModal()
  }
  handleChange = (e: SyntheticEvent<HTMLSelectElement>) => {
    const {value} = e.currentTarget
    const valueFloat = Number(formatValue(value))

    const isTouchTip = getIsTouchTipField(this.props.fieldName)

    const maximumHeightMM = (this.props.wellHeightMM * 2)
    const minimumHeightMM = isTouchTip ? this.props.wellHeightMM - 10 : 0

    if (!value) {
      this.setState({value})
    } else if (valueFloat > maximumHeightMM) {
      this.setState({value: formatValue(maximumHeightMM)})
    } else if (valueFloat >= minimumHeightMM) {
      const numericValue = value.replace(/[^.0-9]/, '')
      this.setState({value: numericValue.replace(/(\d*[.]{1}\d{1})(\d*)/, (match, group1) => group1)})
    } else {
      this.setState({value: null})
    }
  }
  makeHandleIncrement = (step: number) => () => {
    const {value} = this.state
    const incrementedValue = parseFloat(value || 0) + step
    const maximumHeightMM = (this.props.wellHeightMM * 2)
    this.setState({value: formatValue(Math.min(incrementedValue, maximumHeightMM))})
  }
  makeHandleDecrement = (step: number) => () => {
    const nextValueFloat = parseFloat(this.state.value || 0) - step
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
            {key: 'ArrowDown', shiftKey: true, onPress: this.makeHandleDecrement(LARGE_STEP_MM)},
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
                    value={value } />
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
                  <TipPositionZAxisViz
                    mmFromBottom={value || String(this.getDefaultMmFromBottom())}
                    wellHeightMM={wellHeightMM} />
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
  return {
    updateValue: (value) => {
      dispatch(actions.changeFormInput({update: {[ownProps.fieldName]: value}}))
    },
  }
}

export default connect(null, mapDTP)(TipPositionModal)
