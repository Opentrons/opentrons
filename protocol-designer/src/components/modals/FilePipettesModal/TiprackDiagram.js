// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import SingleLabware from '../../labware/SingleLabware'
import styles from './FilePipettesModal.css'
import { selectors as labwareDefSelectors } from '../../../labware-defs'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { BaseState } from '../../../types'

type OP = {| definitionURI: ?string |}
type SP = {| definition: ?LabwareDefinition2 |}
type Props = { ...OP, ...SP }

function TiprackDiagram(props: Props) {
  const { definition } = props
  if (!definition) {
    return <div className={styles.tiprack_labware} />
  }

  return (
    <div className={styles.tiprack_labware}>
      <SingleLabware definition={definition} />
    </div>
  )
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { definitionURI } = ownProps
  const definition = definitionURI
    ? labwareDefSelectors.getLabwareDefsByURI(state)[definitionURI]
    : null
  return { definition }
}

export default connect<Props, OP, SP, _, BaseState, _>(mapStateToProps)(
  TiprackDiagram
)
