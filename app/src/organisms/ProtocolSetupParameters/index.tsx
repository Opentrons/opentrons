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
import {
  formatRunTimeParameterValue,
  sortRuntimeParameters,
} from '@opentrons/shared-data'

import { ProtocolSetupStep } from '../../pages/ProtocolSetup'
import { getRunTimeParameterValuesForRun } from '../Devices/utils'
import { ChildNavigation } from '../ChildNavigation'
import { ResetValuesModal } from './ResetValuesModal'
import { ChooseEnum } from './ChooseEnum'
import { ChooseNumber } from './ChooseNumber'
import { ChooseCsvFile } from './ChooseCsvFile'
import { useFeatureFlag } from '../../redux/config'
import { useToaster } from '../ToasterOven'

import type {
  CompletedProtocolAnalysis,
  ChoiceParameter,
  CsvFileParameter,
  NumberParameter,
  RunTimeParameter,
  ValueRunTimeParameter,
} from '@opentrons/shared-data'
import type { LabwareOffsetCreateData } from '@opentrons/api-client'

interface ProtocolSetupParametersProps {
  protocolId: string
  runTimeParameters: RunTimeParameter[]
  labwareOffsets?: LabwareOffsetCreateData[]
  mostRecentAnalysis?: CompletedProtocolAnalysis | null
}

export function ProtocolSetupParameters({
  protocolId,
  labwareOffsets,
  runTimeParameters,
  mostRecentAnalysis,
}: ProtocolSetupParametersProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const enableCsvFile = useFeatureFlag('enableCsvFile')
  const history = useHistory()
  const host = useHost()
  const queryClient = useQueryClient()
  const [
    chooseValueScreen,
    setChooseValueScreen,
  ] = React.useState<ChoiceParameter | null>(null)
  const [
    showNumericalInputScreen,
    setShowNumericalInputScreen,
  ] = React.useState<NumberParameter | null>(null)
  const [
    chooseCsvFileScreen,
    setChooseCsvFileScreen,
  ] = React.useState<CsvFileParameter | null>(null)
  const [resetValuesModal, showResetValuesModal] = React.useState<boolean>(
    false
  )
  const [startSetup, setStartSetup] = React.useState<boolean>(false)
  const [
    runTimeParametersOverrides,
    setRunTimeParametersOverrides,
  ] = React.useState<RunTimeParameter[]>(
    runTimeParameters.map(parameter =>
      parameter.type === 'csv_file'
        ? { ...parameter, file: null }
        : // TODO (nd: 06/13/2024) create individual ChoiceParameter types for correct narrowing
          // eslint-disable-next-line
          ({ ...parameter, value: parameter.default } as ValueRunTimeParameter)
    )
  )
  const { makeSnackbar } = useToaster()

  const csvFileParameter = runTimeParameters.find(
    (param): param is CsvFileParameter => param.type === 'csv_file'
  )
  const initialFileId: string = csvFileParameter?.file?.id ?? ''
  const [csvFileInfo, setCSVFileInfo] = React.useState<string>(initialFileId)

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
    setRunTimeParametersOverrides(updatedParameters as RunTimeParameter[])
    if (chooseValueScreen && chooseValueScreen.variableName === variableName) {
      const updatedParameter = updatedParameters.find(
        parameter => parameter.variableName === variableName
      )
      if (updatedParameter != null && 'choices' in updatedParameter) {
        setChooseValueScreen(updatedParameter as ChoiceParameter)
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
    if (
      chooseCsvFileScreen &&
      chooseCsvFileScreen.variableName === variableName
    ) {
      const updatedParameter = updatedParameters.find(
        parameter => parameter.variableName === variableName
      )
      if (updatedParameter != null && updatedParameter.type === 'csv_file') {
        setChooseCsvFileScreen(updatedParameter as CsvFileParameter)
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
    if (
      enableCsvFile &&
      mostRecentAnalysis?.result === 'parameter-value-required'
    ) {
      makeSnackbar(t('protocol_requires_csv') as string)
    } else {
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
      console.error('error: bad param. not expected to reach this')
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
        ariaDisabled={
          enableCsvFile &&
          mostRecentAnalysis?.result === 'parameter-value-required'
        }
        buttonIsDisabled={
          enableCsvFile &&
          mostRecentAnalysis?.result === 'parameter-value-required'
        }
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
        {sortRuntimeParameters(runTimeParametersOverrides).map(
          (parameter, index) => {
            const detailLabelForCsv =
              mostRecentAnalysis?.result === 'parameter-value-required'
                ? t('required')
                : parameter.displayName

            let setupStatus: 'ready' | 'not ready' | 'general' | 'inform' =
              'inform'
            if (
              enableCsvFile &&
              parameter.type === 'csv_file' &&
              mostRecentAnalysis?.result === 'parameter-value-required'
            ) {
              setupStatus = 'not ready'
            }
            if (
              enableCsvFile &&
              parameter.type === 'csv_file' &&
              mostRecentAnalysis?.result === 'ok'
            ) {
              setupStatus = 'ready'
            }
            return (
              <React.Fragment key={`${parameter.displayName}_${index}`}>
                <ProtocolSetupStep
                  hasRightIcon={!(parameter.type === 'bool')}
                  hasLeftIcon={false}
                  status={setupStatus}
                  title={
                    parameter.type === 'csv_file'
                      ? t('csv_file')
                      : parameter.displayName
                  }
                  onClickSetupStep={() => {
                    handleSetParameter(parameter)
                  }}
                  detail={
                    enableCsvFile && parameter.type === 'csv_file'
                      ? detailLabelForCsv
                      : formatRunTimeParameterValue(parameter, t)
                  }
                  description={
                    parameter.type === 'csv_file' ? null : parameter.description
                  }
                  fontSize="h4"
                  disabled={startSetup}
                />
              </React.Fragment>
            )
          }
        )}
      </Flex>
    </>
  )

  // ToDo (kk:06/18/2024) ff will be removed when we freeze the code
  if (enableCsvFile && chooseCsvFileScreen != null) {
    children = (
      <ChooseCsvFile
        protocolId={protocolId}
        handleGoBack={() => {
          setChooseCsvFileScreen(null)
        }}
        parameter={chooseCsvFileScreen}
        setParameter={updateParameters}
        csvFileInfo={csvFileInfo}
        setCsvFileInfo={setCSVFileInfo}
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
