import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { getPipetteModelSpecs, LEFT, RIGHT } from '@opentrons/shared-data'
import {
  useAllPipetteOffsetCalibrationsQuery,
  useModulesQuery,
  usePipettesQuery,
  useInstrumentsQuery,
} from '@opentrons/react-api-client'

import {
  Flex,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  SIZE_3,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { ModuleCard } from '../ModuleCard'
import { useIsOT3, useIsRobotViewable, useRunStatuses } from './hooks'
import {
  getIs96ChannelPipetteAttached,
  getOffsetCalibrationForMount,
} from './utils'
import { PipetteCard } from './PipetteCard'
import { GripperCard } from '../GripperCard'
import type { GripperData, PipetteData } from '@opentrons/api-client'

const EQUIPMENT_POLL_MS = 5000
const FETCH_PIPETTE_CAL_POLL = 30000
interface InstrumentsAndModulesProps {
  robotName: string
}

export function InstrumentsAndModules({
  robotName,
}: InstrumentsAndModulesProps): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const attachedPipettes = usePipettesQuery(
    {},
    {
      refetchInterval: EQUIPMENT_POLL_MS,
    }
  )?.data ?? { left: undefined, right: undefined }
  const isRobotViewable = useIsRobotViewable(robotName)
  const currentRunId = useCurrentRunId()
  const { isRunTerminal } = useRunStatuses()
  const isOT3 = useIsOT3(robotName)

  const { data: attachedInstruments } = useInstrumentsQuery()
  // TODO(bc, 2023-03-20): reintroduce this poll, once it is safe to call cache_instruments during sensor reads on CAN bus
  // { refetchInterval: EQUIPMENT_POLL_MS, },
  const attachedGripper =
    (attachedInstruments?.data ?? []).find(
      (i): i is GripperData => i.instrumentType === 'gripper' && !i.ok
    ) ?? null
  const attachedLeftPipette =
    attachedInstruments?.data?.find(
      (i): i is PipetteData =>
        i.instrumentType === 'pipette' && i.ok && i.mount === 'left'
    ) ?? null
  const attachedRightPipette =
    attachedInstruments?.data?.find(
      (i): i is PipetteData =>
        i.instrumentType === 'pipette' && i.ok && i.mount === 'right'
    ) ?? null
  const is96ChannelAttached = getIs96ChannelPipetteAttached(
    attachedPipettes?.left ?? null
  )
  const attachedModules =
    useModulesQuery({ refetchInterval: EQUIPMENT_POLL_MS })?.data?.data ?? []
  // split modules in half and map into each column separately to avoid
  // the need for hardcoded heights without limitation, array will be split equally
  // or left column will contain 1 more item than right column
  // TODO(bh, 2022-10-27): once we're using real gripper data, combine the extension mount/module data into columns pre-render
  const halfAttachedModulesSize = isOT3
    ? Math.floor(attachedModules?.length / 2)
    : Math.ceil(attachedModules?.length / 2)
  const leftColumnModules = attachedModules?.slice(0, halfAttachedModulesSize)
  const rightColumnModules = attachedModules?.slice(halfAttachedModulesSize)

  // The following pipetteOffset related code has been lifted out of the PipetteCard component
  // to eliminate duplicated useInterval calls to `calibration/pipette_offset` coming from each card.
  // Instead we now capture all offset calibration data here, and pass the appropriate calibration
  // data to the associated card via props
  const pipetteOffsetCalibrations =
    useAllPipetteOffsetCalibrationsQuery({
      refetchInterval: FETCH_PIPETTE_CAL_POLL,
      enabled: !isOT3,
    })?.data?.data ?? []
  const leftMountOffsetCalibration = getOffsetCalibrationForMount(
    pipetteOffsetCalibrations,
    attachedPipettes,
    LEFT
  )
  const rightMountOffsetCalibration = getOffsetCalibrationForMount(
    pipetteOffsetCalibrations,
    attachedPipettes,
    RIGHT
  )

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      flexDirection={DIRECTION_COLUMN}
      width="100%"
    >
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        marginBottom={SPACING.spacing16}
        id="InstrumentsAndModules_title"
      >
        {t('instruments_and_modules')}
      </StyledText>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        minHeight={SIZE_3}
        paddingBottom={SPACING.spacing8}
        width="100%"
        flexDirection={DIRECTION_COLUMN}
      >
        {currentRunId != null && !isRunTerminal && (
          <Flex
            paddingBottom={SPACING.spacing16}
            flexDirection={DIRECTION_COLUMN}
            paddingX={SPACING.spacing4}
            width="100%"
          >
            <Banner type="warning">{t('robot_control_not_available')}</Banner>
          </Flex>
        )}
        {isRobotViewable ? (
          <Flex gridGap={SPACING.spacing8} width="100%">
            <Flex
              flex="50%"
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing8}
            >
              <PipetteCard
                pipetteId={attachedPipettes.left?.id}
                pipetteInfo={
                  attachedPipettes.left?.model != null
                    ? getPipetteModelSpecs(attachedPipettes.left?.model) ?? null
                    : null
                }
                isPipetteCalibrated={
                  isOT3
                    ? attachedLeftPipette?.data?.calibratedOffset != null
                    : leftMountOffsetCalibration != null
                }
                mount={LEFT}
                robotName={robotName}
                is96ChannelAttached={is96ChannelAttached}
              />
              {isOT3 ? (
                <GripperCard
                  attachedGripper={attachedGripper}
                  isCalibrated={attachedGripper?.data?.calibratedOffset != null}
                />
              ) : null}
              {leftColumnModules.map((module, index) => (
                <ModuleCard
                  key={`moduleCard_${String(module.moduleType)}_${String(
                    index
                  )}`}
                  robotName={robotName}
                  module={module}
                  isLoadedInRun={false}
                />
              ))}
            </Flex>
            <Flex
              flex="50%"
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing8}
            >
              {!Boolean(is96ChannelAttached) ? (
                <PipetteCard
                  pipetteId={attachedPipettes.right?.id}
                  pipetteInfo={
                    attachedPipettes.right?.model != null
                      ? getPipetteModelSpecs(attachedPipettes.right?.model) ??
                        null
                      : null
                  }
                  isPipetteCalibrated={
                    isOT3
                      ? attachedRightPipette?.data?.calibratedOffset != null
                      : rightMountOffsetCalibration != null
                  }
                  mount={RIGHT}
                  robotName={robotName}
                  is96ChannelAttached={false}
                />
              ) : null}
              {rightColumnModules.map((module, index) => (
                <ModuleCard
                  key={`moduleCard_${String(module.moduleType)}_${String(
                    index
                  )}`}
                  robotName={robotName}
                  module={module}
                  isLoadedInRun={false}
                />
              ))}
            </Flex>
          </Flex>
        ) : (
          <Flex
            alignItems={ALIGN_CENTER}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing12}
            justifyContent={JUSTIFY_CENTER}
            minHeight={SIZE_3}
            padding={SPACING.spacing12}
          >
            {/* TODO(bh, 2022-10-20): insert "offline" image when provided by illustrator */}
            <StyledText
              as="p"
              color={COLORS.errorDisabled}
              id="InstrumentsAndModules_offline"
            >
              {t('offline_instruments_and_modules')}
            </StyledText>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
