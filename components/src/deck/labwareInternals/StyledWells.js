// @flow
import * as React from 'react'
import Well from './Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { WellGroup } from './types'

export type StyledWellProps = {|
  className: string,
  definition: LabwareDefinition2,
  wells: WellGroup,
|}

function StyledWell(props: StyledWellProps) {
  const { className, definition, wells } = props
  return Object.keys(wells).map<*, *, React.Node>((wellName, key) => {
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
