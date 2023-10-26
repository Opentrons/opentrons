import * as React from 'react'
import map from 'lodash/map'
import { useTranslation } from 'react-i18next'
import {
  BaseDeck,
  EXTENDED_DECK_CONFIG_FIXTURE,
  LabwareRender,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  LabwareDefinition2,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import { RunTimeCommand } from '@opentrons/shared-data'

import { Modal } from '../../molecules/Modal'
import { getDeckConfigFromProtocolCommands } from '../../resources/deck_configuration/utils'
import { useFeatureFlag } from '../../redux/config'
import { getStandardDeckViewLayerBlockList } from '../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'
import { getLabwareRenderInfo } from '../Devices/ProtocolRun/utils/getLabwareRenderInfo'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { AttachedProtocolModuleMatch } from '../ProtocolSetupModulesAndDeck/utils'

import type { LoadedLabwareByAdapter } from '@opentrons/api-client'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface LabwareMapViewModalProps {
  runId: string
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  handleLabwareClick: (
    labwareDef: LabwareDefinition2,
    labwareId: string
  ) => void
  onCloseClick: () => void
  initialLoadedLabwareByAdapter: LoadedLabwareByAdapter
  commands: RunTimeCommand[]
}

export function LabwareMapViewModal({
  handleLabwareClick,
  runId,
  onCloseClick,
  attachedProtocolModuleMatches,
  initialLoadedLabwareByAdapter,
  commands,
}: LabwareMapViewModalProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const enableDeckConfig = useFeatureFlag('enableDeckConfiguration')

  const deckConfig = enableDeckConfig
    ? EXTENDED_DECK_CONFIG_FIXTURE
    : getDeckConfigFromProtocolCommands(commands)

  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const labwareRenderInfo =
    mostRecentAnalysis != null
      ? getLabwareRenderInfo(mostRecentAnalysis, deckDef)
      : {}

  const modalHeader: ModalHeaderBaseProps = {
    title: t('map_view'),
    hasExitIcon: true,
  }

  const moduleLocations = attachedProtocolModuleMatches.map(module => {
    const {
      moduleDef,
      nestedLabwareDef,
      nestedLabwareId,
      slotName,
      x,
      y,
    } = module
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
      moduleChildren:
        topLabwareDefinition != null && topLabwareId != null ? (
          <React.Fragment
            key={`LabwareSetup_Labware_${topLabwareId}_${x}_${y}`}
          >
            <LabwareRender
              definition={topLabwareDefinition}
              onLabwareClick={() =>
                handleLabwareClick(topLabwareDefinition, topLabwareId)
              }
            />
          </React.Fragment>
        ) : null,
    }
  })

  const labwareLocations = map(
    labwareRenderInfo,
    ({ x, y, labwareDef, slotName }, labwareId) => {
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
        labwareChildren: (
          <React.Fragment key={`LabwareSetup_Labware_${topLabwareId}_${x}${y}`}>
            <LabwareRender
              definition={topLabwareDefinition}
              onLabwareClick={() =>
                handleLabwareClick(topLabwareDefinition, topLabwareId)
              }
            />
          </React.Fragment>
        ),
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
