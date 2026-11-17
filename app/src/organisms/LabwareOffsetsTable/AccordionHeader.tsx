import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  NO_WRAP,
  RESPONSIVENESS,
  SPACING,
  StyledText,
  truncateString,
} from '@opentrons/components'

import { getIsOnDevice } from '/app/redux/config'
import { selectTotalOrMissingOffsetRequiredCountForLwCopy } from '/app/redux/protocol-runs'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'

export interface AccordionHeaderProps {
  runId: string
  uri: string
  lwDisplayName: string
  lwVersion: number
}

export function AccordionHeader({
  lwDisplayName,
  runId,
  uri,
  lwVersion,
}: AccordionHeaderProps): ReactNode {
  const { t } = useTranslation('labware_position_check')
  const offsetCopy = useSelector(
    selectTotalOrMissingOffsetRequiredCountForLwCopy(runId, uri, t as TFunction)
  )
  const isOnDevice = useSelector(getIsOnDevice)
  const nameString = isOnDevice
    ? truncateString(lwDisplayName, 43)
    : lwDisplayName

  return (
    <Flex css={ACCORDION_HEADER_CONTAINER_STYLE}>
      <Flex css={LABWARE_COPY_CONTAINER_STYLE}>
        <StyledText
          oddStyle="bodyTextSemiBold"
          desktopStyle="bodyDefaultSemiBold"
        >
          {nameString}
        </StyledText>
        <StyledText
          oddStyle="bodyTextRegular"
          desktopStyle="bodyDefaultRegular"
        >
          {t('version_number', { version: lwVersion })}
        </StyledText>
      </Flex>
      <StyledText
        css={OFFSET_COPY_STYLE}
        oddStyle="bodyTextRegular"
        desktopStyle="bodyDefaultRegular"
      >
        {offsetCopy}
      </StyledText>
    </Flex>
  )
}

const ACCORDION_HEADER_CONTAINER_STYLE = css`
  gap: ${SPACING.spacing24};
  width: 100%;
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
`

const LABWARE_COPY_CONTAINER_STYLE = css`
  gap: ${SPACING.spacing8};
`

const OFFSET_COPY_STYLE = css`
  width: 6.85rem;
  text-wrap: ${NO_WRAP};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 10.25rem;
    color: ${COLORS.grey60};
  }
`
