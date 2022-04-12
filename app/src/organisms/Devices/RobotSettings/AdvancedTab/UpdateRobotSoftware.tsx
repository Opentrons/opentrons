import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  SPACING_AUTO,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { ExternalLink } from '../../../../atoms/Link/ExternalLink'
import { TertiaryButton } from '../../../../atoms/Buttons'

const OT_APP_UPDATE_PAGE_LINK = 'https://opentrons.com/ot-app/'

export function UpdateRobotSoftware(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginBottom={SPACING.spacing5}
    >
      <Box width="70%">
        <StyledText
          as="h3"
          css={TYPOGRAPHY.h3SemiBold}
          marginBottom={SPACING.spacing4}
          id="AdvancedSettings_About"
        >
          {t('update_robot_software')}
        </StyledText>
        <StyledText as="p">{t('update_robot_software_description')}</StyledText>
        <ExternalLink href={OT_APP_UPDATE_PAGE_LINK}>
          {t('update_robot_software_link')}
        </ExternalLink>
      </Box>
      <TertiaryButton
        marginLeft={SPACING_AUTO}
        onClick={null} // ToDo add slideout
        id="AdvancedSettings_softwareUpdateButton"
      >
        {t('update_robot_software_browse_button')}
      </TertiaryButton>
    </Flex>
  )
}
