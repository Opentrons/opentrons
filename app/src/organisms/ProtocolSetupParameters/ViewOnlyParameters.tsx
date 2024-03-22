import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ChildNavigation } from '../ChildNavigation'
import { StyledText } from '../../atoms/text'
import { Chip } from '../../atoms/Chip'
import { useToaster } from '../ToasterOven'
import { mockData } from './index'

import type { RunTimeParameter } from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/ProtocolSetup'

export interface ViewOnlyParametersProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

export function ViewOnlyParameters({
  runId,
  setSetupScreen,
}: ViewOnlyParametersProps): JSX.Element {
  const { t, i18n } = useTranslation('protocol_setup')
  const { makeSnackbar } = useToaster()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const handleOnClick = (): void => {
    makeSnackbar(t('reset_setup'))
  }

  //  TODO(jr, 3/18/24): remove mockData
  const parameters = mostRecentAnalysis?.runTimeParameters ?? mockData

  const getDefault = (parameter: RunTimeParameter): string => {
    const { type, default: defaultValue } = parameter
    const suffix =
      'suffix' in parameter && parameter.suffix != null ? parameter.suffix : ''
    switch (type) {
      case 'int':
      case 'float':
        return `${defaultValue.toString()} ${suffix}`
      case 'boolean':
        return Boolean(defaultValue)
          ? i18n.format(t('on'), 'capitalize')
          : i18n.format(t('off'), 'capitalize')
      case 'str':
        if ('choices' in parameter && parameter.choices != null) {
          const choice = parameter.choices.find(
            choice => choice.value === defaultValue
          )
          if (choice != null) {
            return choice.displayName
          }
        }
        break
    }
    return ''
  }

  return (
    <>
      <ChildNavigation
        header={t('parameters')}
        onClickBack={() => setSetupScreen('prepare to run')}
        inlineNotification={{
          type: 'neutral',
          heading: t('values_are_view_only'),
        }}
      />
      <Flex
        marginTop="7.75rem"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing8}
      >
        <Flex
          gridGap={SPACING.spacing8}
          color={COLORS.grey60}
          fontSize={TYPOGRAPHY.fontSize20}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          lineHeight={TYPOGRAPHY.lineHeight24}
        >
          <StyledText paddingLeft={SPACING.spacing16} width="50%">
            {t('name')}
          </StyledText>
          <StyledText>{t('value')}</StyledText>
        </Flex>
        {parameters.map((parameter, index) => {
          //  TODO(jr, 3/20/24): plug in the info if the
          //  parameter changed from the default
          const hasCustomValue = true
          return (
            <Flex
              onClick={handleOnClick}
              key={`${parameter.displayName}_${index}`}
              alignItems={ALIGN_CENTER}
              backgroundColor={COLORS.grey35}
              borderRadius={BORDERS.borderRadius8}
              padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
              gridGap={SPACING.spacing24}
            >
              <StyledText
                width="48%"
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {parameter.displayName}
              </StyledText>
              <Flex
                alignItems={ALIGN_CENTER}
                flexDirection={DIRECTION_ROW}
                gridGap={SPACING.spacing8}
              >
                <StyledText as="p" maxWidth="15rem" color={COLORS.grey60}>
                  {getDefault(parameter)}
                </StyledText>
                {hasCustomValue ? (
                  <Chip type="success" text={t('updated')} hasIcon={false} />
                ) : null}
              </Flex>
            </Flex>
          )
        })}
      </Flex>
    </>
  )
}
