import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  BORDERS,
  COLORS,
  Flex,
  NO_WRAP,
  RESPONSIVENESS,
} from '@opentrons/components'

import { DeckInfoLabelTextTag } from '/app/molecules/DeckInfoLabelTextTag'
import { LabwareOffsetsDeckInfoLabels } from '/app/organisms/LabwareOffsetsDeckInfoLabels'
import { OffsetTag } from '/app/organisms/LabwarePositionCheck'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { ReactNode } from 'react'
import type { OffsetTagProps } from '/app/organisms/LabwarePositionCheck'
import type { LocationSpecificOffsetDetailsWithCopy } from '/app/redux/protocol-runs'
import type { AccordionChildrenProps } from './AccordionChildren'

interface AccordionDetailProps extends AccordionChildrenProps {
  detail: LocationSpecificOffsetDetailsWithCopy
}

export function AccordionDetail({
  detail,
  lpcLabwareInfo,
}: AccordionDetailProps): ReactNode {
  const { t } = useTranslation('labware_position_check')
  const { locationDetails, existingOffset: lsExistingOffset } = detail
  const { existingOffset: defaultExistingOffset } =
    lpcLabwareInfo.info.defaultOffsetDetails
  const isHardcoded = locationDetails.hardCodedOffsetId != null

  const buildColTwoText = (): string => {
    if (isHardcoded || lsExistingOffset?.vector != null) {
      return t('manual')
    } else if (defaultExistingOffset?.vector != null) {
      return t('default')
    } else {
      return t('not_applicable')
    }
  }

  let isMissingOffset = false
  const buildColThreeTag = (): OffsetTagProps => {
    if (isHardcoded) {
      return { kind: 'hardcoded' }
    } else if (lsExistingOffset?.vector != null) {
      return { kind: 'vector', ...lsExistingOffset.vector }
    } else if (defaultExistingOffset?.vector != null) {
      return { kind: 'vector', ...defaultExistingOffset.vector }
    } else {
      isMissingOffset = true
      return { kind: 'noOffset' }
    }
  }

  return (
    <Flex css={deckLabelContainerStyle(buildColThreeTag(), isMissingOffset)}>
      <DeckInfoLabelTextTag
        colOneDeckInfoLabels={[
          <LabwareOffsetsDeckInfoLabels
            detail={detail}
            slotCopy={detail.slotCopy}
            key="1"
          />,
        ]}
        colTwoText={buildColTwoText()}
        colThreeTag={<OffsetTag {...buildColThreeTag()} />}
      />
    </Flex>
  )
}

const deckLabelContainerStyle = (
  tagProps: OffsetTagProps,
  isMisingOffset: boolean
): FlattenSimpleInterpolation => css`
  background-color: ${isMisingOffset ? COLORS.yellow20 : COLORS.white};
  border-radius: ${BORDERS.borderRadius4};
  padding-right: ${tagProps.kind === 'vector' ? '' : '2.188rem'};
  text-wrap: ${NO_WRAP};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    background-color: ${isMisingOffset ? COLORS.yellow20 : COLORS.grey20};
    border-radius: ${BORDERS.borderRadius8};
    padding-right: 0;
  }
`
