// @flow
// setup labware component
import * as React from 'react'
import {connect} from 'react-redux'
import countBy from 'lodash/countBy'
import type {State} from '../../types'
import type {Labware} from '../../robot'
import {selectors as robotSelectors} from '../../robot'
import LabwareTable from './LabwareTable'

type Props = {
  labware: Array<Labware>,
}

const TITLE = 'Required Labware'

export default connect(mapStateToProps, null)(ProtocolLabwareCard)

function ProtocolLabwareCard (props: Props) {
  const {labware} = props
  const labwareCount = countBy(labware, 'name')

  const labwareList = Object.keys(labwareCount).map(type => (
    <tr key={type}>
      <td>{type}</td>
      <td>{`x${labwareCount[type]}`}</td>
    </tr>
  ))

  return (
    <LabwareTable title={TITLE}>
      {labwareList}
    </LabwareTable>
  )
}
function mapStateToProps (state: State): Props {
  return {
    labware: robotSelectors.getLabware(state)
  }
}
