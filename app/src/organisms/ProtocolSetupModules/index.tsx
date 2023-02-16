import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'
import {
  // getDeckDefFromRobotType,
  getModuleDisplayName,
  getModuleType,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { BackButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { useAttachedModules } from '../../organisms/Devices/hooks'
import { MultipleModulesModal } from '../../organisms/Devices/ProtocolRun/SetupModules/MultipleModulesModal'
import { useMostRecentCompletedAnalysis } from '../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
// import { ROBOT_MODEL_OT3 } from '../../redux/discovery'
import {
  getAttachedProtocolModuleMatches,
  // getProtocolModulesInLoadOrder,
} from './utils'

import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'
import type { AttachedProtocolModuleMatch } from './utils'

interface RowModuleProps {
  module: AttachedProtocolModuleMatch
}

function RowModule({ module }: RowModuleProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  return (
    <Flex
      backgroundColor={
        module.attachedModuleMatch != null
          ? `${COLORS.successEnabled}${COLORS.opacity20HexCode}`
          : COLORS.warningBackgroundMed
      }
      borderRadius="1rem"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing4}
      paddingLeft={SPACING.spacing5}
    >
      <Flex width="50%">
        <StyledText>{getModuleDisplayName(module.model)}</StyledText>
      </Flex>
      <Flex width="20%">
        <StyledText>
          {/* TODO(bh, 2023-02-07): adjust slot location when hi-fi designs finalized */}
          {t('slot_location', {
            slotName:
              getModuleType(module.model) === THERMOCYCLER_MODULE_TYPE
                ? TC_MODULE_LOCATION_OT3
                : module.location.slotName,
          })}
        </StyledText>
      </Flex>
      <Flex width="30%">
        <StyledText>
          {module.attachedModuleMatch != null
            ? t('module_connected')
            : t('module_disconnected')}
        </StyledText>
      </Flex>
    </Flex>
  )
}

interface ProtocolSetupModulesProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

/**
 * an ODD screen on the Protocol Setup page
 */
export function ProtocolSetupModules({
  runId,
  setSetupScreen,
}: ProtocolSetupModulesProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)

  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)

  // const deckDef = getDeckDefFromRobotType(ROBOT_MODEL_OT3)

  // const requiredModules = mostRecentAnalysis?.modules ?? []
  // const commands = mostRecentAnalysis?.commands ?? []

  // TODO: lift all of this to the parent ProtocolSetup page?
  // ASSUMPTION: protocol modules given to us in load order from robot anaylsis
  // const protocolModulesInLoadOrder = getProtocolModulesInLoadOrder(
  //   requiredModules,
  //   commands
  // )

  const protocolModulesInLoadOrder = mostRecentAnalysis?.modules ?? []

  const attachedModules = useAttachedModules()

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInLoadOrder
  )

  return (
    <>
      {showMultipleModulesModal ? (
        <MultipleModulesModal
          onCloseClick={() => setShowMultipleModulesModal(false)}
        />
      ) : null}
      <BackButton onClick={() => setSetupScreen('prepare to run')}>
        {t('modules')}
      </BackButton>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing3}
        marginTop={SPACING.spacing6}
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex paddingLeft={SPACING.spacing5} width="50%">
            <StyledText>{'Module Name'}</StyledText>
          </Flex>
          <Flex width="20%">
            <StyledText>{'Location'}</StyledText>
          </Flex>
          <Flex width="30%">
            <StyledText>{'Status'}</StyledText>
          </Flex>
        </Flex>
        {attachedProtocolModuleMatches.map(module => (
          <RowModule key={module.id} module={module} />
        ))}
      </Flex>
    </>
  )
}
