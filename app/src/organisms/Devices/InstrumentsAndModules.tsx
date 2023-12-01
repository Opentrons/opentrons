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
  ModalShell,
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
import { PipetteRecalibrationWarning } from './PipetteCard/PipetteRecalibrationWarning'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { ModuleCard } from '../ModuleCard'
import { FirmwareUpdateModal } from '../FirmwareUpdateModal'
import { useIsFlex, useIsRobotViewable, useRunStatuses } from './hooks'
import {
  getIs96ChannelPipetteAttached,
  getOffsetCalibrationForMount,
  getShowPipetteCalibrationWarning,
} from './utils'
import { PipetteCard } from './PipetteCard'
import { GripperCard } from '../GripperCard'
import type {
  BadGripper,
  BadPipette,
  GripperData,
  PipetteData,
  Subsystem,
} from '@opentrons/api-client'

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
  const { isRunTerminal, isRunRunning } = useRunStatuses()
  const isFlex = useIsFlex(robotName)
  const [
    subsystemToUpdate,
    setSubsystemToUpdate,
  ] = React.useState<Subsystem | null>(null)

  const { data: attachedInstruments } = useInstrumentsQuery({
    refetchInterval: EQUIPMENT_POLL_MS,
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
  const is96ChannelAttached = getIs96ChannelPipetteAttached(
    attachedPipettes?.left ?? null
  )
  const attachPipetteRequired =
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

  // The following pipetteOffset related code has been lifted out of the PipetteCard component
  // to eliminate duplicated useInterval calls to `calibration/pipette_offset` coming from each card.
  // Instead we now capture all offset calibration data here, and pass the appropriate calibration
  // data to the associated card via props
  const pipetteOffsetCalibrations =
    useAllPipetteOffsetCalibrationsQuery({
      refetchInterval: FETCH_PIPETTE_CAL_POLL,
      enabled: !isFlex,
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
      {subsystemToUpdate != null && (
        <ModalShell>
          <FirmwareUpdateModal
            subsystem={subsystemToUpdate}
            proceed={() => setSubsystemToUpdate(null)}
            description={t('updating_firmware')}
            proceedDescription={t('firmware_up_to_date')}
            isOnDevice={false}
          />
        </ModalShell>
      )}
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
              <PipetteCard
                pipetteId={attachedPipettes.left?.id}
                pipetteModelSpecs={
                  attachedPipettes.left?.model != null
                    ? getPipetteModelSpecs(attachedPipettes.left?.model) ?? null
                    : null
                }
                isPipetteCalibrated={
                  isFlex && attachedLeftPipette?.ok
                    ? attachedLeftPipette?.data?.calibratedOffset
                        ?.last_modified != null
                    : leftMountOffsetCalibration != null
                }
                mount={LEFT}
                robotName={robotName}
                pipetteIs96Channel={is96ChannelAttached}
                pipetteIsBad={badLeftPipette != null}
                updatePipette={() => setSubsystemToUpdate('pipette_left')}
                isRunActive={currentRunId != null && isRunRunning}
              />
              {isFlex && (
                <GripperCard
                  attachedGripper={attachedGripper}
                  isCalibrated={
                    attachedGripper?.ok === true &&
                    attachedGripper?.data?.calibratedOffset?.last_modified !=
                      null
                  }
                  setSubsystemToUpdate={setSubsystemToUpdate}
                  isRunActive={currentRunId != null && isRunRunning}
                />
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
                  updatePipetteFWRequired={updatePipetteFWRequired}
                />
              ))}
            </Flex>
            <Flex
              flex="50%"
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing8}
            >
              {!Boolean(is96ChannelAttached) && (
                <PipetteCard
                  pipetteId={attachedPipettes.right?.id}
                  pipetteModelSpecs={
                    attachedPipettes.right?.model != null
                      ? getPipetteModelSpecs(attachedPipettes.right?.model) ??
                        null
                      : null
                  }
                  isPipetteCalibrated={
                    isFlex && attachedRightPipette?.ok
                      ? attachedRightPipette?.data?.calibratedOffset
                          ?.last_modified != null
                      : rightMountOffsetCalibration != null
                  }
                  mount={RIGHT}
                  robotName={robotName}
                  pipetteIs96Channel={false}
                  pipetteIsBad={badRightPipette != null}
                  updatePipette={() => setSubsystemToUpdate('pipette_right')}
                  isRunActive={currentRunId != null && isRunRunning}
                />
              )}
              {rightColumnModules.map((module, index) => (
                <ModuleCard
                  key={`moduleCard_${String(module.moduleType)}_${String(
                    index
                  )}`}
                  robotName={robotName}
                  module={module}
                  isLoadedInRun={false}
                  attachPipetteRequired={attachPipetteRequired}
                  updatePipetteFWRequired={updatePipetteFWRequired}
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
