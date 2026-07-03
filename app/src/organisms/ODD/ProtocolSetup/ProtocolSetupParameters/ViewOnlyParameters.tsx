import { useTranslation } from 'react-i18next'

import { Chip, COLORS, StyledText } from '@opentrons/components'
import {
  formatRunTimeParameterValue,
  sortRuntimeParameters,
} from '@opentrons/shared-data'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useToaster } from '/app/organisms/ToasterOven'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import styles from './viewonlyparameters.module.css'

import type { Dispatch, SetStateAction } from 'react'
import type { SetupScreens } from '../types'

export interface ViewOnlyParametersProps {
  runId: string
  setSetupScreen: Dispatch<SetStateAction<SetupScreens>>
}

export function ViewOnlyParameters({
  runId,
  setSetupScreen,
}: ViewOnlyParametersProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const { makeSnackbar } = useToaster()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const handleOnClick = (): void => {
    makeSnackbar(t('reset_setup') as string)
  }

  const parameters = mostRecentAnalysis?.runTimeParameters ?? []

  return (
    <div className={styles.screen}>
      <ChildNavigation
        header={t('parameters')}
        onClickBack={() => {
          setSetupScreen('prepare to run')
        }}
        inlineNotification={{
          type: 'neutral',
          heading: t('values_are_view_only'),
        }}
      />
      <div className={styles.content_container}>
        <div className={styles.header_container}>
          <div className={styles.header_name}>
            <StyledText oddStyle="smallBodyTextSemiBold" color={COLORS.grey60}>
              {t('name')}
            </StyledText>
          </div>
          <StyledText oddStyle="smallBodyTextSemiBold" color={COLORS.grey60}>
            {t('value')}
          </StyledText>
        </div>
        {sortRuntimeParameters(parameters).map((parameter, index) => {
          return (
            <div
              onClick={handleOnClick}
              key={`${parameter.displayName}_${index}`}
              className={styles.parameter_row}
            >
              <div className={styles.parameter_name}>
                <StyledText oddStyle="bodyTextSemiBold">
                  {parameter.displayName}
                </StyledText>
              </div>
              <div className={styles.parameter_value_container}>
                <StyledText
                  oddStyle="bodyTextRegular"
                  className={styles.parameter_value}
                >
                  {formatRunTimeParameterValue(parameter, t)}
                </StyledText>
                {parameter.type === 'csv_file' ||
                parameter.value !== parameter.default ? (
                  <Chip
                    data-testid={`Chip_${parameter.variableName}`}
                    type="success"
                    text={t('updated')}
                    hasIcon={false}
                    chipSize="small"
                  />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
