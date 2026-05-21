import { INACCESSIBLE, SELECTED, SELECTED_ERROR } from '../Tips/constants'
import { SelectedWell } from '../Wells/SelectedWell'
import { UNSELECTED } from './constants'
import { EmptyWell } from './EmptyWell'

import type { LabwareWellMap } from '@opentrons/shared-data'
import type { ParentType, WellType } from '../types'

interface WellStatusProps {
  wellMap: LabwareWellMap
  wellName: string
  type: WellType
  parentType: ParentType
  size: string
  showStroke?: boolean
}

export function WellStatus(props: WellStatusProps): JSX.Element {
  const {
    type,
    size,
    wellMap,
    parentType,
    wellName,
    showStroke = false,
  } = props
  switch (type) {
    case SELECTED:
      return (
        <SelectedWell
          size={size}
          wellMap={wellMap}
          isSelected={true}
          showStroke={showStroke}
          wellName={wellName}
        />
      )
    case INACCESSIBLE:
      return (
        <EmptyWell
          wellMap={wellMap}
          size={size}
          parentType={parentType}
          wellName={wellName}
        />
      )
    case UNSELECTED:
      return (
        <SelectedWell
          size={size}
          wellMap={wellMap}
          isSelected={false}
          showStroke={showStroke}
          wellName={wellName}
        />
      )
    case SELECTED_ERROR:
      return (
        <SelectedWell
          size={size}
          wellMap={wellMap}
          isSelected={false}
          showStroke={showStroke}
          isError={true}
          wellName={wellName}
        />
      )
  }
}
