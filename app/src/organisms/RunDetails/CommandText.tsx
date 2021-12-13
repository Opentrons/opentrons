import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Flex,
  SPACING_1,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import type { RunCommandSummary } from '@opentrons/api-client'
import { Command, getLabwareDisplayName } from '@opentrons/shared-data'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'

import { useProtocolDetails } from './hooks'

import { getLabwareLocation } from '../ProtocolSetup/utils/getLabwareLocation'
import { useLabwareRenderInfoById } from '../ProtocolSetup/hooks'

interface Props {
  commandOrSummary: Command | RunCommandSummary
}
export function CommandText(props: Props): JSX.Element {
  const { commandOrSummary } = props
  const { t } = useTranslation('run_details')
  const { protocolData } = useProtocolDetails()
  const labwareRenderInfoById = useLabwareRenderInfoById()

  const commands = protocolData?.commands ?? []

  let messageNode = null
  if ('params' in commandOrSummary) {
    // params will not exist on command summaries
    switch (commandOrSummary.commandType) {
      case 'delay': {
        // TODO: IMMEDIATELY address displaying real comments
        messageNode = (
          <>
            <Flex
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              padding={SPACING_1}
              id={`RunDetails_CommandList`}
            >
              {t('comment')}
            </Flex>
            {commandOrSummary != null ? commandOrSummary.result : null}
          </>
        )
        break
      }
      case 'pickUpTip': {
        const { wellName, labwareId } = commandOrSummary.params
        const labwareLocation = getLabwareLocation(labwareId, commands)
        if (!('slotName' in labwareLocation)) {
          throw new Error('expected tip rack to be in a slot')
        }
        messageNode = (
          <Trans
            t={t}
            i18nKey={'pickup_tip'}
            values={{
              well_name: wellName,
              labware: getLabwareDisplayName(
                labwareRenderInfoById[labwareId].labwareDef
              ),
              labware_location: labwareLocation.slotName,
            }}
          />
        )
        break
      }
      case 'custom': {
        messageNode =
          commandOrSummary.params?.legacyCommandText ??
          commandOrSummary.commandType
        break
      }
      case 'loadLabware': {
        messageNode = <ProtocolSetupInfo setupCommand={commandOrSummary} />
        break
      }
      case 'loadPipette': {
        messageNode = <ProtocolSetupInfo setupCommand={commandOrSummary} />
        break
      }
      case 'loadModule': {
        messageNode = <ProtocolSetupInfo setupCommand={commandOrSummary} />
        break
      }
      default: {
        messageNode = commandOrSummary.commandType
        break
      }
    }
  } else {
    // this must be a run command summary
    messageNode = commandOrSummary.commandType
  }

  return (
    <Flex alignItems={ALIGN_CENTER} marginLeft={SPACING_1}>
      {messageNode}
    </Flex>
  )
}
