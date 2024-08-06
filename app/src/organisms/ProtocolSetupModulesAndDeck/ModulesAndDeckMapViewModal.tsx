import React from 'react'
import { useTranslation } from 'react-i18next'

import { BaseDeck } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getSimplestDeckConfigForProtocol,
} from '@opentrons/shared-data'

import { OddModal } from '../../molecules/OddModal'
import { ModuleInfo } from '../Devices/ModuleInfo'
import { getStandardDeckViewLayerBlockList } from '../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { OddModalHeaderBaseProps } from '../../molecules/OddModal/types'
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

  const modalHeader: OddModalHeaderBaseProps = {
    title: t('map_view'),
    hasExitIcon: true,
  }

  if (protocolAnalysis == null) return null

  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)

  const modulesOnDeck = attachedProtocolModuleMatches.map(module => ({
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
    <OddModal
      header={modalHeader}
      modalSize="large"
      onOutsideClick={() => {
        setShowDeckMapModal(false)
      }}
    >
      <BaseDeck
        deckConfig={deckConfig}
        deckLayerBlocklist={getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE)}
        robotType={FLEX_ROBOT_TYPE}
        labwareOnDeck={[]}
        modulesOnDeck={modulesOnDeck}
      />
    </OddModal>
  )
}
