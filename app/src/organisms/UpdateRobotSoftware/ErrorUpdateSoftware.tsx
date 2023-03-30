import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import capitalize from 'lodash/capitalize'
import { useDispatch } from 'react-redux'

import {
  Flex,
  SPACING,
  COLORS,
  Icon,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  PrimaryButton,
  SecondaryButton,
  JUSTIFY_CENTER,
  DIRECTION_ROW,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
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
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  const handleTryAgain = (): void => {
    dispatch(startBuildrootUpdate(robotName))
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.errorBackgroundMed}
        height="26.625rem"
        gridGap={SPACING.spacingXXL}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <Icon name="ot-alert" size="4.375rem" color={COLORS.errorEnabled} />
        <StyledText
          fontSize="2rem"
          lineHeight="2.75rem"
          fontWeight="700"
          color={COLORS.black}
        >
          {t('software_update_error')}
        </StyledText>
        {/* ToDo add error */}
        {errorMessage}
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        marginTop={SPACING.spacing6}
        gridGap="0.75rem"
      >
        <SecondaryButton
          height="4.4375rem"
          onClick={() => history.push('/robot-settings/rename-robot')}
          width="100%"
        >
          <StyledText fontSize="1.5rem" lineHeight="1.375rem" fontWeight="500">
            {t('proceed_without_updating')}
          </StyledText>
        </SecondaryButton>
        <PrimaryButton height="4.4375rem" width="100%" onClick={handleTryAgain}>
          <StyledText fontSize="1.5rem" lineHeight="1.375rem" fontWeight="500">
            {capitalize(t('shared:try_again'))}
          </StyledText>
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
