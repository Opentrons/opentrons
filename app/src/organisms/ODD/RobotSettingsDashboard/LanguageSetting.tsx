import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import {
  BORDERS,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { LANGUAGES } from '/app/i18n'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { getAppLanguage, updateConfigValue } from '/app/redux/config'

import type { Dispatch } from '/app/redux/types'
import type { SetSettingOption } from './types'

interface LabelProps {
  isSelected?: boolean
}

const SettingButton = styled.input`
  display: none;
`

const SettingButtonLabel = styled.label<LabelProps>`
  padding: ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadius16};
  cursor: ${CURSOR_POINTER};
  background: ${({ isSelected }) =>
    isSelected === true ? COLORS.blue50 : COLORS.blue35};
  color: ${({ isSelected }) => isSelected === true && COLORS.white};
`

interface LanguageSettingProps {
  setCurrentOption: SetSettingOption
}

export function LanguageSetting({
  setCurrentOption,
}: LanguageSettingProps): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()

  const appLanguage = useSelector(getAppLanguage)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    dispatch(updateConfigValue('language.appLanguage', event.target.value))
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        header={t('language')}
        onClickBack={() => {
          setCurrentOption(null)
        }}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        marginTop="7.75rem"
        padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40} ${SPACING.spacing40}`}
      >
        {LANGUAGES.map(lng => (
          <React.Fragment key={`language_setting_${lng.name}`}>
            <SettingButton
              id={lng.name}
              type="radio"
              value={lng.value}
              checked={lng.value === appLanguage}
              onChange={handleChange}
            />
            <SettingButtonLabel
              htmlFor={lng.name}
              isSelected={lng.value === appLanguage}
            >
              <StyledText oddStyle="level4HeaderSemiBold">
                {lng.name}
              </StyledText>
            </SettingButtonLabel>
          </React.Fragment>
        ))}
      </Flex>
    </Flex>
  )
}
