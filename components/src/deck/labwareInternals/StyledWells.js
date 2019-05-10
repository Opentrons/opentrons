// @flow
import * as React from 'react'
import Well from './Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { WellArray } from './types'

export type StyledWellProps = {|
  className: string,
  definition: LabwareDefinition2,
  wells: WellArray,
|}

function StyledWell(props: StyledWellProps) {
  const { className, definition, wells } = props
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
