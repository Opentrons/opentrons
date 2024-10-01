import { useState, useReducer, useEffect, Fragment } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Banner,
  BORDERS,
  COLORS,
  CURSOR_AUTO,
  CURSOR_DEFAULT,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_INLINE_BLOCK,
  DropdownMenu,
  Flex,
  Icon,
  InputField,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  JUSTIFY_FLEX_START,
  LegacyStyledText,
  Link,
  OVERFLOW_WRAP_ANYWHERE,
  SIZE_1,
  SIZE_4,
  SPACING,
  Tooltip,
  TYPOGRAPHY,
  useTooltip,
} from '@opentrons/components'

import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  sortRuntimeParameters,
} from '@opentrons/shared-data'
import {
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  getScanning,
  startDiscovery,
  RE_ROBOT_MODEL_OT2,
  RE_ROBOT_MODEL_OT3,
} from '/app/redux/discovery'
import { Slideout } from '/app/atoms/Slideout'
import { MultiSlideout } from '/app/atoms/Slideout/MultiSlideout'
import { ToggleButton } from '/app/atoms/buttons'
import { AvailableRobotOption } from './AvailableRobotOption'
import { UploadInput } from '/app/molecules/UploadInput'
import { FileCard } from './FileCard'

import type { RobotType, RunTimeParameter } from '@opentrons/shared-data'
import type { DropdownOption } from '@opentrons/components'
import type { SlideoutProps } from '/app/atoms/Slideout'
import type { UseCreateRun } from '/app/organisms/Desktop/ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol'
import type { State, Dispatch } from '/app/redux/types'
import type { Robot } from '/app/redux/discovery/types'

export const CARD_OUTLINE_BORDER_STYLE = css`
  border-style: ${BORDERS.styleSolid};
  border-width: 1px;
  border-color: ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius8};
  &:hover {
    border-color: ${COLORS.grey55};
  }
`

const TOOLTIP_DELAY_MS = 2000

interface RobotIsBusyAction {
  type: 'robotIsBusy'
  robotName: string
}

interface RobotIsIdleAction {
  type: 'robotIsIdle'
  robotName: string
}

interface RobotBusyStatusByName {
  [robotName: string]: boolean
}

export type RobotBusyStatusAction = RobotIsBusyAction | RobotIsIdleAction

function robotBusyStatusByNameReducer(
  state: RobotBusyStatusByName,
  action: RobotBusyStatusAction
): RobotBusyStatusByName {
  switch (action.type) {
    case 'robotIsBusy': {
      return {
        ...state,
        [action.robotName]: true,
      }
    }
    case 'robotIsIdle': {
      return {
        ...state,
        [action.robotName]: false,
      }
    }
  }
}

interface ChooseRobotSlideoutProps
  extends Omit<SlideoutProps, 'children'>,
    Partial<UseCreateRun> {
  isSelectedRobotOnDifferentSoftwareVersion: boolean
  robotType: RobotType | null
  selectedRobot: Robot | null
  setSelectedRobot: (robot: Robot | null) => void
  runTimeParametersOverrides?: RunTimeParameter[]
  setRunTimeParametersOverrides?: (parameters: RunTimeParameter[]) => void
  isAnalysisError?: boolean
  isAnalysisStale?: boolean
  showIdleOnly?: boolean
  multiSlideout?: { currentPage: number } | null
  setHasParamError?: (isError: boolean) => void
  resetRunTimeParameters?: () => void
  setHasMissingFileParam?: (isMissing: boolean) => void
}

