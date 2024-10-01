import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_START,
  StyledText,
} from '@opentrons/components'
import { getFileMetadata } from '../../file-data/selectors'

interface ProtocolMetadataNavProps {
  isAddingHardwareOrLabware?: boolean
}

export function ProtocolMetadataNav({
  isAddingHardwareOrLabware = false,
}: ProtocolMetadataNavProps): JSX.Element {
  const metadata = useSelector(getFileMetadata)
  const { t } = useTranslation('starting_deck_state')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {metadata?.protocolName != null && metadata?.protocolName !== ''
          ? metadata?.protocolName
          : t('untitled_protocol')}
      </StyledText>
      <Flex
        color={COLORS.grey60}
        justifyContent={
          isAddingHardwareOrLabware ? JUSTIFY_FLEX_START : JUSTIFY_CENTER
        }
      >
        <StyledText desktopStyle="bodyDefaultRegular">
          {isAddingHardwareOrLabware
            ? t('add_hardware_labware')
            : t('edit_protocol')}
        </StyledText>
      </Flex>
    </Flex>
  )
}
