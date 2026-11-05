import { Fragment, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'

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
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_LANGUAGE_UPDATED_ODD_SETTINGS } from '/app/redux/analytics'
import { getAppLanguage, updateConfigValue } from '/app/redux/config'
import { useHandleAndLog } from '/app/resources/access-control/useHandleAndLog'

import type { ChangeEvent, ReactNode } from 'react'
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

const uuid: () => string = uuidv4

export function LanguageSetting({
  setCurrentOption,
}: LanguageSettingProps): ReactNode {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()

  let transactionId = ''
  useEffect(() => {
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    transactionId = uuid()
  }, [])

  const appLanguage = useSelector(getAppLanguage)

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    dispatch(updateConfigValue('language.appLanguage', event.target.value))
    trackEventWithRobotSerial({
      name: ANALYTICS_LANGUAGE_UPDATED_ODD_SETTINGS,
      properties: {
        language: event.target.value,
        transactionId,
      },
    })
  }

  const handleChangeAndLog = useHandleAndLog<ChangeEvent<HTMLInputElement>>(
    handleChange,
    'change_language',
    event => ({
      action: 'change language',
      message: `user changed language to ${event.target.value}`,
    })
  )

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
          <Fragment key={`language_setting_${lng.name}`}>
            <SettingButton
              id={lng.name}
              type="radio"
              value={lng.value}
              checked={lng.value === appLanguage}
              onChange={handleChangeAndLog}
            />
            <SettingButtonLabel
              htmlFor={lng.name}
              isSelected={lng.value === appLanguage}
            >
              <StyledText oddStyle="level4HeaderSemiBold">
                {lng.name}
              </StyledText>
            </SettingButtonLabel>
          </Fragment>
        ))}
      </Flex>
    </Flex>
  )
}
