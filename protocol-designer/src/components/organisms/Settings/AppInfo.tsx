import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BasicButton,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { DOC_URL } from '..'

import type { Dispatch, ReactNode, SetStateAction } from 'react'

interface AppInfoProps {
  setShowAnnouncementModal: Dispatch<SetStateAction<boolean>>
}

export function AppInfo({ setShowAnnouncementModal }: AppInfoProps): ReactNode {
  const { t } = useTranslation('shared')
  const pdVersion = _OT_PD_VERSION_

  const handleSoftwareManualClick = (): void => {
    window.open(DOC_URL, '_blank', 'noopener')
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      height="100%"
    >
      <Flex width="100%" height="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('app_info')}
        </StyledText>
      </Flex>
      <ListItem
        padding={SPACING.spacing16}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        type="default"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('pd_version')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">{pdVersion}</StyledText>
        </Flex>
        <Flex gridGap={SPACING.spacing16} alignItems={ALIGN_CENTER}>
          <BasicButton onClick={handleSoftwareManualClick} underLine>
            {t('software_manual')}
          </BasicButton>
          <BasicButton
            onClick={() => {
              setShowAnnouncementModal(true)
            }}
            underLine
          >
            {t('release_notes')}
          </BasicButton>
        </Flex>
      </ListItem>
    </Flex>
  )
}
