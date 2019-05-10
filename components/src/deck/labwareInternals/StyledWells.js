// @flow
import * as React from 'react'
import Well from './Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type StyledWellProps = {|
  className: string,
  definition: LabwareDefinition2,
  wells: Array<string>, // TODO IMMEDIATELY type this
|}

function StyledWell(props: StyledWellProps) {
  const { className, definition } = props
  const wells = [...props.wells]
  return wells.map<*, *, React.Node>((wellName, key) => {
    return (
      <Well
        key={key}
        wellName={wellName}
        well={definition.wells[wellName]}
        className={className}
      />
    )
  })
}

export default React.memo<StyledWellProps>(StyledWell)
