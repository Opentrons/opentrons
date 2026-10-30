import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  NO_WRAP,
  SPACING,
  StyledText,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import SuccessIcon from '/app/assets/images/icon_success.png'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'
import {
  getFlexSlotNameOnly,
  selectSelectedLwDisplayName,
  selectSelectedLwFlowType,
  selectSelectedLwOverview,
  selectSelectedLwWithOffsetDetailsMostRecentVectorOffset,
} from '/app/redux/protocol-runs'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { EditOffsetContentProps } from '/app/organisms/LabwarePositionCheck/steps/HandleLabware/EditOffset'
import type { State } from '/app/redux/types'

interface DesktopOffsetSuccessProps extends EditOffsetContentProps {
  handleAddConfirmedWorkingVector: () => void
}

export function DesktopOffsetSuccess(
  props: DesktopOffsetSuccessProps
): ReactNode {
  const { t } = useTranslation('labware_position_check')
  const { t: commandTextT } = useTranslation('protocol_command_text')
  const flowType = useSelector(selectSelectedLwFlowType(props.runId))
  const mostRecentVectorOffset = useSelector(
    selectSelectedLwWithOffsetDetailsMostRecentVectorOffset(props.runId)
  )
  const { protocolData } = useSelector(
    (state: State) => state.protocolRuns[props.runId]?.lpc!
  )
  const selectedLwInfo = useSelector(selectSelectedLwOverview(props.runId))!
  const moduleModel =
    selectedLwInfo.offsetLocationDetails?.closestBeneathModuleModel
  const offsetLocationDetails = selectedLwInfo.offsetLocationDetails!
  const labwareDisplayName = useSelector(
    selectSelectedLwDisplayName(props.runId)
  )

  const slotOnlyDisplayLocation = getFlexSlotNameOnly(
    offsetLocationDetails,
    protocolData,
    commandTextT as TFunction
  )

  const bodyText = (): string => {
    switch (flowType) {
      case 'default': {
        if (mostRecentVectorOffset == null) {
          return t('labware_default_offset_added', {
            labware: labwareDisplayName,
          })
        } else {
          return t('labware_default_offset_updated', {
            labware: labwareDisplayName,
          })
        }
      }
      case 'location-specific': {
        if (moduleModel != null) {
          return t('slot_in_module_applied_location_offset_updated', {
            slot: slotOnlyDisplayLocation,
            module: getModuleDisplayName(moduleModel),
          })
        } else {
          return t('slot_applied_location_offset_updated', {
            slot: slotOnlyDisplayLocation,
          })
        }
      }
      default: {
        console.error('Unhandled flow type.')
        return t('add_default_labware_offset')
      }
    }
  }

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      oddHeaderBtnCopy={t('continue')}
      desktopFooterBtnCopy={t('continue')}
      desktopHeaderBtnCopy={t('exit')}
      onClickButton={props.handleAddConfirmedWorkingVector}
    >
      <Flex css={CONTENT_CONTAINER}>
        <img src={SuccessIcon} css={IMAGE_STYLE} alt="Success Icon" />
        <StyledText desktopStyle="headingSmallBold">{bodyText()}</StyledText>
      </Flex>
    </LPCContentContainer>
  )
}

const CONTENT_CONTAINER = css`
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  padding: ${SPACING.spacing40};
  gap: ${SPACING.spacing24};
  text-align: ${TEXT_ALIGN_CENTER};
  text-wrap: ${NO_WRAP};
`

const IMAGE_STYLE = css`
  width: 10.625rem;
  height: 8.813rem;
`
