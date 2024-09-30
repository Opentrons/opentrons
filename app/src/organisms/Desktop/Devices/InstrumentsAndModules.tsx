import { useTranslation } from 'react-i18next'
import { getPipetteModelSpecs, LEFT, RIGHT } from '@opentrons/shared-data'
import {
  useModulesQuery,
  usePipettesQuery,
  useInstrumentsQuery,
} from '@opentrons/react-api-client'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  Banner,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SIZE_3,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { PipetteRecalibrationWarning } from './PipetteCard/PipetteRecalibrationWarning'
import { useCurrentRunId, useRunStatuses } from '/app/resources/runs'
import { useIsFlex, useIsRobotViewable } from '/app/redux-resources/robots'
import { ModuleCard } from '/app/organisms/ModuleCard'
import { getShowPipetteCalibrationWarning } from '/app/transformations/instruments'
import { PipetteCard } from './PipetteCard'
import { FlexPipetteCard } from './PipetteCard/FlexPipetteCard'
import { GripperCard } from './GripperCard'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'
import { useModuleApiRequests } from '/app/organisms/ModuleCard/utils'

import type {
  BadGripper,
  BadPipette,
  GripperData,
  PipetteData,
} from '@opentrons/api-client'

const EQUIPMENT_POLL_MS = 5000
interface InstrumentsAndModulesProps {
  robotName: string
}

