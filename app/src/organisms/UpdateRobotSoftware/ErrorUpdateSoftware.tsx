import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import {
  Flex,
  SPACING,
  COLORS,
  Icon,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  DIRECTION_ROW,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { MediumButton } from '../../atoms/buttons'
import { startBuildrootUpdate } from '../../redux/buildroot'

import type { Dispatch } from '../../redux/types'

interface ErrorUpdateSoftwareProps {
  errorMessage: string
  robotName: string
}
export function ErrorUpdateSoftware({
  errorMessage,
  robotName,
}: ErrorUpdateSoftwareProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  const handleTryAgain = (): void => {
    dispatch(startBuildrootUpdate(robotName))
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      gridGap={SPACING.spacing32}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.red3}
        height="26.625rem"
        gridGap={SPACING.spacing40}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.borderRadiusSize3}
      >
        <Icon name="ot-alert" size="3.75rem" color={COLORS.errorEnabled} />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          alignItems={ALIGN_CENTER}
        >
          <StyledText
            as="h2"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            color={COLORS.black}
          >
            {t('software_update_error')}
          </StyledText>
          <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {errorMessage}
          </StyledText>
        </Flex>
      </Flex>
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
        <MediumButton
          flex="1"
          buttonType="secondary"
          buttonText={t('proceed_without_updating')}
          onClick={() => history.push('/robot-settings/rename-robot')}
        />
        <MediumButton
          flex="1"
          onClick={handleTryAgain}
          buttonText={i18n.format(t('shared:try_again'), 'capitalize')}
        />
      </Flex>
    </Flex>
  )
}
