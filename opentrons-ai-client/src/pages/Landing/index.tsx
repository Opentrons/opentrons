import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'

import { StyledText } from '@opentrons/components'

import welcomeImage from '/ai-client/assets/images/welcome_dashboard.png'
import { ActionCard } from '/ai-client/components/molecules/ActionCard'
import {
  headerWithMeterAtom,
  updateProtocolChatAtom,
} from '/ai-client/resources/atoms'
import { useIsMobile } from '/ai-client/resources/hooks/useIsMobile'
import { useTrackEvent } from '/ai-client/resources/hooks/useTrackEvent'

import styles from './landing.module.css'

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
    <div className={styles.landing_wrapper}>
      <div className={styles.landing_container}>
        <div className={styles.content_wrapper}>
          <div className={styles.header_section}>
            <img
              src={welcomeImage}
              className={styles.welcome_image}
              alt={t('landing_page_image_alt')}
            />
            <div className={styles.text_section}>
              <StyledText desktopStyle="displayBold">
                {t('landing_page_heading')}
              </StyledText>
              <StyledText desktopStyle="headingLargeRegular">
                {!isMobile
                  ? t('landing_page_body_new')
                  : t('landing_page_body_mobile')}
              </StyledText>
            </div>
          </div>

          {!isMobile && (
            <div className={styles.cards_container}>
              <ActionCard
                titleKey="landing_page_update_title"
                descriptionKey="landing_page_update_description"
                linkKey="landing_page_update_link"
                onClick={handleUpdateProtocol}
              />
              <ActionCard
                titleKey="landing_page_create_title"
                descriptionKey="landing_page_create_description"
                linkKey="landing_page_create_link"
                onClick={handleCreateNewProtocol}
              />
              <ActionCard
                titleKey="landing_page_chat_title"
                descriptionKey="landing_page_chat_description"
                linkKey="landing_page_chat_link"
                onClick={handleGoToChat}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
