import { useState } from 'react'
import last from 'lodash/last'

import { Flex, ProtocolDeck, SPACING } from '@opentrons/components'
import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import { getLabwareDefURI } from '@opentrons/shared-data'

import { LabwareStackModal } from '/app/molecules/LabwareStackModal'
import { SingleLabwareModal } from '/app/organisms/ODD/ProtocolSetup/ProtocolSetupLabware/SingleLabwareModal'
import { getLabwareSetupItemGroups } from '/app/transformations/commands'

import type {
  LabwareDefinition2,
  LabwareLocation,
} from '@opentrons/shared-data'

export const Deck = (props: { protocolId: string }): JSX.Element => {
  const { data: protocolData } = useProtocolQuery(props.protocolId)
  const {
    data: mostRecentAnalysis,
  } = useProtocolAnalysisAsDocumentQuery(
    props.protocolId,
    last(protocolData?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )

  const [
    showLabwareDetailsModal,
    setShowLabwareDetailsModal,
  ] = useState<boolean>(false)
  const [selectedLabware, setSelectedLabware] = useState<
    | (LabwareDefinition2 & {
        location: LabwareLocation
        nickName: string | null
        id: string
      })
    | null
  >(null)

  const { onDeckItems } = getLabwareSetupItemGroups(
    mostRecentAnalysis?.commands ?? []
  )

  const handleLabwareClick = (
    labwareDef: LabwareDefinition2,
    labwareId: string
  ): void => {
    const foundLabware = mostRecentAnalysis?.labware.find(
      labware => labware.id === labwareId
    )
    if (foundLabware != null) {
      const location = onDeckItems.find(
        item => item.labwareId === foundLabware.id
      )?.initialLocation
      const nickName = onDeckItems.find(
        item => getLabwareDefURI(item.definition) === foundLabware.definitionUri
      )?.nickName
      if (location != null) {
        setSelectedLabware({
          ...labwareDef,
          location: location,
          nickName: nickName ?? null,
          id: labwareId,
        })
        setShowLabwareDetailsModal(true)
      } else {
        console.warn('no initial labware location found')
      }
    }
  }

  const selectedLabwareIsTopOfStack = mostRecentAnalysis?.commands.some(
    command =>
      command.commandType === 'loadLabware' &&
      command.result?.labwareId === selectedLabware?.id &&
      typeof command.params.location === 'object' &&
      ('moduleId' in command.params.location ||
        'labwareId' in command.params.location)
  )

  return (
    <>
      {showLabwareDetailsModal &&
      !selectedLabwareIsTopOfStack &&
      selectedLabware != null ? (
        <SingleLabwareModal
          selectedLabware={selectedLabware}
          onOutsideClick={() => {
            setShowLabwareDetailsModal(false)
            setSelectedLabware(null)
          }}
          mostRecentAnalysis={mostRecentAnalysis ?? null}
        />
      ) : null}
      {showLabwareDetailsModal &&
      selectedLabware != null &&
      selectedLabwareIsTopOfStack ? (
        <LabwareStackModal
          labwareIdTop={selectedLabware?.id}
          commands={mostRecentAnalysis?.commands ?? null}
          closeModal={() => {
            setSelectedLabware(null)
            setShowLabwareDetailsModal(false)
          }}
        />
      ) : null}
      <Flex height="26.9375rem" paddingY={SPACING.spacing24}>
        {mostRecentAnalysis != null ? (
          <ProtocolDeck
            protocolAnalysis={mostRecentAnalysis}
            handleLabwareClick={handleLabwareClick}
            baseDeckProps={{ showSlotLabels: true }}
          />
        ) : null}
      </Flex>
    </>
  )
}
