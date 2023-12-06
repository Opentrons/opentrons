import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { BaseDeck } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getSimplestDeckConfigForProtocol,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { Modal } from '../../molecules/Modal'
import { getStandardDeckViewLayerBlockList } from '../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'
import { AttachedProtocolModuleMatch } from '../ProtocolSetupModulesAndDeck/utils'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
  LoadLabwareRunTimeCommand,
} from '@opentrons/shared-data'
import type { LoadedLabwareByAdapter } from '@opentrons/api-client'
import type { LabwareOnDeck } from '@opentrons/components'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface LabwareMapViewModalProps {
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  handleLabwareClick: (
    labwareDef: LabwareDefinition2,
    labwareId: string
  ) => void
  onCloseClick: () => void
  initialLoadedLabwareByAdapter: LoadedLabwareByAdapter
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
    mostRecentAnalysis,
  } = props
  const { t } = useTranslation('protocol_setup')
  const deckConfig = getSimplestDeckConfigForProtocol(mostRecentAnalysis)

  const modalHeader: ModalHeaderBaseProps = {
    title: t('map_view'),
    hasExitIcon: true,
  }

  const modulesOnDeck = attachedProtocolModuleMatches.map(module => {
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

  const labwareOnDeck = mostRecentAnalysis?.commands
    .filter(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware'
    )
    .reduce<LabwareOnDeck[]>((acc, command) => {
      const labwareId = command.result?.labwareId
      const location = command.params.location
      const displayName = command.params.displayName ?? null
      const labwareDef = command.result?.definition
      if (
        location === 'offDeck' ||
        'moduleId' in location ||
        'labwareId' in location
      )
        return acc
      if (labwareId == null) {
        console.warn('expected to find labware id but could not')
        return acc
      }
      if (labwareDef == null) {
        console.warn(
          `expected to find labware def for labware id ${String(
            labwareId
          )} but could not`
        )
        return acc
      }

      const slotName =
        'addressableAreaName' in location
          ? location.addressableAreaName
          : location.slotName

      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]

      //  NOTE: only rendering the labware on top most layer so
      //  either the adapter or the labware are rendered but not both
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId

      return [
        ...acc,
        {
          labwareLocation: { slotName },
          definition: topLabwareDefinition,
          displayName: displayName,
          onLabwareClick: () =>
            handleLabwareClick(topLabwareDefinition, topLabwareId),
          labwareChildren: null,
        },
      ]
    }, [])

  return (
    <Modal header={modalHeader} modalSize="large" onOutsideClick={onCloseClick}>
      <BaseDeck
        deckConfig={deckConfig}
        deckLayerBlocklist={getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE)}
        robotType={FLEX_ROBOT_TYPE}
        labwareOnDeck={labwareOnDeck}
        modulesOnDeck={modulesOnDeck}
      />
    </Modal>
  )
}
