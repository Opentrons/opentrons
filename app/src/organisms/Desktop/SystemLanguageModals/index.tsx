import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import {
  getAppLanguage,
  getStoredSystemLanguage,
  updateConfigValue,
} from '/app/redux/config'
import { getSystemLanguage } from '/app/redux/shell'

import type { Dispatch } from '/app/redux/types'

export function SystemLanguagePreferenceModal(): JSX.Element | null {
  const { t } = useTranslation(['app_settings', 'branded'])

  const dispatch = useDispatch<Dispatch>()
  const navigate = useNavigate()

  const appLanguage = useSelector(getAppLanguage)
  const systemLocale = useSelector(getSystemLanguage)
  const storedSystemLanguage = useSelector(getStoredSystemLanguage)

  // convert full system locale e.g. "en-US" to language subtag e.g. "en"
  const locale = systemLocale != null ? new Intl.Locale(systemLocale) : null
  const systemLanguage = locale?.language ?? null

  const showBootModal = appLanguage == null && systemLanguage != null
  const showUpdateModal =
    appLanguage != null &&
    systemLanguage != null &&
    storedSystemLanguage != null &&
    systemLanguage !== storedSystemLanguage

  const title = showUpdateModal
    ? t('system_language_preferences_update')
    : t('system_language_preferences')

  const description = showUpdateModal
    ? t('branded:system_language_preferences_update_description')
    : t('branded:system_language_preferences_description')

  const secondaryButtonText = showUpdateModal
    ? t('dont_change')
    : t('choose_different_language')

  const handleSecondaryClick = (): void => {
    if (showBootModal) {
      /**
       * if user chooses "Choose different language" on initial boot:
       * set app language to system language temporarily and navigate to app settings page where language setting lives
       *  */
      dispatch(updateConfigValue('language.appLanguage', systemLanguage))
      dispatch(updateConfigValue('language.systemLanguage', systemLanguage))
      navigate('/app-settings')
    } else {
      // if user chooses "Don't change" on system language update, stored the new system language but don't update the app language
      dispatch(updateConfigValue('language.systemLanguage', systemLanguage))
    }
  }

  const handlePrimaryClick = (): void => {
    dispatch(updateConfigValue('language.appLanguage', systemLanguage))
    dispatch(updateConfigValue('language.systemLanguage', systemLanguage))
  }

  return showBootModal || showUpdateModal ? (
    <Modal title={title}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <StyledText desktopStyle="bodyDefaultRegular">{description}</StyledText>
        <Flex
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing8}
          justifyContent={JUSTIFY_FLEX_END}
        >
          <SecondaryButton onClick={handleSecondaryClick}>
            {secondaryButtonText}
          </SecondaryButton>
          <PrimaryButton onClick={handlePrimaryClick}>
            {t('use_system_language')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  ) : null
}
