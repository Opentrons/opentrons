import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  WRAP,
} from '@opentrons/components'
import {
  useInstrumentsQuery,
  useModulesQuery,
  usePipettesQuery,
} from '@opentrons/react-api-client'
import {
  getGripperDisplayName,
  getModuleDisplayName,
  getPipetteModelSpecs,
} from '@opentrons/shared-data'

import FLEX_PNG from '/app/assets/images/FLEX.png'
import { InstrumentContainer } from '/app/atoms/InstrumentContainer'
import { ModuleIcon } from '/app/molecules/ModuleIcon'
import { useIsFlex } from '/app/redux-resources/robots'
import { CONNECTABLE, getRobotModelByName } from '/app/redux/discovery'
import { useNotifyCamera } from '/app/resources/camera/useNotifyCamera'

import { UpdateRobotBanner } from '../UpdateRobotBanner'
import {
  ErrorRecoveryBanner,
  useErrorRecoveryBanner,
} from './ErrorRecoveryBanner'
import { ReachableBanner } from './ReachableBanner'
import { RobotOverflowMenu } from './RobotOverflowMenu'
import { RobotStatusHeader } from './RobotStatusHeader'

import type { GripperData } from '@opentrons/api-client'
import type { GripperModel } from '@opentrons/shared-data'
import type { DiscoveredRobot } from '/app/redux/discovery/types'
import type { State } from '/app/redux/types'

const CAMERA_REFETCH_MS = 5000

interface RobotCardProps {
  robot: DiscoveredRobot
}

export function RobotCard(props: RobotCardProps): JSX.Element | null {
  const { robot } = props
  const { name: robotName, local } = robot
  const navigate = useNavigate()
  const robotModel = useSelector((state: State) =>
    getRobotModelByName(state, robotName)
  )

  const { showRecoveryBanner, recoveryIntent } = useErrorRecoveryBanner()

  return robot != null ? (
    <Flex
      alignItems={ALIGN_START}
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.borderRadius8}
      cursor="pointer"
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing16}
      minWidth="36rem"
      padding={SPACING.spacing16}
      position={POSITION_RELATIVE}
      onClick={() => {
        navigate(`/devices/${robotName}`)
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing12}
        justifyContent={JUSTIFY_FLEX_START}
        width="100%"
      >
        <UpdateRobotBanner robot={robot} marginRight={SPACING.spacing24} />
        <ReachableBanner robot={robot} />
        {showRecoveryBanner ? (
          <ErrorRecoveryBanner
            recoveryIntent={recoveryIntent}
            marginRight={SPACING.spacing24}
          />
        ) : null}
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <Flex gap={SPACING.spacing16}>
            <img
              src={FLEX_PNG}
              width="52.9px"
              height="50.14px"
              alt="Flex image"
            />
            <RobotStatusHeader
              local={local}
              name={robotName}
              robotModel={robotModel}
              alignItems={ALIGN_START}
              paddingRight={SPACING.spacing24}
            />
          </Flex>

          {robot.status === CONNECTABLE ? (
            <Flex
              flexDirection={DIRECTION_ROW}
              flexWrap={WRAP}
              gridGap={SPACING.spacing16}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <AttachedInstruments robotName={robotName} />
              <Flex
                gridGap={SPACING.spacing4}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
              >
                <AttachedModules robotName={robotName} />
                <AttachedDevices robotName={robotName} />
              </Flex>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
      <Box
        position={POSITION_ABSOLUTE}
        top={SPACING.spacing4}
        right={SPACING.spacing4}
      >
        <RobotOverflowMenu robot={robot} alignSelf={ALIGN_START} />
      </Box>
    </Flex>
  ) : null
}

function AttachedModules(props: { robotName: string }): JSX.Element | null {
  const { robotName } = props
  const { t } = useTranslation('devices_landing')
  const { data: modulesData, isLoading: isModulesQueryLoading } =
    useModulesQuery()
  const attachedModules = modulesData?.data ?? []

  return !isModulesQueryLoading && attachedModules.length > 0 ? (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="100%"
    >
      <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
        {t('modules')}
      </StyledText>
      <Flex>
        {attachedModules.map((module, i) => (
          <ModuleIcon
            key={`${String(module.moduleModel)}_${i}_${robotName}`}
            tooltipText={t('this_robot_has_connected_and_power_on_module', {
              moduleName: getModuleDisplayName(module.moduleModel),
            })}
            module={module}
          />
        ))}
      </Flex>
    </Flex>
  ) : null
}

function AttachedDevices(props: { robotName: string }): JSX.Element | null {
  const { robotName } = props
  const { t } = useTranslation('devices_landing')
  const { data } = useNotifyCamera({ refetchInterval: CAMERA_REFETCH_MS })

  return data?.cameraEnabled ? (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="85px"
    >
      <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
        {t('peripherals')}
      </StyledText>
      <Icon
        key={`${String('camera')}_${robotName}`}
        name="camera"
        color={COLORS.grey50}
        size={SPACING.spacing16}
      ></Icon>
    </Flex>
  ) : null
}

function AttachedInstruments(props: { robotName: string }): JSX.Element {
  const { t, i18n } = useTranslation('devices_landing')
  const isFlex = useIsFlex(props.robotName)
  const { data: pipettesData, isLoading: isPipetteQueryLoading } =
    usePipettesQuery()

  const { data: attachedInstruments, isLoading: isInstrumentsQueryLoading } =
    useInstrumentsQuery({ enabled: isFlex })
  const attachedGripper =
    (attachedInstruments?.data ?? []).find(
      (i): i is GripperData => i.instrumentType === 'gripper' && i.ok
    ) ?? null
  const leftPipetteModel = pipettesData?.left?.model ?? null
  const rightPipetteModel = pipettesData?.right?.model ?? null
  const gripperDisplayName =
    attachedGripper != null
      ? getGripperDisplayName(attachedGripper.instrumentModel as GripperModel)
      : null

  // TODO(bh, 2022-11-1): insert actual 96-channel data
  // const leftAndRightMountsPipetteDisplayName = 'P20 96-Channel GEN1'
  const leftAndRightMountsPipetteDisplayName = null

  return (
    <Flex flex="1" flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
        {i18n.format(t('shared:instruments'), 'capitalize')}
      </StyledText>

      {isPipetteQueryLoading || isInstrumentsQueryLoading ? null : (
        <Flex flexWrap={WRAP} gridGap={SPACING.spacing4}>
          {leftAndRightMountsPipetteDisplayName != null ? (
            <InstrumentContainer
              displayName={leftAndRightMountsPipetteDisplayName}
            />
          ) : null}
          {leftPipetteModel != null ? (
            <InstrumentContainer
              displayName={
                getPipetteModelSpecs(leftPipetteModel)?.displayName ?? ''
              }
            />
          ) : null}
          {rightPipetteModel != null ? (
            <InstrumentContainer
              displayName={
                getPipetteModelSpecs(rightPipetteModel)?.displayName ?? ''
              }
            />
          ) : null}
          {gripperDisplayName != null ? (
            <InstrumentContainer displayName={gripperDisplayName} />
          ) : null}
        </Flex>
      )}
    </Flex>
  )
}
