import { INACCESSIBLE, SELECTED, SELECTED_ERROR } from '../Tips/constants'
import { SelectedWell } from '../Wells/SelectedWell'
import { UNSELECTED } from './constants'
import { EmptyWell } from './EmptyWell'

import type { LabwareWellMap } from '@opentrons/shared-data'
import type { WellType } from '../types'

interface WellStatusProps {
  wellMap: LabwareWellMap
  type: WellType
  showStroke?: boolean
  size?: string
}

export function WellStatus(props: WellStatusProps): JSX.Element {
  const { type, size, wellMap, showStroke = false } = props
  switch (type) {
    case SELECTED:
      return (
        <SelectedWell
          size={size}
          wellMap={wellMap}
          isSelected={true}
          showStroke={showStroke}
        />
      )
    case INACCESSIBLE:
      return <EmptyWell size={size} wellMap={wellMap} />
    case UNSELECTED:
      return (
        <SelectedWell
          size={size}
          wellMap={wellMap}
          isSelected={false}
          showStroke={showStroke}
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
        />
      )
  }
}
