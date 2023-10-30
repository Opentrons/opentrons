import React from 'react'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'

import {
  BaseDeck,
  RobotWorkSpace,
  COLORS,
  Module,
  SlotLabels,
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  FLEX_ROBOT_TYPE,
} from '@opentrons/shared-data'
import { parseInitialLoadedLabwareByAdapter } from '@opentrons/api-client'

import { Modal } from '../../molecules/Modal'
import { ModuleInfo } from '../Devices/ModuleInfo'
import { ROBOT_MODEL_OT3 } from '../../redux/discovery' // need to switch if needed to use this
import { useFeatureFlag } from '../../redux/config'
import { getDeckConfigFromProtocolCommands } from '../../resources/deck_configuration/utils'
import { useStoredProtocolAnalysis } from '../Devices/hooks'
import { getLabwareRenderInfo } from '../Devices/ProtocolRun/utils/getLabwareRenderInfo'
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
  const { t } = useTranslation('protocol_setup')
  const enableDeckConfig = useFeatureFlag('enableDeckConfiguration')

  const modalHeader: ModalHeaderBaseProps = {
    title: t('map_view'),
    hasExitIcon: true,
  }

  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = mostRecentAnalysis ?? storedProtocolAnalysis

  if (protocolAnalysis == null) return null

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

  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    protocolAnalysis.commands
  )
  const labwareRenderInfo = getLabwareRenderInfo(protocolAnalysis, deckDef)

  const labwareLocations = map(
    labwareRenderInfo,
    ({ labwareDef, displayName, slotName }, labwareId) => {
      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId
      const topLabwareDisplayName =
        labwareInAdapter?.params.displayName ?? displayName

      return {
        labwareLocation: { slotName },
        definition: topLabwareDefinition,
        topLabwareId,
        topLabwareDisplayName,
      }
    }
  )

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
          deckLayerBlocklist={getStandardDeckViewLayerBlockList(
            FLEX_ROBOT_TYPE
          )}
          robotType={FLEX_ROBOT_TYPE}
          labwareLocations={labwareLocations}
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
