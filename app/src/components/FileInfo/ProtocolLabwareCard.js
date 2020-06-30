// @flow
// setup labware component
import * as React from 'react'
import { connect } from 'react-redux'
import countBy from 'lodash/countBy'

import { selectors as robotSelectors } from '../../robot'
import type { State, Dispatch } from '../../types'
import type { Labware } from '../../robot'
import { InfoSection } from './InfoSection'
import { LabwareTable } from './LabwareTable'

type SP = {| labware: Array<Labware> |}

type Props = {| ...SP, dispatch: Dispatch |}

const TITLE = 'Required Labware'

export const ProtocolLabwareCard: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  _,
  _,
  _,
  _
>(mapStateToProps)(ProtocolLabwareCardComponent)

function ProtocolLabwareCardComponent(props: Props) {
  const { labware } = props

  if (labware.length === 0) return null

  const labwareCount = countBy(labware, 'type')
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
function mapStateToProps(state: State): SP {
  return {
    labware: robotSelectors.getLabware(state),
  }
}
