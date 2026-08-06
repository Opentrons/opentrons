import {
  COLORS,
  FlexTrash,
  useCommandTypeSummaries,
  WasteChute,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import type { ReactNode } from 'react'
import type { TrashCutoutId } from '@opentrons/components'
import type { CutoutId, RunTimeCommand } from '@opentrons/shared-data'

interface FixtureCommandSummaryProps {
  commandType: RunTimeCommand['commandType']
  cutoutId: CutoutId
  type: 'trashBin' | 'wasteChute'
}

export function FixtureCommandSummary(
  props: FixtureCommandSummaryProps
): ReactNode {
  const { cutoutId, commandType, type } = props
  const commandSummary = useCommandTypeSummaries(commandType)

  return type === 'trashBin' ? (
    <FlexTrash
      robotType={FLEX_ROBOT_TYPE}
      trashIconColor={COLORS.grey35}
      trashCutoutId={cutoutId as TrashCutoutId}
      backgroundColor={COLORS.grey50}
      tagInfo={[
        {
          text: commandSummary,
          isLast: true,
          isSelected: true,
          isZoomed: false,
        },
      ]}
      showHighlight
    />
  ) : (
    <WasteChute
      wasteIconColor={COLORS.grey35}
      backgroundColor={COLORS.grey50}
      tagInfo={[
        {
          text: commandSummary,
          isLast: true,
          isSelected: true,
          isZoomed: false,
        },
      ]}
      showHighlight
    />
  )
}
