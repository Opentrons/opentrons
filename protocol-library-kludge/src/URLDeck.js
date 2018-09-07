// @flow
import React from 'react'
import {
  Deck,
  Labware,
  type LabwareComponentProps
} from '@opentrons/components'

// Expects slot: labwareType URL params, eg `?11=96-flat&10=tiprack-200ul`
export default class URLDeck extends React.Component<{}> {
  urlParams: ?URLSearchParams

  constructor () {
    super()
    this.urlParams = new URLSearchParams(window.location.search)
  }

  getLabware = (args: LabwareComponentProps) => {
    const {slot} = args
    const labwareType = this.urlParams && this.urlParams.get(slot)
    return (labwareType)
      ? <Labware labwareType={labwareType} />
      : null
  }

  render () {
    return (
      <Deck LabwareComponent={this.getLabware} />
    )
  }
}
