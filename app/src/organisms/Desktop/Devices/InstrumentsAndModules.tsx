import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  Banner,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  JUSTIFY_CENTER,
  SIZE_3,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  useInstrumentsQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'
import { getPipetteModelSpecs, LEFT, RIGHT } from '@opentrons/shared-data'

import { ModuleCard } from '/app/organisms/ModuleCard'
import { useModuleApiRequests } from '/app/organisms/ModuleCard/utils'
import { useIsFlex } from '/app/redux-resources/robots'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'
import { useCurrentRunId, useRunStatuses } from '/app/resources/runs'
import { getShowPipetteCalibrationWarning } from '/app/transformations/instruments'

import { GripperCard } from './GripperCard'
import { FlexPipetteCard } from './PipetteCard/FlexPipetteCard'
import { PipetteRecalibrationWarning } from './PipetteCard/PipetteRecalibrationWarning'

import type {
  BadGripper,
  BadPipette,
  GripperData,
  PipetteData,
} from '@opentrons/api-client'

const EQUIPMENT_POLL_MS = 5000

// stubbed vacuum module for testing
interface InstrumentsAndModulesProps {
  robotName: string
  isRobotViewable: boolean
}

export function InstrumentsAndModules({
  robotName,
  isRobotViewable,
}: InstrumentsAndModulesProps): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const isFlex = useIsFlex(robotName)
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
  const leftColumnModules = [
    ...attachedModules?.slice(0, halfAttachedModulesSize),
    // STUBBED_ATTACHED_VACUUM_MODULE,
  ]
  const rightColumnModules = attachedModules?.slice(halfAttachedModulesSize)

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      gap={SPACING.spacing16}
      padding={SPACING.spacing16}
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.borderRadius8}
    >
      <StyledText desktopStyle="bodyLargeSemiBold">
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
              {!isFlex ? null : ( // !isFlex shouldn't happen--this repo is now Flex-only.
                <>
                  <FlexPipetteCard
                    attachedPipette={attachedLeftPipette}
                    pipetteModelSpecs={
                      attachedLeftPipette?.instrumentModel != null
                        ? (getPipetteModelSpecs(
                            attachedLeftPipette.instrumentModel
                          ) ?? null)
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
              {isFlex && !is96ChannelAttached ? (
                <FlexPipetteCard
                  attachedPipette={attachedRightPipette}
                  pipetteModelSpecs={
                    attachedRightPipette?.instrumentModel != null
                      ? (getPipetteModelSpecs(
                          attachedRightPipette.instrumentModel
                        ) ?? null)
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
          <InfoScreen content={t('offline_instruments_and_modules')} />
        )}
      </Flex>
    </Flex>
  )
}
