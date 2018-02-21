// @flow
import * as React from 'react'

import {humanize} from '../../utils.js'
import ForeignDiv from '../../components/ForeignDiv.js'
import ClickableText from './ClickableText'
import styles from './labware.css'

type Props = {
  containerType: string,
  containerId: string,
  slot: string,
  // TODO Ian 2018-02-16 type these fns elsewhere and import the type
  modifyContainer: (args: {containerId: string, modify: {[field: string]: mixed}}) => void,
  deleteContainer: (args: {containerId: string, slot: string, containerType: string}) => void
}

type State = {
  pristine: boolean,
  inputValue: string
}

export default class NameThisLabwareOverlay extends React.Component<Props, State> {
  defaultName: string
  constructor (props: Props) {
    super(props)
    this.defaultName = humanize(this.props.containerType)
    this.state = {
      pristine: true,
      inputValue: ''
    }
  }

  handleChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      pristine: false,
      inputValue: e.target.value
    })
  }

  handleKeyUp = (e: SyntheticEvent<*>) => {
    if (e.key === 'Enter') {
      this.onSubmit()
    }
  }

  onSubmit = () => {
    const { containerId, modifyContainer } = this.props
    const containerName = this.state.inputValue || this.defaultName

    modifyContainer({
      containerId,
      modify: { name: containerName }
    })
  }

  render () {
    const {
      containerType,
      containerId,
      slot,
      // modifyContainer, // TODO do propTypes, include this
      deleteContainer
    } = this.props

    return (
      <g className={styles.slot_overlay}>
        <rect className={styles.overlay_panel} />
        <g transform='translate(5, 0)'>
          <text className={styles.clickable} x='0' y='0'>Name this labware:</text>
          <ForeignDiv x='0' y='15%' width='90%'>
            <input
              onChange={this.handleChange}
              onKeyUp={this.handleKeyUp}
              placeholder={this.defaultName}
              value={this.state.inputValue}
            />
          </ForeignDiv>
          {/* <text className={styles.clickable} x='0' y='60%' onClick={this.onSubmit}>
            Save
          </text> */}
          <ClickableText onClick={this.onSubmit}
            iconName='plus' y='60%' text='Save Labware' />
          <ClickableText onClick={() => deleteContainer({containerId, slot, containerType})}
            iconName='close' y='80%' text='Cancel' />
          {/* <text className={styles.clickable} x='0' y='80%'
            onClick={() => deleteContainer({containerId, slot, containerType})}
          >
              Delete
          </text> */}
        </g>
      </g>
    )
  }
}
