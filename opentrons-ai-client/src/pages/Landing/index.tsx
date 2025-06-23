import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  LargeButton,
  Link as LinkButton,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

import {
  headerWithMeterAtom,
  updateProtocolChatAtom,
} from '../../resources/atoms'
import { useIsMobile } from '../../resources/hooks/useIsMobile'
import { useTrackEvent } from '../../resources/hooks/useTrackEvent'

import welcomeImage from '../../assets/images/welcome_dashboard.png'

export function Landing(): JSX.Element | null {
  const navigate = useNavigate()
  const { t } = useTranslation('protocol_generator')
  const isMobile = useIsMobile()
  const trackEvent = useTrackEvent()
  const [, setHeaderWithMeterAtom] = useAtom(headerWithMeterAtom)
  const [, setUpdateProtocolChatAtom] = useAtom(updateProtocolChatAtom)

  useEffect(() => {
    setHeaderWithMeterAtom({ displayHeaderWithMeter: false, progress: 0.0 })
  }, [setHeaderWithMeterAtom])

  function handleCreateNewProtocol(): void {
    trackEvent({ name: 'create-new-protocol', properties: {} })
    navigate('/new-protocol')
  }

  function handleUpdateProtocol(): void {
    trackEvent({ name: 'update-protocol', properties: {} })
    navigate('/update-protocol')
  }

  function handleGoToChat(): void {
    trackEvent({ name: 'go-to-chat', properties: {} })
    // Set a special marker to indicate direct chat access
    setUpdateProtocolChatAtom({
      prompt: '',
      protocol_text: '',
      regenerate: false,
      update_type: 'other',
      update_details: 'direct_chat_access', // Special marker
      fake: false,
    })
    navigate('/chat')
  }

  return (
    <Flex
      position={POSITION_RELATIVE}
      margin={SPACING.spacing16}
      marginBottom={0}
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
        minHeight="600px"
        gridGap={SPACING.spacing16}
        textAlign={TEXT_ALIGN_CENTER}
      >
        <img
          src={welcomeImage}
          height="132px"
          width="548px"
          alt={t('landing_page_image_alt')}
        />
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="headingLargeBold">
            {t('landing_page_heading')}
          </StyledText>
          <StyledText desktopStyle="headingSmallRegular">
            {!isMobile ? t('landing_page_body') : t('landing_page_body_mobile')}
          </StyledText>
        </Flex>
        {!isMobile && (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_CENTER}
            gridGap={SPACING.spacing16}
          >
            <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
              <LargeButton
                buttonText="Get help with an existing protocol"
                onClick={handleUpdateProtocol}
                height="3.5rem"
                css="border-radius: 8px !important; text-align: center !important; display: flex !important; align-items: center !important; justify-content: center !important; width: auto !important; padding: 0 2rem !important; white-space: nowrap !important;"
              />
              <LargeButton
                buttonText="Create a new protocol"
                onClick={handleCreateNewProtocol}
                height="3.5rem"
                css="border-radius: 8px !important; text-align: center !important; display: flex !important; align-items: center !important; justify-content: center !important; width: auto !important; padding: 0 2rem !important; white-space: nowrap !important;"
              />
            </Flex>
            <LinkButton
              role="button"
              onClick={handleGoToChat}
              color={COLORS.grey60}
              textDecoration="underline"
            >
              <StyledText desktopStyle="bodyLargeSemiBold">
                {t('go_directly_to_chat')}
              </StyledText>
            </LinkButton>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
