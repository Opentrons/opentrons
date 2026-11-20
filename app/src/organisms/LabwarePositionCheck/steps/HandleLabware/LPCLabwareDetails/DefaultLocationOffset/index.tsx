import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_NONE,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { OffsetTag } from '/app/organisms/LabwarePositionCheck/OffsetTag'
import {
  proceedEditOffsetSubstep,
  selectMostRecentVectorOffsetForLwWithOffsetDetails,
  selectSelectedLwDefaultOffsetDetails,
  selectSelectedLwDisplayName,
  setSelectedLabware,
} from '/app/redux/protocol-runs'

import { ManageDefaultOffsetBtn } from './ManageDefaultOffsetBtn'

import type { ReactNode } from 'react'
import type { OffsetTagProps } from '/app/organisms/LabwarePositionCheck/OffsetTag'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function DefaultLocationOffset(props: LPCWizardContentProps): ReactNode {
  const { runId } = props
  const { t } = useTranslation('labware_position_check')
  const dispatch = useDispatch()
  const defaultOffsetDetails = useSelector(
    selectSelectedLwDefaultOffsetDetails(runId)
  )!
  const mostRecentOffset = useSelector(
    selectMostRecentVectorOffsetForLwWithOffsetDetails(
      runId,
      defaultOffsetDetails.locationDetails.definitionUri,
      defaultOffsetDetails
    )
  )
  const selectedLwName = useSelector(selectSelectedLwDisplayName(runId))

  const handleLaunchEditOffset = (): void => {
    dispatch(
      setSelectedLabware(
        runId,
        defaultOffsetDetails.locationDetails.definitionUri,
        defaultOffsetDetails.locationDetails
      )
    )
    dispatch(proceedEditOffsetSubstep(runId))
  }

  const buildOffsetTagProps = (): OffsetTagProps => {
    if (mostRecentOffset == null) {
      return { kind: 'noOffset' }
    } else {
      return { kind: 'vector', ...mostRecentOffset.offset }
    }
  }

  return (
    <Flex css={CONTAINER_STYLE}>
      <StyledText css={DESKTOP_ONLY} desktopStyle="headingSmallBold">
        {selectedLwName}
      </StyledText>
      <Flex css={OFFSET_CONTAINER_STYLE}>
        <Flex css={BUTTON_ALL_CONTENT_STYLE}>
          <Flex css={BUTTON_LEFT_CONTENT_STYLE}>
            <StyledText oddStyle="level4HeaderSemiBold">
              {t('default_labware_offset')}
            </StyledText>
            <Flex>
              <OffsetTag {...buildOffsetTagProps()} />
            </Flex>
          </Flex>
          <ManageDefaultOffsetBtn
            isMissingDefaultOffset={mostRecentOffset == null}
            onClick={handleLaunchEditOffset}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  gap: ${SPACING.spacing16};
`

const DESKTOP_ONLY = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    display: ${DISPLAY_NONE};
  }
`

const OFFSET_CONTAINER_STYLE = css`
  background-color: ${COLORS.grey20};
  padding: ${SPACING.spacing12};
  border-radius: ${BORDERS.borderRadius4};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    background-color: ${COLORS.grey35};
    padding: ${SPACING.spacing16} ${SPACING.spacing24};
    border-radius: ${BORDERS.borderRadius8};
  }
`

const BUTTON_ALL_CONTENT_STYLE = css`
  grid-gap: ${SPACING.spacing24};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
  width: 100%;
`

const BUTTON_LEFT_CONTENT_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing8};
`
