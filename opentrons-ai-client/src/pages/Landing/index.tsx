import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LargeButton,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'
import welcomeImage from '../../assets/images/welcome_dashboard.png'
import { useTranslation } from 'react-i18next'

export interface InputType {
  userPrompt: string
}

export function Landing(): JSX.Element | null {
  const { t } = useTranslation('protocol_generator')

  return (
    <Flex
      position={POSITION_RELATIVE}
      margin={`${SPACING.spacing16} ${SPACING.spacing16}`}
      borderRadius={BORDERS.borderRadius16}
      backgroundColor={COLORS.white}
      justifyContent={JUSTIFY_CENTER}
      flex="1"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        width="100%"
        maxWidth="548px"
        gridGap={SPACING.spacing16}
        textAlign={TEXT_ALIGN_CENTER}
      >
        <img
          src={welcomeImage}
          height="132px"
          width="548px"
          aria-label={t('landing_page_image_alt')}
        />
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="headingLargeBold">
            {t('landing_page_heading')}
          </StyledText>
          <StyledText desktopStyle="headingSmallRegular">
            {t('landing_page_body')}
          </StyledText>
        </Flex>
        <LargeButton buttonText={t('landing_page_button_new_protocol')} />
        <LargeButton
          buttonText={t('landing_page_button_update_protocol')}
          buttonType="stroke"
        />
      </Flex>
    </Flex>
  )
}
