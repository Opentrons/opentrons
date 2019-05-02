// @flow
import * as React from 'react'
import Well from './Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

type Props = {|
  className: string,
  definition: LabwareDefinition2,
  noInnerTipCircle?: boolean,
  wells: Set<string>,
|}

function StyledWell(props: Props) {
  const { className, definition, noInnerTipCircle } = props
  const wells = [...props.wells]
  return wells.map<*, *, React.Node>(wellName => {
    return (
      <Well
        key={wellName}
        wellName={wellName}
        definition={definition}
        className={className}
        noInnerTipCircle={noInnerTipCircle}
      />
    )
  })
}

export default React.memo<Props>(StyledWell)
