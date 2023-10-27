import React from 'react'
import { useTranslation } from 'react-i18next'

import {
  BaseDeck,
  RobotWorkSpace,
  COLORS,
  Module,
  SlotLabels,
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  getRobotTypeFromLoadedLabware,
} from '@opentrons/shared-data'
import { Modal } from '../../molecules/Modal'
import { ModuleInfo } from '../Devices/ModuleInfo'
import { ROBOT_MODEL_OT3 } from '../../redux/discovery' // need to switch if needed to use this
import { useFeatureFlag } from '../../redux/config'
import { getDeckConfigFromProtocolCommands } from '../../resources/deck_configuration/utils'
import { useStoredProtocolAnalysis } from '../Devices/hooks'
import { getStandardDeckViewLayerBlockList } from '../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'

import type {
  CompletedProtocolAnalysis,
  DeckDefinition,
} from '@opentrons/shared-data'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import type { AttachedProtocolModuleMatch } from './utils'

const OT3_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST: string[] = [
  'DECK_BASE',
  'BARCODE_COVERS',
  'SLOT_SCREWS',
  'SLOT_10_EXPANSION',
  'CALIBRATION_CUTOUTS',
]

// Note (kk:10/26/2023) once we are ready for removing ff, we will be able to update props
interface ModulesAndDeckMapViewModalProps {
  setShowDeckMapModal: (showDeckMapModal: boolean) => void
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  runId: string
  deckDef: DeckDefinition
  mostRecentAnalysis?: CompletedProtocolAnalysis | null
}

export function ModulesAndDeckMapViewModal({
  setShowDeckMapModal,
  attachedProtocolModuleMatches,
  runId,
  deckDef,
  mostRecentAnalysis,
}: ModulesAndDeckMapViewModalProps): JSX.Element | null {
  console.log(
    'attachedProtocolModuleMatches',
    JSON.stringify(attachedProtocolModuleMatches, null, 4)
  )
  console.log('deckDef', JSON.stringify(deckDef, null, 4))
  console.log('mostRecentAnalysis', JSON.stringify(mostRecentAnalysis, null, 4))

  const { t } = useTranslation('protocol_setup')
  const enableDeckConfig = useFeatureFlag('enableDeckConfiguration')

  const modalHeader: ModalHeaderBaseProps = {
    title: t('map_view'),
    hasExitIcon: true,
  }

  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = mostRecentAnalysis ?? storedProtocolAnalysis

  if (protocolAnalysis == null) return null

  const robotType = getRobotTypeFromLoadedLabware(protocolAnalysis.labware)
  const deckConfig = getDeckConfigFromProtocolCommands(
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
      {/* we will be able to remove this once we are ready for removing the ff */}
      {enableDeckConfig ? (
        <BaseDeck
          deckConfig={deckConfig}
          deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
          robotType={robotType}
          labwareLocations={[]}
          moduleLocations={moduleLocations}
        />
      ) : (
        <RobotWorkSpace
          deckDef={deckDef}
          deckLayerBlocklist={OT3_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST}
          deckFill={COLORS.light1}
          trashSlotName="A3"
          id="ModuleSetup_deckMap"
          trashColor={COLORS.darkGreyEnabled}
        >
          {() => (
            <>
              {attachedProtocolModuleMatches.map(module => (
                <Module
                  key={module.moduleId}
                  x={module.x}
                  y={module.y}
                  orientation={inferModuleOrientationFromXCoordinate(module.x)}
                  def={module.moduleDef}
                >
                  <ModuleInfo
                    moduleModel={module.moduleDef.model}
                    isAttached={module.attachedModuleMatch != null}
                    physicalPort={module.attachedModuleMatch?.usbPort ?? null}
                    runId={runId}
                  />
                </Module>
              ))}
              <SlotLabels robotType={ROBOT_MODEL_OT3} />
            </>
          )}
        </RobotWorkSpace>
      )}
    </Modal>
  )
}
