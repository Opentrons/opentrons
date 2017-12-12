import React from 'react'

import { allStyles } from '@opentrons/components'
import { humanize } from '../utils.js'
import ForeignDiv from '../components/ForeignDiv.js'

const componentStyles = allStyles.LabwareContainer

export default class NameThisLabwareOverlay extends React.Component {
  constructor (props) {
    super(props)
    this.defaultName = humanize(this.props.containerType)
    this.state = {
      pristine: true,
      inputValue: ''
    }
  }

  handleChange = e => {
    this.setState({
      pristine: false,
      inputValue: e.target.value
    })
  }

  handleKeyUp = e => {
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
      slotName,
      // modifyContainer, // TODO do propTypes, include this
      deleteContainer
    } = this.props

    return (
      <g className={componentStyles.slot_overlay_name_it}>
        <rect x='0' y='0' width='100%' height='100%' />
        <g transform='translate(5, 0)'>
          <text className={componentStyles.clickable} x='0' y='0'>Name this labware:</text>
          <ForeignDiv x='0' y='15%' width='90%'>
            <input
              onChange={this.handleChange}
              onKeyUp={this.handleKeyUp}
              placeholder={this.defaultName}
              value={this.state.inputValue}
            />
          </ForeignDiv>
          <text className={componentStyles.clickable} x='0' y='60%' onClick={this.onSubmit}>
            Save
          </text>
          <text className={componentStyles.clickable} x='0' y='80%'
            onClick={() => deleteContainer({containerId, slotName, containerType})}
          >
              Delete
          </text>
        </g>
      </g>
    )
  }
}
