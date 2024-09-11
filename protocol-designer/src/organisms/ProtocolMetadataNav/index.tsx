import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  StyledText,
} from '@opentrons/components'
import { getFileMetadata } from '../../file-data/selectors'

export function ProtocolMetadataNav(): JSX.Element {
  const metadata = useSelector(getFileMetadata)
  const { t } = useTranslation('starting_deck_state')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {metadata?.protocolName != null && metadata?.protocolName !== ''
          ? metadata?.protocolName
          : t('untitled_protocol')}
      </StyledText>
      <Flex color={COLORS.grey60} justifyContent={JUSTIFY_CENTER}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('edit_protocol')}
        </StyledText>
      </Flex>
    </Flex>
  )
}
