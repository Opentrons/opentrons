// @flow
import * as React from 'react'
import ForeignDiv from '../../components/ForeignDiv.js'
import ClickableText from './ClickableText'
import styles from './labware.css'
import type {ClickOutsideInterface, DeckSlot} from '@opentrons/components'

type Props = {
  containerType: string,
  containerId: string,
  slot: DeckSlot,
  // TODO Ian 2018-02-16 type these fns elsewhere and import the type
  modifyContainer: (args: {containerId: string, modify: {[field: string]: mixed}}) => void,
  deleteContainer: (args: {containerId: string, slot: DeckSlot, containerType: string}) => void,
} & ClickOutsideInterface

type State = {
  pristine: boolean,
  inputValue: string,
}

const NICKNAME_PROMPT = 'Add a nickname?'

export default class NameThisLabwareOverlay extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      pristine: true,
      inputValue: '',
    }
  }

  handleChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      pristine: false,
      inputValue: e.target.value,
    })
  }

  handleKeyUp = (e: SyntheticKeyboardEvent<*>) => {
    if (e.key === 'Enter') {
      this.onSubmit()
    }
  }

  onSubmit = () => {
    const { containerId, modifyContainer } = this.props
    const containerName = this.state.inputValue || null

    modifyContainer({
      containerId,
      modify: { name: containerName },
    })
  }

  render () {
    const {
      containerType,
      containerId,
      slot,
      deleteContainer,
      passRef,
    } = this.props

    return (
      <g className={styles.slot_overlay} ref={passRef}>
        <rect className={styles.overlay_panel} />
        <g transform='translate(5, 0)'>
          <ForeignDiv x='0' y='15%' width='90%'>
            <input
              className={styles.name_input}
              onChange={this.handleChange}
              onKeyUp={this.handleKeyUp}
              placeholder={NICKNAME_PROMPT}
              value={this.state.inputValue}
            />
          </ForeignDiv>

          <ClickableText onClick={this.onSubmit}
            iconName='check' y='60%' text='Save' />

          <ClickableText onClick={() => deleteContainer({containerId, slot, containerType})}
            iconName='close' y='80%' text='Cancel' />
        </g>
      </g>
    )
  }
}
