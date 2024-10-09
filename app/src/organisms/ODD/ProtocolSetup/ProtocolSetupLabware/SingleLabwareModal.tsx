import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  ALIGN_FLEX_START,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LabwareRender,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { OddModal } from '/app/molecules/OddModal'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
  LabwareLocation,
} from '@opentrons/shared-data'

const LabwareThumbnail = styled.svg`
  transform: scale(1, -1);
  width: 12rem;
  flex-shrink: 0;
`

interface SingleLabwareModalProps {
  selectedLabware: LabwareDefinition2 & {
    location: LabwareLocation
    nickName: string | null
    id: string
  }
  onOutsideClick: () => void
  mostRecentAnalysis: CompletedProtocolAnalysis | null
}

export const SingleLabwareModal = (
  props: SingleLabwareModalProps
): JSX.Element | null => {
  const { selectedLabware, onOutsideClick, mostRecentAnalysis } = props
  const { t } = useTranslation('protocol_setup')

  let location: JSX.Element | string | null = null
  if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'slotName' in selectedLabware?.location
  ) {
    location = <DeckInfoLabel deckLabel={selectedLabware?.location.slotName} />
  } else if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'addressableAreaName' in selectedLabware?.location
  ) {
    location = (
      <DeckInfoLabel
        deckLabel={selectedLabware?.location.addressableAreaName}
      />
    )
  }

  const selectedLabwareLocation = selectedLabware?.location

  return createPortal(
    <OddModal onOutsideClick={onOutsideClick}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_FLEX_START}
          gridGap={SPACING.spacing12}
        >
          <Flex gridGap={SPACING.spacing4}>{location}</Flex>
          <LegacyStyledText
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            fontSize={TYPOGRAPHY.fontSize22}
          >
            {getLabwareDisplayName(selectedLabware)}
          </LegacyStyledText>
          <LegacyStyledText as="p" color={COLORS.grey60}>
            {selectedLabware.nickName}
            {selectedLabwareLocation != null &&
            selectedLabwareLocation !== 'offDeck' &&
            'labwareId' in selectedLabwareLocation
              ? t('on_adapter', {
                  adapterName: mostRecentAnalysis?.labware.find(
                    l => l.id === selectedLabwareLocation.labwareId
                  )?.displayName,
                })
              : null}
          </LegacyStyledText>
        </Flex>
        <LabwareThumbnail
          viewBox={`${selectedLabware.cornerOffsetFromSlot.x} ${selectedLabware.cornerOffsetFromSlot.y} ${selectedLabware.dimensions.xDimension} ${selectedLabware.dimensions.yDimension}`}
        >
          <LabwareRender definition={selectedLabware} />
        </LabwareThumbnail>
      </Flex>
    </OddModal>,
    getTopPortalEl()
  )
}
