import * as React from 'react'
import first from 'lodash/first'
import { Trans, useTranslation } from 'react-i18next'
import { Link, NavLink, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_BLOCK,
  Flex,
  Icon,
  Link as LinkComponent,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  JUSTIFY_FLEX_START,
  OVERFLOW_WRAP_ANYWHERE,
  PrimaryButton,
  ProtocolDeck,
  SPACING,
  SecondaryButton,
  StyledText,
  TYPOGRAPHY,
  useTooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { sortRuntimeParameters } from '@opentrons/shared-data'

import { useLogger } from '../../logger'
import { useFeatureFlag } from '../../redux/config'
import { OPENTRONS_USB } from '../../redux/discovery'
import { getStoredProtocols } from '../../redux/protocol-storage'
import { appShellRequestor } from '../../redux/shell/remote'
import { MultiSlideout } from '../../atoms/Slideout/MultiSlideout'
import { Tooltip } from '../../atoms/Tooltip'
import { ToggleButton } from '../../atoms/buttons'
import { InputField } from '../../atoms/InputField'
import { DropdownMenu } from '../../atoms/MenuList/DropdownMenu'
import { MiniCard } from '../../molecules/MiniCard'
import { UploadInput } from '../../molecules/UploadInput'
import { useTrackCreateProtocolRunEvent } from '../Devices/hooks'
import { useCreateRunFromProtocol } from '../ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol'
import { ApplyHistoricOffsets } from '../ApplyHistoricOffsets'
import { useOffsetCandidatesForAnalysis } from '../ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'
import { FileCard } from '../ChooseRobotSlideout/FileCard'
import { getRunTimeParameterValuesForRun } from '../Devices/utils'
import { getAnalysisStatus } from '../ProtocolsLanding/utils'

import type { DropdownOption } from '@opentrons/components'
import type { RunTimeParameter } from '@opentrons/shared-data'
import type { Robot } from '../../redux/discovery/types'
import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { State } from '../../redux/types'

export const CARD_OUTLINE_BORDER_STYLE = css`
  border-style: ${BORDERS.styleSolid};
  border-width: 1px;
  border-color: ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius4};
  &:hover {
    border-color: ${COLORS.grey55};
  }
`

const TOOLTIP_DELAY_MS = 2000

const _getFileBaseName = (filePath: string): string => {
  return filePath.split('/').reverse()[0]
}

interface ChooseProtocolSlideoutProps {
  robot: Robot
  onCloseClick: () => void
  showSlideout: boolean
}
export function ChooseProtocolSlideoutComponent(
  props: ChooseProtocolSlideoutProps
): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const history = useHistory()
  const logger = useLogger(new URL('', import.meta.url).pathname)
  const [targetProps, tooltipProps] = useTooltip()
  const [targetPropsHover, tooltipPropsHover] = useHoverTooltip()
  const [
    showRestoreValuesTooltip,
    setShowRestoreValuesTooltip,
  ] = React.useState<boolean>(false)

  const { robot, showSlideout, onCloseClick } = props
  const { name } = robot

  const [
    selectedProtocol,
    setSelectedProtocol,
  ] = React.useState<StoredProtocolData | null>(null)
  const [
    runTimeParametersOverrides,
    setRunTimeParametersOverrides,
  ] = React.useState<RunTimeParameter[]>([])
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [hasParamError, setHasParamError] = React.useState<boolean>(false)
  const [hasMissingFileParam, setHasMissingFileParam] = React.useState<boolean>(
    runTimeParametersOverrides?.some(
      parameter => parameter.type === 'csv_file'
    ) ?? false
  )
  const [isInputFocused, setIsInputFocused] = React.useState<boolean>(false)
  const enableCsvFile = useFeatureFlag('enableCsvFile')

  React.useEffect(() => {
    setRunTimeParametersOverrides(
      selectedProtocol?.mostRecentAnalysis?.runTimeParameters ?? []
    )
  }, [selectedProtocol])
  React.useEffect(() => {
    setHasParamError(errors.length > 0)
    setHasMissingFileParam(
      runTimeParametersOverrides.some(
        parameter =>
          parameter.type === 'csv_file' && parameter.file?.file == null
      )
    )
  }, [runTimeParametersOverrides])

  const runTimeParametersFromAnalysis =
    selectedProtocol?.mostRecentAnalysis?.runTimeParameters ?? []

  const hasRunTimeParameters = runTimeParametersFromAnalysis.length > 0

  const analysisStatus = getAnalysisStatus(
    false,
    selectedProtocol?.mostRecentAnalysis
  )
  const missingAnalysisData =
    analysisStatus === 'error' || analysisStatus === 'stale'

  const [shouldApplyOffsets, setShouldApplyOffsets] = React.useState(true)
  const offsetCandidates = useOffsetCandidatesForAnalysis(
    (!missingAnalysisData ? selectedProtocol?.mostRecentAnalysis : null) ??
      null,
    robot.ip
  )

  const srcFileObjects =
    selectedProtocol != null
      ? selectedProtocol.srcFiles.map((srcFileBuffer, index) => {
          const srcFilePath = selectedProtocol.srcFileNames[index]
          return new File([srcFileBuffer], _getFileBaseName(srcFilePath))
        })
      : []

  const { trackCreateProtocolRunEvent } = useTrackCreateProtocolRunEvent(
    selectedProtocol,
    name
  )

  const {
    createRunFromProtocolSource,
    runCreationError,
    isCreatingRun,
    reset: resetCreateRun,
    runCreationErrorCode,
  } = useCreateRunFromProtocol(
    {
      onSuccess: ({ data: runData }) => {
        trackCreateProtocolRunEvent({
          name: 'createProtocolRecordResponse',
          properties: { success: true },
        })
        history.push(`/devices/${name}/protocol-runs/${runData.id}`)
      },
      onError: (error: Error) => {
        trackCreateProtocolRunEvent({
          name: 'createProtocolRecordResponse',
          properties: { success: false, error: error.message },
        })
      },
    },
    { hostname: robot.ip },
    shouldApplyOffsets
      ? offsetCandidates.map(({ vector, location, definitionUri }) => ({
          vector,
          location,
          definitionUri,
        }))
      : [],
    getRunTimeParameterValuesForRun(runTimeParametersOverrides)
  )
  const handleProceed: React.MouseEventHandler<HTMLButtonElement> = () => {
    if (selectedProtocol != null) {
      trackCreateProtocolRunEvent({ name: 'createProtocolRecordRequest' })
      createRunFromProtocolSource({
        files: srcFileObjects,
        protocolKey: selectedProtocol.protocolKey,
      })
    } else {
      logger.warn('failed to create protocol, no protocol selected')
    }
  }

  const isRestoreDefaultsLinkEnabled =
    runTimeParametersOverrides?.some(parameter =>
      parameter.type === 'csv_file'
        ? parameter.file != null
        : parameter.value !== parameter.default
    ) ?? false

  const errors: string[] = []
  const runTimeParametersInputs =
    runTimeParametersOverrides != null
      ? sortRuntimeParameters(runTimeParametersOverrides).map(
          (runtimeParam, index) => {
            if ('choices' in runtimeParam) {
              const dropdownOptions = runtimeParam.choices.map(choice => {
                return { name: choice.displayName, value: choice.value }
              }) as DropdownOption[]
              return (
                <DropdownMenu
                  key={runtimeParam.variableName}
                  filterOptions={dropdownOptions}
                  currentOption={
                    dropdownOptions.find(choice => {
                      return choice.value === runtimeParam.value
                    }) ?? dropdownOptions[0]
                  }
                  onClick={choice => {
                    const clone = runTimeParametersOverrides.map(parameter => {
                      if (
                        runtimeParam.variableName === parameter.variableName &&
                        'choices' in parameter
                      ) {
                        return {
                          ...parameter,
                          value:
                            dropdownOptions.find(
                              option => option.value === choice
                            )?.value ?? parameter.default,
                        }
                      }
                      return parameter
                    })
                    setRunTimeParametersOverrides?.(clone)
                  }}
                  title={runtimeParam.displayName}
                  width="100%"
                  dropdownType="neutral"
                  tooltipText={runtimeParam.description}
                />
              )
            } else if (
              runtimeParam.type === 'int' ||
              runtimeParam.type === 'float'
            ) {
              const value = runtimeParam.value as number
              const id = `InputField_${runtimeParam.variableName}_${index}`
              const error =
                (Number.isNaN(value) && !isInputFocused) ||
                value < runtimeParam.min ||
                value > runtimeParam.max
                  ? t(`value_out_of_range`, {
                      min:
                        runtimeParam.type === 'int'
                          ? runtimeParam.min
                          : runtimeParam.min.toFixed(1),
                      max:
                        runtimeParam.type === 'int'
                          ? runtimeParam.max
                          : runtimeParam.max.toFixed(1),
                    })
                  : null
              if (error != null) {
                errors.push(error)
              }
              return (
                <InputField
                  key={runtimeParam.variableName}
                  type="number"
                  units={runtimeParam.suffix}
                  placeholder={runtimeParam.default.toString()}
                  value={value}
                  title={runtimeParam.displayName}
                  tooltipText={runtimeParam.description}
                  caption={
                    runtimeParam.type === 'int'
                      ? `${runtimeParam.min}-${runtimeParam.max}`
                      : `${runtimeParam.min.toFixed(
                          1
                        )}-${runtimeParam.max.toFixed(1)}`
                  }
                  id={id}
                  error={error}
                  onBlur={() => {
                    setIsInputFocused(false)
                  }}
                  onFocus={() => {
                    setIsInputFocused(true)
                  }}
                  onChange={e => {
                    const clone = runTimeParametersOverrides.map(parameter => {
                      if (
                        runtimeParam.variableName === parameter.variableName &&
                        (parameter.type === 'int' || parameter.type === 'float')
                      ) {
                        return {
                          ...parameter,
                          value:
                            runtimeParam.type === 'int'
                              ? Math.round(e.target.valueAsNumber)
                              : e.target.valueAsNumber,
                        }
                      }
                      return parameter
                    })
                    setRunTimeParametersOverrides?.(clone)
                  }}
                />
              )
            } else if (runtimeParam.type === 'bool') {
              return (
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  key={runtimeParam.variableName}
                >
                  <StyledText
                    as="label"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    paddingBottom={SPACING.spacing8}
                  >
                    {runtimeParam.displayName}
                  </StyledText>
                  <Flex
                    gridGap={SPACING.spacing8}
                    justifyContent={JUSTIFY_FLEX_START}
                    width="max-content"
                  >
                    <ToggleButton
                      toggledOn={runtimeParam.value as boolean}
                      onClick={() => {
                        const clone = runTimeParametersOverrides.map(
                          parameter => {
                            if (
                              runtimeParam.variableName ===
                                parameter.variableName &&
                              parameter.type === 'bool'
                            ) {
                              return {
                                ...parameter,
                                value: !parameter.value,
                              }
                            }
                            return parameter
                          }
                        )
                        setRunTimeParametersOverrides?.(clone)
                      }}
                      height="0.813rem"
                      label={
                        runtimeParam.value
                          ? t('protocol_details:on')
                          : t('protocol_details:off')
                      }
                      paddingTop={SPACING.spacing2} // manual alignment of SVG with value label
                    />
                    <StyledText as="p">
                      {runtimeParam.value
                        ? t('protocol_details:on')
                        : t('protocol_details:off')}
                    </StyledText>
                  </Flex>
                  <StyledText as="label" paddingTop={SPACING.spacing8}>
                    {runtimeParam.description}
                  </StyledText>
                </Flex>
              )
            } else if (runtimeParam.type === 'csv_file') {
              const error =
                runtimeParam.file?.file?.type === 'text/csv'
                  ? null
                  : t('protocol_details:csv_file_type_required')
              if (error != null) {
                errors.push(error)
              }
              return !enableCsvFile ? null : (
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  alignItems={ALIGN_CENTER}
                  gridgap={SPACING.spacing8}
                >
                  <Flex
                    flexDirection={DIRECTION_COLUMN}
                    gridGap={SPACING.spacing8}
                    width="100%"
                    marginBottom={SPACING.spacing16}
                  >
                    <StyledText
                      as="h3"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    >
                      {t('protocol_details:csv_file')}
                    </StyledText>
                    <StyledText as="p">
                      {t('protocol_details:csv_required')}
                    </StyledText>
                  </Flex>
                  {runtimeParam.file == null ? (
                    <UploadInput
                      uploadButtonText={t('protocol_details:choose_file')}
                      onUpload={(file: File) => {
                        const clone = runTimeParametersOverrides.map(
                          parameter => {
                            if (
                              runtimeParam.variableName ===
                              parameter.variableName
                            ) {
                              return {
                                ...parameter,
                                file: { file: file },
                              }
                            }
                            return parameter
                          }
                        )
                        setRunTimeParametersOverrides?.(clone)
                      }}
                      dragAndDropText={
                        <StyledText as="p">
                          <Trans
                            t={t}
                            i18nKey="shared:drag_and_drop"
                            components={{
                              a: (
                                <LinkComponent
                                  color={COLORS.blue55}
                                  role="button"
                                  to={''}
                                />
                              ),
                            }}
                          />
                        </StyledText>
                      }
                    />
                  ) : (
                    <FileCard
                      error={error}
                      fileRunTimeParameter={runtimeParam}
                      runTimeParametersOverrides={runTimeParametersOverrides}
                      setRunTimeParametersOverrides={
                        setRunTimeParametersOverrides
                      }
                    />
                  )}
                </Flex>
              )
            }
          }
        )
      : null

  const resetRunTimeParameters = (): void => {
    const clone = runTimeParametersOverrides.map(parameter =>
      parameter.type === 'csv_file'
        ? { ...parameter, file: null }
        : { ...parameter, value: parameter.default }
    )
    setRunTimeParametersOverrides(clone as RunTimeParameter[])
  }

  const pageTwoBody = (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing10}>
      <Flex justifyContent={JUSTIFY_END}>
        <LinkComponent
          textAlign={TYPOGRAPHY.textAlignRight}
          css={
            isRestoreDefaultsLinkEnabled ? ENABLED_LINK_CSS : DISABLED_LINK_CSS
          }
          onClick={() => {
            if (isRestoreDefaultsLinkEnabled) {
              resetRunTimeParameters?.()
            } else {
              setShowRestoreValuesTooltip(true)
              setTimeout(() => {
                setShowRestoreValuesTooltip(false)
              }, TOOLTIP_DELAY_MS)
            }
          }}
          paddingBottom={SPACING.spacing10}
          {...targetProps}
        >
          {t('protocol_details:restore_defaults')}
        </LinkComponent>
        <Tooltip
          tooltipProps={{
            ...tooltipProps,
            visible: showRestoreValuesTooltip,
          }}
          css={css`
            &:hover {
              cursor: auto;
            }
          `}
        >
          {t('protocol_details:no_custom_values')}
        </Tooltip>{' '}
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        {runTimeParametersInputs}
      </Flex>
    </Flex>
  )

  const singlePageFooter = (
    <PrimaryButton
      onClick={handleProceed}
      disabled={isCreatingRun || selectedProtocol == null}
      width="100%"
    >
      {isCreatingRun ? (
        <Icon name="ot-spinner" spin size="1rem" />
      ) : (
        t('shared:proceed_to_setup')
      )}
    </PrimaryButton>
  )

  const multiPageFooter =
    currentPage === 1 ? (
      <PrimaryButton
        onClick={() => {
          setCurrentPage(2)
        }}
        width="100%"
        disabled={isCreatingRun || selectedProtocol == null}
      >
        {t('shared:continue_to_param')}
      </PrimaryButton>
    ) : (
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_ROW}>
        <SecondaryButton
          onClick={() => {
            setCurrentPage(1)
          }}
          width="51%"
        >
          {t('shared:change_protocol')}
        </SecondaryButton>
        <PrimaryButton
          width="49%"
          onClick={handleProceed}
          disabled={hasParamError}
          {...targetPropsHover}
        >
          {isCreatingRun ? (
            <Icon name="ot-spinner" spin size="1rem" />
          ) : (
            t('shared:confirm_values')
          )}
        </PrimaryButton>
        {hasMissingFileParam ? (
          <Tooltip tooltipProps={tooltipPropsHover}>
            {t('protocol_details:add_required_csv_file')}
          </Tooltip>
        ) : null}
      </Flex>
    )

  return (
    <MultiSlideout
      isExpanded={showSlideout}
      onCloseClick={() => {
        onCloseClick()
        setCurrentPage(1)
        resetRunTimeParameters()
      }}
      currentStep={currentPage}
      maxSteps={hasRunTimeParameters ? 2 : 1}
      title={t('choose_protocol_to_run', { name })}
      footer={
        <ApiHostProvider
          hostname={robot.ip}
          requestor={
            robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined
          }
        >
          {currentPage === 1 ? (
            <ApplyHistoricOffsets
              offsetCandidates={offsetCandidates}
              shouldApplyOffsets={shouldApplyOffsets}
              setShouldApplyOffsets={setShouldApplyOffsets}
              commands={
                (!missingAnalysisData
                  ? selectedProtocol?.mostRecentAnalysis?.commands
                  : []) ?? []
              }
              labware={
                (!missingAnalysisData
                  ? selectedProtocol?.mostRecentAnalysis?.labware
                  : []) ?? []
              }
              modules={
                (!missingAnalysisData
                  ? selectedProtocol?.mostRecentAnalysis?.modules
                  : []) ?? []
              }
            />
          ) : null}
          {hasRunTimeParameters ? multiPageFooter : singlePageFooter}
        </ApiHostProvider>
      }
    >
      {showSlideout ? (
        currentPage === 1 ? (
          <StoredProtocolList
            handleSelectProtocol={storedProtocol => {
              if (!isCreatingRun) {
                resetCreateRun()
                setSelectedProtocol(storedProtocol)
              }
            }}
            robot={robot}
            {...{ selectedProtocol, runCreationError, runCreationErrorCode }}
          />
        ) : (
          pageTwoBody
        )
      ) : null}
    </MultiSlideout>
  )
}

