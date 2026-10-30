import {
  Flex,
  MODULE_ICON_NAME_BY_TYPE,
  RobotInfoLabel,
  SPACING,
} from '@opentrons/components'
import { getModuleType } from '@opentrons/shared-data'

import type { ReactNode } from 'react'
import type { LocationSpecificOffsetDetails } from '/app/redux/protocol-runs'

export interface LabwareOffsetsDeckInfoLabelsProps {
  detail: LocationSpecificOffsetDetails
  slotCopy: string
}

export function LabwareOffsetsDeckInfoLabels({
  detail,
  slotCopy,
}: LabwareOffsetsDeckInfoLabelsProps): ReactNode {
  const { closestBeneathModuleModel, lwModOnlyStackupDetails } =
    detail.locationDetails

  const isLabwareInLwStackup = (): boolean => {
    const lwOnlyStackup = lwModOnlyStackupDetails.filter(
      component => component.kind === 'labware'
    )

    return lwOnlyStackup.length > 1
  }

  return (
    <Flex gridGap={SPACING.spacing4}>
      <RobotInfoLabel deckLabel={slotCopy} />
      {isLabwareInLwStackup() && (
        <RobotInfoLabel iconName="stacked" key="stacked-icon" />
      )}
      {closestBeneathModuleModel != null && (
        <RobotInfoLabel
          iconName={
            MODULE_ICON_NAME_BY_TYPE[getModuleType(closestBeneathModuleModel)]
          }
          key="module-icon"
        />
      )}
    </Flex>
  )
}