export function InstrumentsAndModules({
  robotName,
}: InstrumentsAndModulesProps): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const isFlex = useIsFlex(robotName)
  const attachedPipettes = usePipettesQuery(
    {},
    {
      refetchInterval: EQUIPMENT_POLL_MS,
      enabled: !isFlex,
    }
  )?.data ?? { left: undefined, right: undefined }
  const isRobotViewable = useIsRobotViewable(robotName)
  const currentRunId = useCurrentRunId()
  const { isRunTerminal, isRunRunning } = useRunStatuses()
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)
  const [getLatestRequestId, handleModuleApiRequests] = useModuleApiRequests()

  const { data: attachedInstruments } = useInstrumentsQuery({
    refetchInterval: EQUIPMENT_POLL_MS,
    enabled: isFlex,
  })

  const attachedGripper =
    (attachedInstruments?.data ?? []).find(
      (i): i is GripperData | BadGripper => i.subsystem === 'gripper'
    ) ?? null
  const attachedLeftPipette =
    attachedInstruments?.data?.find(
      (i): i is PipetteData =>
        i.instrumentType === 'pipette' && i.ok && i.mount === 'left'
    ) ?? null
  // A pipette is bad if it requires a firmware update.
  const badLeftPipette =
    attachedInstruments?.data?.find(
      (i): i is BadPipette =>
        i.instrumentType === 'pipette' &&
        !i.ok &&
        i.subsystem === 'pipette_left'
    ) ?? null
  const attachedRightPipette =
    attachedInstruments?.data?.find(
      (i): i is PipetteData =>
        i.instrumentType === 'pipette' && i.ok && i.mount === 'right'
    ) ?? null
  const badRightPipette =
    attachedInstruments?.data?.find(
      (i): i is BadPipette =>
        i.instrumentType === 'pipette' &&
        !i.ok &&
        i.subsystem === 'pipette_right'
    ) ?? null
  const is96ChannelAttached = attachedLeftPipette?.data.channels === 96

  const attachPipetteRequired =
    attachedLeftPipette == null && attachedRightPipette == null
  const calibratePipetteRequired =
    attachedLeftPipette?.data?.calibratedOffset?.last_modified == null &&
    attachedRightPipette?.data?.calibratedOffset?.last_modified == null
  const updatePipetteFWRequired =
    badLeftPipette != null || badRightPipette != null

  const attachedModules =
    useModulesQuery({ refetchInterval: EQUIPMENT_POLL_MS })?.data?.data ?? []
  // split modules in half and map into each column separately to avoid
  // the need for hardcoded heights without limitation, array will be split equally
  // or left column will contain 1 more item than right column
  // TODO(bh, 2022-10-27): once we're using real gripper data, combine the extension mount/module data into columns pre-render
  const halfAttachedModulesSize = isFlex
    ? Math.floor(attachedModules?.length / 2)
    : Math.ceil(attachedModules?.length / 2)
  const leftColumnModules = attachedModules?.slice(0, halfAttachedModulesSize)
  const rightColumnModules = attachedModules?.slice(halfAttachedModulesSize)

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      flexDirection={DIRECTION_COLUMN}
      width="100%"
    >
      <LegacyStyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        marginBottom={SPACING.spacing16}
        id="InstrumentsAndModules_title"
      >
        {t('instruments_and_modules')}
      </LegacyStyledText>
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
        {isRobotViewable &&
        getShowPipetteCalibrationWarning(attachedInstruments) &&
        (isRunTerminal || currentRunId == null) ? (
          <Flex paddingBottom={SPACING.spacing16} width="100%">
            <PipetteRecalibrationWarning />
          </Flex>
        ) : null}
        {isRobotViewable ? (
          <Flex gridGap={SPACING.spacing8} width="100%">
            <Flex
              flex="50%"
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing8}
            >
              {!isFlex ? (
                <PipetteCard
                  pipetteId={attachedPipettes.left?.id}
                  pipetteModelSpecs={
                    attachedPipettes.left?.model != null
                      ? getPipetteModelSpecs(attachedPipettes.left?.model) ??
                        null
                      : null
                  }
                  mount={LEFT}
                  robotName={robotName}
                  isRunActive={currentRunId != null && isRunRunning}
                  isEstopNotDisengaged={isEstopNotDisengaged}
                />
              ) : (
                <>
                  <FlexPipetteCard
                    attachedPipette={attachedLeftPipette}
                    pipetteModelSpecs={
                      attachedLeftPipette?.instrumentModel != null
                        ? getPipetteModelSpecs(
                            attachedLeftPipette.instrumentModel
                          ) ?? null
                        : null
                    }
                    mount={LEFT}
                    isRunActive={currentRunId != null && isRunRunning}
                    isEstopNotDisengaged={isEstopNotDisengaged}
                  />
                  <GripperCard
                    attachedGripper={attachedGripper}
                    isCalibrated={
                      attachedGripper?.ok === true &&
                      attachedGripper?.data?.calibratedOffset?.last_modified !=
                        null
                    }
                    isRunActive={currentRunId != null && isRunRunning}
                    isEstopNotDisengaged={isEstopNotDisengaged}
                  />
                </>
              )}
              {leftColumnModules.map((module, index) => (
                <ModuleCard
                  key={`moduleCard_${String(module.moduleType)}_${String(
                    index
                  )}`}
                  robotName={robotName}
                  module={module}
                  isLoadedInRun={false}
                  attachPipetteRequired={attachPipetteRequired}
                  calibratePipetteRequired={calibratePipetteRequired}
                  updatePipetteFWRequired={updatePipetteFWRequired}
                  latestRequestId={getLatestRequestId(module.serialNumber)}
                  handleModuleApiRequests={handleModuleApiRequests}
                />
              ))}
            </Flex>
            <Flex
              flex="50%"
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing8}
            >
              {!isFlex ? (
                <PipetteCard
                  pipetteId={attachedPipettes.right?.id}
                  pipetteModelSpecs={
                    attachedPipettes.right?.model != null
                      ? getPipetteModelSpecs(attachedPipettes.right?.model) ??
                        null
                      : null
                  }
                  mount={RIGHT}
                  robotName={robotName}
                  isRunActive={currentRunId != null && isRunRunning}
                  isEstopNotDisengaged={isEstopNotDisengaged}
                />
              ) : null}
              {isFlex && !is96ChannelAttached ? (
                <FlexPipetteCard
                  attachedPipette={attachedRightPipette}
                  pipetteModelSpecs={
                    attachedRightPipette?.instrumentModel != null
                      ? getPipetteModelSpecs(
                          attachedRightPipette.instrumentModel
                        ) ?? null
                      : null
                  }
                  mount={RIGHT}
                  isRunActive={currentRunId != null && isRunRunning}
                  isEstopNotDisengaged={isEstopNotDisengaged}
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
                  attachPipetteRequired={attachPipetteRequired}
                  calibratePipetteRequired={calibratePipetteRequired}
                  updatePipetteFWRequired={updatePipetteFWRequired}
                  latestRequestId={getLatestRequestId(module.serialNumber)}
                  handleModuleApiRequests={handleModuleApiRequests}
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
            <LegacyStyledText
              as="p"
              color={COLORS.grey40}
              id="InstrumentsAndModules_offline"
            >
              {t('offline_instruments_and_modules')}
            </LegacyStyledText>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
