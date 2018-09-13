// @flow
// setup labware component
import * as React from 'react'
import {connect} from 'react-redux'
import countBy from 'lodash/countBy'

import {selectors as robotSelectors} from '../../robot'
import InfoSection from './InfoSection'
import LabwareTable from './LabwareTable'

import type {State} from '../../types'
import type {Labware} from '../../robot'

type Props = {
  labware: Array<Labware>,
}

const TITLE = 'Required Labware'

export default connect(mapStateToProps)(ProtocolLabwareCard)

function ProtocolLabwareCard (props: Props) {
  const {labware} = props

  if (labware.length === 0) return null

  const labwareCount = countBy(labware, 'name')
  const labwareList = Object.keys(labwareCount).map(type => (
    <tr key={type}>
      <td>{type}</td>
      <td>{`x${labwareCount[type]}`}</td>
    </tr>
  ))

  return (
    <InfoSection title={TITLE}>
      <LabwareTable>{labwareList}</LabwareTable>
    </InfoSection>
  )
}
function mapStateToProps (state: State): Props {
  return {
    labware: robotSelectors.getLabware(state),
  }
}
