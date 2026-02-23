import { COLORS } from '../../../../helix-design-system'
import { INACCESSIBLE, SELECTED, SELECTED_ERROR } from '../Tips/constants'
import { SelectedWell } from '../Wells/SelectedWell'
import { UNSELECTED } from './constants'
import { EmptyWell } from './EmptyWell'

import type { LabwareWellMap } from '@opentrons/shared-data'
import type { WellType } from '../types'

interface WellStatusProps {
  wellMap: LabwareWellMap
  type: WellType
  flipLine?: boolean
  showStroke?: boolean
  size?: string
}

export function WellStatus(props: WellStatusProps): JSX.Element {
  const { type, size, wellMap, flipLine, showStroke = false } = props
  const outlineColor = size ? COLORS.black90 : COLORS.grey50
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
      return (
        <EmptyWell
          wellMap={wellMap}
          flipLine={flipLine}
          size={size}
          outlineColor={outlineColor}
        />
      )
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
