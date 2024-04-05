import * as React from 'react'
import first from 'lodash/first'
import { Trans, useTranslation } from 'react-i18next'
import { Link, NavLink, useHistory } from 'react-router-dom'
import { ApiHostProvider } from '@opentrons/react-api-client'
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
  DropdownOption,
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
  useHoverTooltip,
} from '@opentrons/components'

import { useLogger } from '../../logger'
import { OPENTRONS_USB } from '../../redux/discovery'
import { getStoredProtocols } from '../../redux/protocol-storage'
import { appShellRequestor } from '../../redux/shell/remote'
import { useFeatureFlag } from '../../redux/config'
import { MultiSlideout } from '../../atoms/Slideout/MultiSlideout'
import { Tooltip } from '../../atoms/Tooltip'
import { ToggleButton } from '../../atoms/buttons'
import { InputField } from '../../atoms/InputField'
import { DropdownMenu } from '../../atoms/MenuList/DropdownMenu'
import { MiniCard } from '../../molecules/MiniCard'
import { useTrackCreateProtocolRunEvent } from '../Devices/hooks'
import { useCreateRunFromProtocol } from '../ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol'
import { ApplyHistoricOffsets } from '../ApplyHistoricOffsets'
import { useOffsetCandidatesForAnalysis } from '../ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'
import { getAnalysisStatus } from '../ProtocolsLanding/utils'
import type { RunTimeParameterCreateData } from '@opentrons/api-client'
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
  const [targetProps, tooltipProps] = useHoverTooltip()

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
  const enableRunTimeParametersFF = useFeatureFlag('enableRunTimeParameters')

  React.useEffect(() => {
    setRunTimeParametersOverrides(
      selectedProtocol?.mostRecentAnalysis?.runTimeParameters ?? []
    )
  }, [selectedProtocol])
  React.useEffect(() => {
    setHasParamError(errors.length > 0)
  }, [runTimeParametersOverrides])

  const runTimeParametersFromAnalysis =
    selectedProtocol?.mostRecentAnalysis?.runTimeParameters ?? []

  const hasRunTimeParameters =
    enableRunTimeParametersFF && runTimeParametersFromAnalysis.length > 0

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
    runTimeParametersOverrides.reduce<RunTimeParameterCreateData>(
      (acc, param) =>
        param.value !== param.default
          ? { ...acc, [param.variableName]: param.value }
          : acc,
      {}
    )
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
    runTimeParametersOverrides?.some(
      parameter => parameter.value !== parameter.default
    ) ?? false

  const errors: string[] = []
  const runTimeParametersInputs =
    runTimeParametersOverrides?.map((runtimeParam, index) => {
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
              const clone = runTimeParametersOverrides.map((parameter, i) => {
                if (i === index) {
                  return {
                    ...parameter,
                    value:
                      dropdownOptions.find(option => option.value === choice)
                        ?.value ?? parameter.default,
                  }
                }
                return parameter
              })
              setRunTimeParametersOverrides(clone)
            }}
            title={runtimeParam.displayName}
            caption={runtimeParam.description}
            width="100%"
            dropdownType="neutral"
          />
        )
      } else if (runtimeParam.type === 'int' || runtimeParam.type === 'float') {
        const value = runtimeParam.value as number
        const id = `InputField_${runtimeParam.variableName}_${index.toString()}`
        const error =
          Number.isNaN(value) ||
          value < runtimeParam.min ||
          value > runtimeParam.max
            ? t(`protocol_details:value_out_of_range`, {
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
            placeholder={value.toString()}
            value={value}
            title={runtimeParam.displayName}
            tooltipText={runtimeParam.description}
            caption={`${runtimeParam.min}-${runtimeParam.max}`}
            id={id}
            error={error}
            onChange={e => {
              const clone = runTimeParametersOverrides.map((parameter, i) => {
                if (i === index) {
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
              setRunTimeParametersOverrides(clone)
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
                    (parameter, i) => {
                      if (i === index) {
                        return {
                          ...parameter,
                          value: !parameter.value,
                        }
                      }
                      return parameter
                    }
                  )
                  setRunTimeParametersOverrides(clone)
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
      }
    }) ?? null

  const pageTwoBody = (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_END}>
        <LinkComponent
          textAlign={TYPOGRAPHY.textAlignRight}
          css={
            isRestoreDefaultsLinkEnabled ? ENABLED_LINK_CSS : DISABLED_LINK_CSS
          }
          onClick={() => {
            const clone = runTimeParametersOverrides.map(parameter => ({
              ...parameter,
              value: parameter.default,
            }))
            setRunTimeParametersOverrides(clone)
          }}
          paddingBottom={SPACING.spacing10}
          {...targetProps}
        >
          {t('protocol_details:restore_defaults')}
        </LinkComponent>
        {!isRestoreDefaultsLinkEnabled && (
          <Tooltip tooltipProps={tooltipProps}>
            {t('protocol_details:no_custom_values')}
          </Tooltip>
        )}
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
        onClick={() => setCurrentPage(2)}
        width="100%"
        disabled={isCreatingRun || selectedProtocol == null}
      >
        {t('shared:continue_to_param')}
      </PrimaryButton>
    ) : (
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_ROW}>
        <SecondaryButton onClick={() => setCurrentPage(1)} width="51%">
          {t('shared:change_protocol')}
        </SecondaryButton>
        <PrimaryButton
          width="49%"
          onClick={handleProceed}
          disabled={hasParamError}
        >
          {isCreatingRun ? (
            <Icon name="ot-spinner" spin size="1rem" />
          ) : (
            t('shared:confirm_values')
          )}
        </PrimaryButton>
      </Flex>
    )

  return (
    <MultiSlideout
      isExpanded={showSlideout}
      onCloseClick={onCloseClick}
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
            robotName={robot.name}
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
  robotName: string
}

function StoredProtocolList(props: StoredProtocolListProps): JSX.Element {
  const {
    selectedProtocol,
    handleSelectProtocol,
    runCreationError,
    runCreationErrorCode,
    robotName,
  } = props
  const { t } = useTranslation(['device_details', 'protocol_details', 'shared'])
  const storedProtocols = useSelector((state: State) =>
    getStoredProtocols(state)
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
                onClick={() => handleSelectProtocol(storedProtocol)}
              >
                <Box display="grid" gridTemplateColumns="1fr 3fr">
                  <Box
                    marginY={SPACING.spacingAuto}
                    backgroundColor={isSelected ? COLORS.white : 'inherit'}
                    marginRight={SPACING.spacing16}
                    height="4.25rem"
                    width="4.75rem"
                  >
                    {!missingAnalysisData ? (
                      <ProtocolDeck
                        protocolAnalysis={storedProtocol.mostRecentAnalysis}
                      />
                    ) : null}
                  </Box>
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
                          to={`/devices/${robotName}`}
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
