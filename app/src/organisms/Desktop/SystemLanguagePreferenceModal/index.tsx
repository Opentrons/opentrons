import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DropdownMenu,
  Flex,
  JUSTIFY_FLEX_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { LANGUAGES } from '/app/i18n'
import {
  getAppLanguage,
  getStoredSystemLanguage,
  updateConfigValue,
  useFeatureFlag,
} from '/app/redux/config'
import { getSystemLanguage } from '/app/redux/shell'

import type { DropdownOption } from '@opentrons/components'
import type { Dispatch } from '/app/redux/types'

export function SystemLanguagePreferenceModal(): JSX.Element | null {
  const { i18n, t } = useTranslation(['app_settings', 'shared', 'branded'])
  const enableLocalization = useFeatureFlag('enableLocalization')

  const [currentOption, setCurrentOption] = useState<DropdownOption>(
    LANGUAGES[0]
  )

  const dispatch = useDispatch<Dispatch>()

  const appLanguage = useSelector(getAppLanguage)
  const systemLanguage = useSelector(getSystemLanguage)
  const storedSystemLanguage = useSelector(getStoredSystemLanguage)

  const showBootModal = appLanguage == null && systemLanguage != null
  const showUpdateModal =
    appLanguage != null &&
    systemLanguage != null &&
    storedSystemLanguage != null &&
    systemLanguage !== storedSystemLanguage

  const title = showUpdateModal
    ? t('system_language_preferences_update')
    : t('language_preference')

  const description = showUpdateModal
    ? t('branded:system_language_preferences_update_description')
    : t('branded:language_preference_description')

  const primaryButtonText = showUpdateModal
    ? t('use_system_language')
    : i18n.format(t('shared:continue'), 'capitalize')

  const handleSecondaryClick = (): void => {
    // if user chooses "Don't change" on system language update, stored the new system language but don't update the app language
    dispatch(updateConfigValue('language.systemLanguage', systemLanguage))
  }

  const handlePrimaryClick = (): void => {
    dispatch(updateConfigValue('language.appLanguage', currentOption.value))
    dispatch(updateConfigValue('language.systemLanguage', systemLanguage))
  }

  const handleDropdownClick = (value: string): void => {
    const selectedOption = LANGUAGES.find(lng => lng.value === value)

    if (selectedOption != null) {
      setCurrentOption(selectedOption)
      void i18n.changeLanguage(selectedOption.value)
    }
  }

  // set initial language for boot modal; match app language to supported options
  useEffect(() => {
    if (systemLanguage != null) {
      // prefer match entire locale, then match just language e.g. zh-Hant and zh-CN
      const matchedSystemLanguageOption =
        LANGUAGES.find(lng => lng.value === systemLanguage) ??
        LANGUAGES.find(
          lng =>
            new Intl.Locale(lng.value).language ===
            new Intl.Locale(systemLanguage).language
        )
      if (matchedSystemLanguageOption != null) {
        // initial current option: set to detected system language
        setCurrentOption(matchedSystemLanguageOption)
        if (showBootModal) {
          // for boot modal temp change app display language based on initial system locale
          void i18n.changeLanguage(systemLanguage)
        }
      }
    }
  }, [i18n, systemLanguage, showBootModal])

  return enableLocalization && (showBootModal || showUpdateModal) ? (
    <Modal title={title}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {description}
          </StyledText>
          {showBootModal ? (
            <DropdownMenu
              filterOptions={LANGUAGES}
              currentOption={currentOption}
              onClick={handleDropdownClick}
              title={t('select_language')}
              width="50%"
            />
          ) : null}
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing8}
          justifyContent={JUSTIFY_FLEX_END}
        >
          {showUpdateModal ? (
            <SecondaryButton onClick={handleSecondaryClick}>
              {t('dont_change')}
            </SecondaryButton>
          ) : null}
          <PrimaryButton onClick={handlePrimaryClick}>
            {primaryButtonText}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  ) : null
}
