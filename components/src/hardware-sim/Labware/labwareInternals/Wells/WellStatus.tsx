import { INACCESSIBLE, SELECTED, SELECTED_ERROR } from '../Tips/constants'
import { SelectedWell } from '../Wells/SelectedWell'
import { UNSELECTED } from './constants'
import { EmptyWell } from './EmptyWell'

import type { LabwareDefinition } from '@opentrons/shared-data'
import type { WellType } from '../types'

interface WellStatusProps {
  labwareDefinition: LabwareDefinition
  type: WellType
  size?: string
}

export function WellStatus(props: WellStatusProps): JSX.Element {
  const { type, size, labwareDefinition } = props
  switch (type) {
    case SELECTED:
      return (
        <SelectedWell
          size={size}
          labwareDefinition={labwareDefinition}
          isSelected={true}
          showStroke={false}
        />
      )
    case INACCESSIBLE:
      return <EmptyWell size={size} labwareDefinition={labwareDefinition} />
    case UNSELECTED:
      return (
        <SelectedWell
          size={size}
          labwareDefinition={labwareDefinition}
          isSelected={false}
          showStroke={false}
        />
      )
    case SELECTED_ERROR:
      return (
        <SelectedWell
          size={size}
          labwareDefinition={labwareDefinition}
          isSelected={false}
          showStroke={false}
          isError={true}
        />
      )
  }
}