export function ChooseRobotSlideout(
  props: ChooseRobotSlideoutProps
): JSX.Element {
  const { t } = useTranslation(['protocol_details', 'shared', 'app_settings'])
  const {
    isExpanded,
    onCloseClick,
    title,
    footer,
    isAnalysisError = false,
    isAnalysisStale = false,
    isCreatingRun = false,
    isSelectedRobotOnDifferentSoftwareVersion,
    reset: resetCreateRun,
    runCreationError,
    runCreationErrorCode,
    selectedRobot,
    setSelectedRobot,
    robotType,
    showIdleOnly = false,
    multiSlideout = null,
    runTimeParametersOverrides,
    setRunTimeParametersOverrides,
    setHasParamError,
    resetRunTimeParameters,
    setHasMissingFileParam,
  } = props

  const dispatch = useDispatch<Dispatch>()
  const isScanning = useSelector((state: State) => getScanning(state))
  const [targetProps, tooltipProps] = useTooltip()
  const [
    showRestoreValuesTooltip,
    setShowRestoreValuesTooltip,
  ] = useState<boolean>(false)
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)

  const unhealthyReachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  ).filter(robot => {
    if (robotType === FLEX_ROBOT_TYPE) {
      return RE_ROBOT_MODEL_OT3.test(robot.robotModel)
    } else if (robotType === OT2_ROBOT_TYPE) {
      return RE_ROBOT_MODEL_OT2.test(robot.robotModel)
    } else {
      return true
    }
  })
  const unreachableRobots = useSelector((state: State) =>
    getUnreachableRobots(state)
  ).filter(robot => {
    if (robotType === FLEX_ROBOT_TYPE) {
      return RE_ROBOT_MODEL_OT3.test(robot.robotModel)
    } else if (robotType === OT2_ROBOT_TYPE) {
      return RE_ROBOT_MODEL_OT2.test(robot.robotModel)
    } else {
      return true
    }
  })
  const healthyReachableRobots = useSelector((state: State) =>
    getConnectableRobots(state)
  ).filter(robot => {
    if (robotType === FLEX_ROBOT_TYPE) {
      return robot.robotModel === FLEX_ROBOT_TYPE
    } else if (robotType === OT2_ROBOT_TYPE) {
      return robot.robotModel === OT2_ROBOT_TYPE
    } else {
      return true
    }
  })

  const [robotBusyStatusByName, registerRobotBusyStatus] = useReducer(
    robotBusyStatusByNameReducer,
    {}
  )

  const reducerAvailableRobots = healthyReachableRobots.filter(robot =>
    showIdleOnly ? !robotBusyStatusByName[robot.name] : robot
  )
  const reducerBusyCount = healthyReachableRobots.filter(
    robot => robotBusyStatusByName[robot.name]
  ).length

  // this useEffect sets the default selection to the first robot in the list. state is managed by the caller
  useEffect(() => {
    if (
      (selectedRobot == null ||
        !reducerAvailableRobots.some(
          robot => robot.name === selectedRobot.name
        )) &&
      reducerAvailableRobots.length > 0
    ) {
      setSelectedRobot(reducerAvailableRobots[0])
    } else if (reducerAvailableRobots.length === 0) {
      setSelectedRobot(null)
    }
  }, [reducerAvailableRobots, selectedRobot, setSelectedRobot])

  const unavailableCount =
    unhealthyReachableRobots.length + unreachableRobots.length

  const pageOneBody = (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      {isAnalysisError ? (
        <Banner type="warning">{t('protocol_failed_app_analysis')}</Banner>
      ) : null}
      {isAnalysisStale ? (
        <Banner type="warning">{t('protocol_outdated_app_analysis')}</Banner>
      ) : null}
      <Flex alignSelf={ALIGN_FLEX_END} marginY={SPACING.spacing4}>
        {isScanning ? (
          <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
            <LegacyStyledText
              as="p"
              color={COLORS.grey60}
              marginRight={SPACING.spacing12}
            >
              {t('app_settings:searching')}
            </LegacyStyledText>
            <Icon name="ot-spinner" spin size="1.25rem" color={COLORS.grey60} />
          </Flex>
        ) : (
          <Link
            onClick={() => dispatch(startDiscovery())}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            role="button"
            css={TYPOGRAPHY.linkPSemiBold}
          >
            {t('shared:refresh')}
          </Link>
        )}
      </Flex>
      {!isScanning && healthyReachableRobots.length === 0 ? (
        <Flex
          css={css`
            ${CARD_OUTLINE_BORDER_STYLE}
            &:hover {
              border-color: ${COLORS.grey30};
            }
          `}
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          height={SIZE_4}
          gridGap={SPACING.spacing8}
        >
          <Icon name="alert-circle" size={SIZE_1} />
          <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('no_available_robots_found')}
          </LegacyStyledText>
        </Flex>
      ) : (
        healthyReachableRobots.map(robot => {
          const isSelected =
            selectedRobot != null && selectedRobot.ip === robot.ip
          return (
            <Fragment key={robot.ip}>
              <AvailableRobotOption
                robot={robot}
                onClick={() => {
                  if (!isCreatingRun) {
                    resetCreateRun?.()
                    setSelectedRobot(robot)
                  }
                }}
                isError={runCreationError != null}
                isSelected={isSelected}
                isSelectedRobotOnDifferentSoftwareVersion={
                  isSelectedRobotOnDifferentSoftwareVersion
                }
                showIdleOnly={showIdleOnly}
                registerRobotBusyStatus={registerRobotBusyStatus}
              />
              {runCreationError != null && isSelected && (
                <LegacyStyledText
                  as="label"
                  color={COLORS.red60}
                  overflowWrap={OVERFLOW_WRAP_ANYWHERE}
                  display={DISPLAY_INLINE_BLOCK}
                  marginTop={`-${SPACING.spacing4}`}
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
                </LegacyStyledText>
              )}
            </Fragment>
          )
        })
      )}
      {!isScanning && unavailableCount > 0 ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          textAlign={TYPOGRAPHY.textAlignCenter}
          marginTop={SPACING.spacing24}
        >
          <LegacyStyledText as="p" color={COLORS.grey50}>
            {showIdleOnly
              ? t('unavailable_or_busy_robot_not_listed', {
                  count: unavailableCount + reducerBusyCount,
                })
              : t('unavailable_robot_not_listed', {
                  count: unavailableCount,
                })}
          </LegacyStyledText>
          <NavLink to="/devices" css={TYPOGRAPHY.linkPSemiBold}>
            {t('view_unavailable_robots')}
          </NavLink>
        </Flex>
      ) : null}
    </Flex>
  )

  const errors: string[] = []
  const runTimeParameters =
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
                    setRunTimeParametersOverrides?.(clone as RunTimeParameter[])
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
                errors.push(error as string)
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
                  <LegacyStyledText
                    as="label"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    paddingBottom={SPACING.spacing8}
                  >
                    {runtimeParam.displayName}
                  </LegacyStyledText>
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
                                value: !Boolean(parameter.value),
                              }
                            }
                            return parameter
                          }
                        )
                        setRunTimeParametersOverrides?.(clone)
                      }}
                      height="0.813rem"
                      label={Boolean(runtimeParam.value) ? t('on') : t('off')}
                      paddingTop={SPACING.spacing2} // manual alignment of SVG with value label
                    />
                    <LegacyStyledText as="p">
                      {Boolean(runtimeParam.value) ? t('on') : t('off')}
                    </LegacyStyledText>
                  </Flex>
                  <LegacyStyledText as="label" paddingTop={SPACING.spacing8}>
                    {runtimeParam.description}
                  </LegacyStyledText>
                </Flex>
              )
            } else if (runtimeParam.type === 'csv_file') {
              if (runtimeParam.file?.file != null) {
                setHasMissingFileParam?.(false)
              }
              const error =
                runtimeParam.file?.file?.type === 'text/csv'
                  ? null
                  : t('csv_file_type_required')
              if (error != null) {
                errors.push(error as string)
              }
              return (
                <Flex
                  key={runtimeParam.variableName}
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
                    <LegacyStyledText
                      as="h3"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    >
                      {t('csv_file')}
                    </LegacyStyledText>
                  </Flex>
                  {runtimeParam.file == null ? (
                    <UploadInput
                      uploadButtonText={t('choose_file')}
                      onUpload={(file: File) => {
                        const clone = runTimeParametersOverrides.map(
                          parameter => {
                            if (
                              runtimeParam.variableName ===
                              parameter.variableName
                            ) {
                              return {
                                ...parameter,
                                file: { file },
                              }
                            }
                            return parameter
                          }
                        )
                        setRunTimeParametersOverrides?.(clone)
                      }}
                      dragAndDropText={
                        <LegacyStyledText as="p">
                          <Trans
                            t={t}
                            i18nKey="shared:drag_and_drop"
                            components={{
                              a: <Link color={COLORS.blue55} role="button" />,
                            }}
                          />
                        </LegacyStyledText>
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

  const hasEmptyRtpFile =
    runTimeParametersOverrides?.some(
      runtimeParam =>
        runtimeParam.type === 'csv_file' && runtimeParam.file == null
    ) ?? false
  setHasParamError?.(errors.length > 0 || hasEmptyRtpFile)

  const isRestoreDefaultsLinkEnabled =
    runTimeParametersOverrides?.some(parameter => {
      return parameter.type === 'csv_file'
        ? parameter.file != null
        : parameter.value !== parameter.default
    }) ?? false

  const pageTwoBody =
    runTimeParametersOverrides != null ? (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing10}>
        <Flex justifyContent={JUSTIFY_END}>
          <Link
            textAlign={TYPOGRAPHY.textAlignRight}
            css={
              isRestoreDefaultsLinkEnabled
                ? ENABLED_LINK_CSS
                : DISABLED_LINK_CSS
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
            {t('restore_defaults')}
          </Link>
          <Tooltip
            tooltipProps={{
              ...tooltipProps,
              visible: showRestoreValuesTooltip,
            }}
            css={css`
              &:hover {
                cursor: ${CURSOR_AUTO};
              }
            `}
          >
            {t('no_custom_values')}
          </Tooltip>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          {runTimeParameters}
        </Flex>
      </Flex>
    ) : null

  return multiSlideout != null ? (
    <MultiSlideout
      isExpanded={isExpanded}
      onCloseClick={onCloseClick}
      title={title}
      footer={footer}
      currentStep={multiSlideout.currentPage}
      maxSteps={2}
    >
      {multiSlideout.currentPage === 1 ? pageOneBody : pageTwoBody}
    </MultiSlideout>
  ) : (
    <Slideout
      isExpanded={isExpanded}
      onCloseClick={onCloseClick}
      title={title}
      footer={footer}
    >
      {pageOneBody}
    </Slideout>
  )
}

const ENABLED_LINK_CSS = css`
  ${TYPOGRAPHY.linkPSemiBold}
  cursor: ${CURSOR_POINTER};
`

const DISABLED_LINK_CSS = css`
  ${TYPOGRAPHY.linkPSemiBold}
  color: ${COLORS.grey40};
  cursor: ${CURSOR_DEFAULT};

  &:hover {
    color: ${COLORS.grey40};
  }
`
