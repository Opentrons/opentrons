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
import { getLabware } from '@opentrons/shared-data'
import i18n from '../../../localization'
import { DEFAULT_MM_FROM_BOTTOM } from '../../../constants'
import {onlyPositiveNumbers} from '../../../steplist/fieldLevel/processing'
import {Portal} from '../../portals/MainPageModalPortal'
import {selectors as labwareIngredsSelectors} from '../../../labware-ingred/reducers'
import modalStyles from '../../modals/modal.css'
import {actions, selectors} from '../../../steplist'
import type {BaseState} from '../../../types'
import TipPositionViz from './TipPositionViz'

import styles from './TipPositionInput.css'

// TODO: logical default
const DEFAULT_TIP_POSITION = 0

type SP = {
  tipPosition: number,
  wellHeightMM: number
}
type DP = { updateValue: (number) => mixed }

type OP = {
  isOpen: boolean,
  closeModal: () => mixed,
  prefix: 'aspirate' | 'dispense'
}

type Props = OP & SP & DP
type State = { value: number }

class TipPositionModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = { value: props.tipPosition }
  }
  componentDidUpdate (prevProps) {
    if (prevProps.wellHeightMM !== this.props.wellHeightMM) {
      this.setState({value: DEFAULT_MM_FROM_BOTTOM})
    }
  }
  applyChanges = () => {
    this.props.updateValue(this.state.value)
  }
  handleReset = () => {
    this.setState({value: DEFAULT_TIP_POSITION}, this.applyChanges)
    this.props.closeModal()
  }
  handleCancel = () => {
    this.setState({value: this.props.tipPosition}, this.applyChanges)
    this.props.closeModal()
  }
  handleDone = () => {
    this.applyChanges()
    this.props.closeModal()
  }
  handleChange = (e: SyntheticEvent<HTMLSelectElement>) => {
    const {value} = e.currentTarget
    const valueFloat = parseFloat(value)
    const maximumHeightMM = (this.props.wellHeightMM * 2)
    if (valueFloat >= maximumHeightMM) {
      this.setState({value: maximumHeightMM})
    } else {
      this.setState({value: onlyPositiveNumbers(value) || 0})
    }
  }
  handleIncrement = () => {
    const valueFloat = parseFloat(this.state.value)
    if (valueFloat < (this.props.wellHeightMM * 2)) {
      this.setState({value: String(valueFloat + 1)})
    }
  }
  handleDecrement = () => {
    const nextValueFloat = parseFloat(this.state.value) - 1
    this.setState({value: (nextValueFloat < 0 ? 0 : nextValueFloat)})
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
                  {key: 'ArrowUp', shiftKey: false, onPress: this.handleIncrement},
                  {key: 'ArrowDown', shiftKey: false, onPress: this.handleDecrement}
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
                      onClick={this.handleIncrement}>
                      <Icon name="plus" />
                    </OutlineButton>
                    <OutlineButton
                      className={styles.adjustment_button}
                      disabled={parseFloat(value) <= 0}
                      onClick={this.handleDecrement}>
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

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  // NOTE: not interpolating prefix because breaks flow string enum
  let fieldName = 'tipPosition'
  if (ownProps.prefix === 'aspirate') fieldName = 'aspirate_tipPosition'
  else if (ownProps.prefix === 'dispense') fieldName = 'dispense_tipPosition'

  let labwareFieldName = 'labware'
  if (ownProps.prefix === 'aspirate') labwareFieldName = 'aspirate_labware'
  else if (ownProps.prefix === 'dispense') labwareFieldName = 'dispense_labware'

  let wellHeightMM = 0
  if (formData[labwareFieldName]) {
    const labwareById = labwareIngredsSelectors.getLabware(state)
    const labwareDef = getLabware(labwareById[formData[labwareFieldName]].type)
    console.log('def: ', labwareDef)
    if (labwareDef) {
      // NOTE: only taking depth of first well in labware, UI not currently equipped for multiple depths
      const firstWell = labwareDef.wells[Object.keys(labwareDef.wells)[0]]
      if (firstWell) wellHeightMM = firstWell.depth
    } else {
      console.warn('the specified source labware definition could not be located')
    }
  }
  return {
    tipPosition: formData && formData[fieldName],
    wellHeightMM
  }
}

const mapDTP = (dispatch: Dispatch, ownProps: OP): DP => {
  // NOTE: not interpolating prefix because breaks flow string enum
  const fieldName = ownProps.prefix === 'aspirate' ? 'aspirate_tipPosition' : 'dispense_tipPosition'
  return {
    updateValue: (value) => {
      dispatch(actions.changeFormInput({update: {[fieldName]: value}}))
    }
  }
}

export default connect(mapSTP, mapDTP)(TipPositionModal)
