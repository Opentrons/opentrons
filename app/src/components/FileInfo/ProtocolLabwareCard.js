// @flow
// setup labware component
import * as React from 'react'
import {connect} from 'react-redux'
import countBy from 'lodash/countBy'
import forEach from 'lodash/forEach'
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
  let labwareList = []

  forEach(labwareCount, function (value, key) {
    const quantity = value > 1
      ? `x${value}`
      : ''
    return (
      labwareList.push(
        <tr key={key}>
          <td>{key}</td>
          <td>{quantity}</td>
        </tr>
      )
    )
  })

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
