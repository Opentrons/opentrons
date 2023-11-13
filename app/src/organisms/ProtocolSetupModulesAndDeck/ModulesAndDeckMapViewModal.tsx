import React from 'react'
import { useTranslation } from 'react-i18next'

import { BaseDeck } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { Modal } from '../../molecules/Modal'
import { ModuleInfo } from '../Devices/ModuleInfo'
import { getSimplestDeckConfigForProtocolCommands } from '../../resources/deck_configuration/utils'
import { getStandardDeckViewLayerBlockList } from '../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import type { AttachedProtocolModuleMatch } from './utils'

// Note (kk:10/26/2023) once we are ready for removing ff, we will be able to update props
interface ModulesAndDeckMapViewModalProps {
  setShowDeckMapModal: (showDeckMapModal: boolean) => void
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | null
}

export function ModulesAndDeckMapViewModal({
  setShowDeckMapModal,
  attachedProtocolModuleMatches,
  runId,
  protocolAnalysis,
}: ModulesAndDeckMapViewModalProps): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')

  const modalHeader: ModalHeaderBaseProps = {
    title: t('map_view'),
    hasExitIcon: true,
  }

  if (protocolAnalysis == null) return null

  const deckConfig = getSimplestDeckConfigForProtocolCommands(
    protocolAnalysis.commands
  )

  const moduleLocations = attachedProtocolModuleMatches.map(module => ({
    moduleModel: module.moduleDef.model,
    moduleLocation: { slotName: module.slotName },
    moduleChildren: (
      <ModuleInfo
        moduleModel={module.moduleDef.model}
        isAttached={module.attachedModuleMatch != null}
        physicalPort={module.attachedModuleMatch?.usbPort ?? null}
        runId={runId}
      />
    ),
  }))

  return (
    <Modal
      header={modalHeader}
      modalSize="large"
      onOutsideClick={() => setShowDeckMapModal(false)}
    >
      <BaseDeck
        deckConfig={deckConfig}
        deckLayerBlocklist={getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE)}
        robotType={FLEX_ROBOT_TYPE}
        labwareLocations={[]}
        moduleLocations={moduleLocations}
      />
    </Modal>
  )
}
