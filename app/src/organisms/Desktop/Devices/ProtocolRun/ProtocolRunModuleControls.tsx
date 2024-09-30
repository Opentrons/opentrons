import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  InfoScreen,
  SPACING,
} from '@opentrons/components'
import { ModuleCard } from '/app/organisms/ModuleCard'
import { useModuleRenderInfoForProtocolById } from '/app/resources/runs'
import { useModuleApiRequests } from '/app/organisms/ModuleCard/utils'

import type { BadPipette, PipetteData } from '@opentrons/api-client'

interface PipetteStatus {
  attachPipetteRequired: boolean
  calibratePipetteRequired: boolean
  updatePipetteFWRequired: boolean
}

const usePipetteIsReady = (): PipetteStatus => {
  const EQUIPMENT_POLL_MS = 5000

  const { data: attachedInstruments } = useInstrumentsQuery({
    refetchInterval: EQUIPMENT_POLL_MS,
  })
  const attachedLeftPipette =
    attachedInstruments?.data?.find(
      (i): i is PipetteData =>
        i.instrumentType === 'pipette' && i.ok && i.mount === 'left'
    ) ?? null
  const leftPipetteRequiresFWUpdate =
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
  const rightPipetteFWRequired =
    attachedInstruments?.data?.find(
      (i): i is BadPipette =>
        i.instrumentType === 'pipette' &&
        !i.ok &&
        i.subsystem === 'pipette_right'
    ) ?? null

  const attachPipetteRequired =
    attachedLeftPipette == null && attachedRightPipette == null
  const calibratePipetteRequired =
    attachedLeftPipette?.data.calibratedOffset?.last_modified == null &&
    attachedRightPipette?.data.calibratedOffset?.last_modified == null
  const updatePipetteFWRequired =
    leftPipetteRequiresFWUpdate != null || rightPipetteFWRequired != null
  return {
    attachPipetteRequired,
    calibratePipetteRequired,
    updatePipetteFWRequired,
  }
}

interface ProtocolRunModuleControlsProps {
  robotName: string
  runId: string
}

export const ProtocolRunModuleControls = ({
  robotName,
  runId,
}: ProtocolRunModuleControlsProps): JSX.Element => {
  const { t } = useTranslation('protocol_setup')
  const {
    attachPipetteRequired,
    calibratePipetteRequired,
    updatePipetteFWRequired,
  } = usePipetteIsReady()
  const [getLatestRequestId, handleModuleApiRequests] = useModuleApiRequests()

  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    runId,
    true
  )
  const attachedModules = Object.values(moduleRenderInfoForProtocolById).filter(
    module => module.attachedModuleMatch != null
  )

  // split modules in half and map into each column separately to avoid
  // the need for hardcoded heights without limitation, array will be split equally
  // or left column will contain 1 more item than right column
  const halfAttachedModulesSize = Math.ceil(attachedModules?.length / 2)
  const leftColumnModules = attachedModules?.slice(0, halfAttachedModulesSize)
  const rightColumnModules = attachedModules?.slice(halfAttachedModulesSize)

  return attachedModules.length === 0 ? (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      padding={SPACING.spacing16}
      backgroundColor={COLORS.white}
    >
      <InfoScreen content={t('connect_modules_for_controls')} />
    </Flex>
  ) : (
    <Flex gridGap={SPACING.spacing8} padding={SPACING.spacing16}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        flex="50%"
        gridGap={SPACING.spacing8}
      >
        {leftColumnModules.map((module, index) =>
          module.attachedModuleMatch != null ? (
            <ModuleCard
              key={`moduleCard_${String(module.moduleDef.moduleType)}_${index}`}
              robotName={robotName}
              runId={runId}
              module={module.attachedModuleMatch}
              slotName={module.slotName}
              isLoadedInRun={true}
              attachPipetteRequired={attachPipetteRequired}
              calibratePipetteRequired={calibratePipetteRequired}
              updatePipetteFWRequired={updatePipetteFWRequired}
              latestRequestId={getLatestRequestId(
                module.attachedModuleMatch.serialNumber
              )}
              handleModuleApiRequests={handleModuleApiRequests}
            />
          ) : null
        )}
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        flex="50%"
        gridGap={SPACING.spacing8}
      >
        {rightColumnModules.map((module, index) =>
          module.attachedModuleMatch != null ? (
            <ModuleCard
              key={`moduleCard_${String(module.moduleDef.moduleType)}_${index}`}
              robotName={robotName}
              runId={runId}
              module={module.attachedModuleMatch}
              slotName={module.slotName}
              isLoadedInRun={true}
              attachPipetteRequired={attachPipetteRequired}
              calibratePipetteRequired={calibratePipetteRequired}
              updatePipetteFWRequired={updatePipetteFWRequired}
              latestRequestId={getLatestRequestId(
                module.attachedModuleMatch.serialNumber
              )}
              handleModuleApiRequests={handleModuleApiRequests}
            />
          ) : null
        )}
      </Flex>
    </Flex>
  )
}