export function ChooseProtocolSlideout(
  props: ChooseProtocolSlideoutProps
): JSX.Element | null {
  return <ChooseProtocolSlideoutComponent {...props} />
}

interface StoredProtocolListProps {
  selectedProtocol: StoredProtocolData | null
  handleSelectProtocol: (storedProtocol: StoredProtocolData | null) => void
  runCreationError: string | null
  runCreationErrorCode: number | null
  robot: Robot
}

function StoredProtocolList(props: StoredProtocolListProps): JSX.Element {
  const {
    selectedProtocol,
    handleSelectProtocol,
    runCreationError,
    runCreationErrorCode,
    robot,
  } = props
  const { t } = useTranslation(['device_details', 'protocol_details', 'shared'])
  const storedProtocols = useSelector((state: State) =>
    getStoredProtocols(state)
  ).filter(
    protocol => protocol.mostRecentAnalysis?.robotType === robot.robotModel
  )
  React.useEffect(() => {
    handleSelectProtocol(first(storedProtocols) ?? null)
  }, [])

  return storedProtocols.length > 0 ? (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      {storedProtocols.map(storedProtocol => {
        const isSelected =
          selectedProtocol != null &&
          storedProtocol.protocolKey === selectedProtocol.protocolKey
        const analysisStatus = getAnalysisStatus(
          false,
          storedProtocol.mostRecentAnalysis
        )
        const missingAnalysisData =
          analysisStatus === 'error' || analysisStatus === 'stale'
        return (
          <React.Fragment key={storedProtocol.protocolKey}>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <MiniCard
                isSelected={isSelected}
                isError={runCreationError != null}
                isWarning={missingAnalysisData}
                onClick={() => {
                  handleSelectProtocol(storedProtocol)
                }}
              >
                <Box
                  display="grid"
                  gridTemplateColumns="1fr 3fr"
                  marginRight={SPACING.spacing16}
                >
                  {!missingAnalysisData ? (
                    <Box
                      marginY={SPACING.spacingAuto}
                      backgroundColor={isSelected ? COLORS.white : 'inherit'}
                      marginRight={SPACING.spacing16}
                      height="4.25rem"
                      width="4.75rem"
                    >
                      <ProtocolDeck
                        protocolAnalysis={storedProtocol.mostRecentAnalysis}
                      />
                    </Box>
                  ) : (
                    <Box
                      height="4.25rem"
                      width="4.75rem"
                      marginRight={SPACING.spacing16}
                      backgroundColor={COLORS.grey30}
                      borderRadius={SPACING.spacing8}
                    />
                  )}
                  <StyledText
                    as="p"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    overflowWrap={OVERFLOW_WRAP_ANYWHERE}
                  >
                    {storedProtocol.mostRecentAnalysis?.metadata
                      ?.protocolName ??
                      first(storedProtocol.srcFileNames) ??
                      storedProtocol.protocolKey}
                  </StyledText>
                </Box>
                {(runCreationError != null || missingAnalysisData) &&
                isSelected ? (
                  <>
                    <Box flex="1 1 auto" />
                    <Icon
                      name="alert-circle"
                      size="1.25rem"
                      color={
                        runCreationError != null
                          ? COLORS.red50
                          : COLORS.yellow50
                      }
                    />
                  </>
                ) : null}
              </MiniCard>
            </Flex>
            {runCreationError != null && isSelected ? (
              <StyledText
                as="label"
                color={COLORS.red60}
                overflowWrap={OVERFLOW_WRAP_ANYWHERE}
                display={DISPLAY_BLOCK}
                marginTop={`-${SPACING.spacing8}`}
                marginBottom={SPACING.spacing8}
              >
                {runCreationErrorCode === 409 ? (
                  <Trans
                    t={t}
                    i18nKey="shared:robot_is_busy_no_protocol_run_allowed"
                    components={{
                      robotLink: (
                        <NavLink
                          css={css`
                            color: ${COLORS.red60};
                            text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
                          `}
                          to={`/devices/${robot.name}`}
                        />
                      ),
                    }}
                  />
                ) : (
                  runCreationError
                )}
              </StyledText>
            ) : null}
            {missingAnalysisData && isSelected ? (
              <StyledText
                as="label"
                color={COLORS.yellow60}
                overflowWrap="anywhere"
                display={DISPLAY_BLOCK}
                marginTop={`-${SPACING.spacing8}`}
                marginBottom={SPACING.spacing8}
              >
                {analysisStatus === 'stale'
                  ? t('protocol_analysis_stale')
                  : t('protocol_analysis_failed')}
                {
                  <Trans
                    t={t}
                    i18nKey="protocol_details_page_reanalyze"
                    components={{
                      navlink: (
                        <Link
                          to="/protocols"
                          css={css`
                            color: ${COLORS.yellow60};
                            text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
                          `}
                        />
                      ),
                    }}
                  />
                }
              </StyledText>
            ) : null}
          </React.Fragment>
        )
      })}
    </Flex>
  ) : (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      minHeight="11rem"
      padding={SPACING.spacing16}
      css={css`
        ${CARD_OUTLINE_BORDER_STYLE}
        &:hover {
          border-color: ${COLORS.grey30};
        }
      `}
    >
      <Icon size="1.25rem" name="alert-circle" color={COLORS.grey30} />
      <StyledText
        as="p"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        marginTop={SPACING.spacing8}
        role="heading"
      >
        {t('no_protocols_found')}
      </StyledText>
      <StyledText
        as="p"
        marginTop={SPACING.spacing8}
        textAlign={TYPOGRAPHY.textAlignCenter}
      >
        <Trans
          t={t}
          i18nKey="to_run_protocol_go_to_protocols_page"
          components={{
            navlink: <Link to="/protocols" css={TYPOGRAPHY.linkPSemiBold} />,
          }}
        />
      </StyledText>
    </Flex>
  )
}

const ENABLED_LINK_CSS = css`
  ${TYPOGRAPHY.linkPSemiBold}
  cursor: pointer;
`

const DISABLED_LINK_CSS = css`
  ${TYPOGRAPHY.linkPSemiBold}
  color: ${COLORS.grey40};
  cursor: default;

  &:hover {
    color: ${COLORS.grey40};
  }
`
