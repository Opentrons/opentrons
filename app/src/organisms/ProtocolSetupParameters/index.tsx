import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import {
  useCreateProtocolAnalysisMutation,
  useCreateRunMutation,
  useHost,
} from '@opentrons/react-api-client'
import { useQueryClient } from 'react-query'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'
import { formatRunTimeParameterValue } from '@opentrons/shared-data'

import { ProtocolSetupStep } from '../../pages/ProtocolSetup'
import { getRunTimeParameterValuesForRun } from '../Devices/utils'
import { ChildNavigation } from '../ChildNavigation'
import { ResetValuesModal } from './ResetValuesModal'
import { ChooseEnum } from './ChooseEnum'
import { ChooseNumber } from './ChooseNumber'
import { ChooseCsvFile } from './ChooseCsvFile'
import { useFeatureFlag } from '../../redux/config'

import type { NumberParameter, RunTimeParameter } from '@opentrons/shared-data'
import type { LabwareOffsetCreateData } from '@opentrons/api-client'

interface ProtocolSetupParametersProps {
  protocolId: string
  runTimeParameters: RunTimeParameter[]
  labwareOffsets?: LabwareOffsetCreateData[]
}

export function ProtocolSetupParameters({
  protocolId,
  labwareOffsets,
  runTimeParameters,
}: ProtocolSetupParametersProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const history = useHistory()
  const host = useHost()
  const queryClient = useQueryClient()
  const [
    chooseValueScreen,
    setChooseValueScreen,
  ] = React.useState<RunTimeParameter | null>(null)
  const [
    showNumericalInputScreen,
    setShowNumericalInputScreen,
  ] = React.useState<NumberParameter | null>(null)
  const [
    chooseCsvFileScreen,
    setChooseCsvFileScreen,
  ] = React.useState<RunTimeParameter | null>(null)
  const [resetValuesModal, showResetValuesModal] = React.useState<boolean>(
    false
  )
  const [startSetup, setStartSetup] = React.useState<boolean>(false)
  const [
    runTimeParametersOverrides,
    setRunTimeParametersOverrides,
  ] = React.useState<RunTimeParameter[]>(
    // present defaults rather than last-set value
    runTimeParameters.map(param => {
      return { ...param, value: param.default }
    })
  )

  // ToDo (kk:06/12/2024) the initial value is fileId if there is a csv file

  const [fileInfo, setFileInfo] = React.useState<string>(
    runTimeParameters.find(param => param.type === 'csv_file')?.value ?? ''
  )

  const enableCsvFile = useFeatureFlag('enableCsvFile')

  const updateParameters = (
    value: boolean | string | number,
    variableName: string
  ): void => {
    const updatedParameters = runTimeParametersOverrides.map(parameter => {
      if (parameter.variableName === variableName) {
        return { ...parameter, value }
      }
      return parameter
    })
    setRunTimeParametersOverrides(updatedParameters)
    if (chooseValueScreen && chooseValueScreen.variableName === variableName) {
      const updatedParameter = updatedParameters.find(
        parameter => parameter.variableName === variableName
      )
      if (updatedParameter != null) {
        setChooseValueScreen(updatedParameter)
      }
    }
    if (
      showNumericalInputScreen &&
      showNumericalInputScreen.variableName === variableName
    ) {
      const updatedParameter = updatedParameters.find(
        parameter => parameter.variableName === variableName
      )
      if (updatedParameter != null) {
        setShowNumericalInputScreen(updatedParameter as NumberParameter)
      }
    }
  }

  const runTimeParameterValues = getRunTimeParameterValuesForRun(
    runTimeParametersOverrides
  )
  const { createProtocolAnalysis } = useCreateProtocolAnalysisMutation(
    protocolId,
    host
  )

  const { createRun, isLoading } = useCreateRunMutation({
    onSuccess: data => {
      queryClient.invalidateQueries([host, 'runs']).catch((e: Error) => {
        console.error(`could not invalidate runs cache: ${e.message}`)
      })
    },
  })
  const handleConfirmValues = (): void => {
    setStartSetup(true)
    createProtocolAnalysis({
      protocolKey: protocolId,
      runTimeParameterValues: runTimeParameterValues,
    })
    createRun({
      protocolId,
      labwareOffsets,
      runTimeParameterValues: getRunTimeParameterValuesForRun(
        runTimeParametersOverrides
      ),
    })
  }

  const handleSetParameter = (parameter: RunTimeParameter): void => {
    if ('choices' in parameter) {
      setChooseValueScreen(parameter)
    } else if (parameter.type === 'bool') {
      updateParameters(!parameter.value, parameter.variableName)
    } else if (parameter.type === 'int' || parameter.type === 'float') {
      setShowNumericalInputScreen(parameter)
    } else if (parameter.type === 'csv_file') {
      setChooseCsvFileScreen(parameter)
    } else {
      // bad param
      console.log('error')
    }
  }

  let children = (
    <>
      <ChildNavigation
        header={t('parameters')}
        onClickBack={() => {
          history.goBack()
        }}
        onClickButton={handleConfirmValues}
        buttonText={t('confirm_values')}
        iconName={isLoading || startSetup ? 'ot-spinner' : undefined}
        iconPlacement="startIcon"
        secondaryButtonProps={{
          buttonType: 'tertiaryLowLight',
          buttonText: t('restore_defaults'),
          disabled: isLoading || startSetup,
          onClick: () => {
            showResetValuesModal(true)
          },
        }}
      />
      <Flex
        marginTop="7.75rem"
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing40}
        paddingBottom={SPACING.spacing40}
      >
        {runTimeParametersOverrides.map((parameter, index) => {
          return (
            <React.Fragment key={`${parameter.displayName}_${index}`}>
              <ProtocolSetupStep
                hasIcon={!(parameter.type === 'bool')}
                status="inform"
                title={parameter.displayName}
                onClickSetupStep={() => {
                  handleSetParameter(parameter)
                }}
                detail={formatRunTimeParameterValue(parameter, t)}
                description={parameter.description}
                fontSize="h4"
                disabled={startSetup}
              />
            </React.Fragment>
          )
        })}
      </Flex>
    </>
  )
  // ToDo Update soon
  // if (enableCsvFile && chooseCsvFileScreen != null) {
  if (enableCsvFile) {
    children = (
      <ChooseCsvFile
        handleGoBack={() => {
          setChooseCsvFileScreen(null)
        }}
        parameter={chooseCsvFileScreen}
        setParameter={updateParameters}
        fileInfo={fileInfo}
        setFileInfo={setFileInfo}
      />
    )
  }
  if (chooseValueScreen != null) {
    children = (
      <ChooseEnum
        handleGoBack={() => {
          setChooseValueScreen(null)
        }}
        parameter={chooseValueScreen}
        setParameter={updateParameters}
        rawValue={chooseValueScreen.value}
      />
    )
  }
  if (showNumericalInputScreen != null) {
    children = (
      <ChooseNumber
        handleGoBack={() => {
          setShowNumericalInputScreen(null)
        }}
        parameter={showNumericalInputScreen}
        setParameter={updateParameters}
      />
    )
  }

  return (
    <>
      {resetValuesModal ? (
        <ResetValuesModal
          runTimeParametersOverrides={runTimeParametersOverrides}
          setRunTimeParametersOverrides={setRunTimeParametersOverrides}
          handleGoBack={() => {
            showResetValuesModal(false)
          }}
        />
      ) : null}
      {children}
    </>
  )
}
