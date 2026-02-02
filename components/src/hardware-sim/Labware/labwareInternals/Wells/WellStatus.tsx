import { SelectedItem } from '../SelectedItem'
import { INACCESSIBLE, SELECTED } from '../Tips/constants'
import { NoTip } from '../Tips/NoTip'
import { UNSELECTED } from './constants'

import type { LabwareDefinition } from '@opentrons/shared-data'
import type { WellType } from '../types'

export function WellStatus(props: {
  type: WellType
  labwareDefinition: LabwareDefinition
}): JSX.Element {
  const { type, labwareDefinition } = props

  switch (type) {
    case SELECTED:
      return (
        <SelectedItem
          labwareDefinition={labwareDefinition}
          isSelected={true}
          textInsideTip={''}
        />
      )
    case INACCESSIBLE:
      return <NoTip labwareDefinition={labwareDefinition} />
    case UNSELECTED:
      return (
        <SelectedItem
          labwareDefinition={labwareDefinition}
          isSelected={false}
          textInsideTip={''}
        />
      )
  }
}
