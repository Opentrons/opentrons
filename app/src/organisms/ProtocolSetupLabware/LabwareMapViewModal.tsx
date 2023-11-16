import * as React from 'react'
import map from 'lodash/map'
import { useTranslation } from 'react-i18next'
import { BaseDeck } from '@opentrons/components'
import { FLEX_ROBOT_TYPE, THERMOCYCLER_MODULE_V1 } from '@opentrons/shared-data'

import { Modal } from '../../molecules/Modal'
import { getSimplestDeckConfigForProtocolCommands } from '../../resources/deck_configuration/utils'
import { getStandardDeckViewLayerBlockList } from '../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'
import { getLabwareRenderInfo } from '../Devices/ProtocolRun/utils/getLabwareRenderInfo'
import { AttachedProtocolModuleMatch } from '../ProtocolSetupModulesAndDeck/utils'

import type {
  CompletedProtocolAnalysis,
  DeckDefinition,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { LoadedLabwareByAdapter } from '@opentrons/api-client'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface LabwareMapViewModalProps {
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  handleLabwareClick: (
    labwareDef: LabwareDefinition2,
    labwareId: string
  ) => void
  onCloseClick: () => void
  initialLoadedLabwareByAdapter: LoadedLabwareByAdapter
  deckDef: DeckDefinition
  mostRecentAnalysis: CompletedProtocolAnalysis | null
}

export function LabwareMapViewModal(
  props: LabwareMapViewModalProps
): JSX.Element {
  const {
    handleLabwareClick,
    onCloseClick,
    attachedProtocolModuleMatches,
    initialLoadedLabwareByAdapter,
    deckDef,
    mostRecentAnalysis,
  } = props
  const { t } = useTranslation('protocol_setup')
  const deckConfig = getSimplestDeckConfigForProtocolCommands(
    mostRecentAnalysis?.commands ?? []
  )
  const labwareRenderInfo =
    mostRecentAnalysis != null
      ? getLabwareRenderInfo(mostRecentAnalysis, deckDef)
      : {}

  const modalHeader: ModalHeaderBaseProps = {
    title: t('map_view'),
    hasExitIcon: true,
  }

  const moduleLocations = attachedProtocolModuleMatches.map(module => {
    const { moduleDef, nestedLabwareDef, nestedLabwareId, slotName } = module
    const labwareInAdapterInMod =
      nestedLabwareId != null
        ? initialLoadedLabwareByAdapter[nestedLabwareId]
        : null
    //  only rendering the labware on top most layer so
    //  either the adapter or the labware are rendered but not both
    const topLabwareDefinition =
      labwareInAdapterInMod?.result?.definition ?? nestedLabwareDef
    const topLabwareId =
      labwareInAdapterInMod?.result?.labwareId ?? nestedLabwareId

    return {
      moduleModel: moduleDef.model,
      moduleLocation: { slotName },
      innerProps:
        moduleDef.model === THERMOCYCLER_MODULE_V1
          ? { lidMotorState: 'open' }
          : {},
      nestedLabwareDef: topLabwareDefinition,
      onLabwareClick:
        topLabwareDefinition != null && topLabwareId != null
          ? () => handleLabwareClick(topLabwareDefinition, topLabwareId)
          : undefined,
      moduleChildren: null,
    }
  })

  const labwareLocations = map(
    labwareRenderInfo,
    ({ labwareDef, slotName }, labwareId) => {
      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]
      //  only rendering the labware on top most layer so
      //  either the adapter or the labware are rendered but not both
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId

      return {
        labwareLocation: { slotName },
        definition: topLabwareDefinition,
        topLabwareId,
        onLabwareClick: () =>
          handleLabwareClick(topLabwareDefinition, topLabwareId),
        labwareChildren: null,
      }
    }
  )

  return (
    <Modal header={modalHeader} modalSize="large" onOutsideClick={onCloseClick}>
      <BaseDeck
        deckConfig={deckConfig}
        deckLayerBlocklist={getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE)}
        robotType={FLEX_ROBOT_TYPE}
        labwareLocations={labwareLocations}
        moduleLocations={moduleLocations}
      />
    </Modal>
  )
}
