import * as React from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import type { WellGroup } from './types'
import { Well } from './Well'

export interface StyledWellProps {
  className: string
  definition: LabwareDefinition2
  wells: WellGroup
}

function StyledWellsComponent(props: StyledWellProps): JSX.Element {
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

export const StyledWells: React.MemoExoticComponent<
  typeof StyledWellsComponent
> = React.memo(StyledWellsComponent)
