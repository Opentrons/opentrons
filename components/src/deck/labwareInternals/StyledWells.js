// @flow
import * as React from 'react'
import { Well } from './Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { WellGroup } from './types'

export type StyledWellProps = {|
  className: string,
  definition: LabwareDefinition2,
  wells: WellGroup,
|}

function StyledWellsComponent(props: StyledWellProps) {
  const { className, definition, wells } = props
  return (
    <>
      {Object.keys(wells).map((wellName: string) => (
        <Well
          key={wellName}
          wellName={wellName}
          well={definition.wells[wellName]}
          className={className}
        />
      ))}
    </>
  )
}

export const StyledWells: React.AbstractComponent<StyledWellProps> = React.memo(
  StyledWellsComponent
)
