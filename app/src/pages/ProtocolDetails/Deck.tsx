import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import last from 'lodash/last'
import styled from 'styled-components'

import {
  ALIGN_FLEX_START,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LabwareRender,
  LegacyStyledText,
  ProtocolDeck,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import { getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'

import { getTopPortalEl } from '../../App/portal'
import { Modal } from '../../molecules/Modal'
import { LabwareStackModal } from '../../organisms/Devices/ProtocolRun/SetupLabware/LabwareStackModal'
import { getLabwareSetupItemGroups } from '../../pages/Protocols/utils'

import type {
  LabwareDefinition2,
  LabwareLocation,
} from '@opentrons/shared-data'

const LabwareThumbnail = styled.svg`
  transform: scale(1, -1);
  width: 12rem;
  flex-shrink: 0;
`

export const Deck = (props: { protocolId: string }): JSX.Element => {
  const { t } = useTranslation('protocol_setup')
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
  ] = React.useState<boolean>(false)
  const [selectedLabware, setSelectedLabware] = React.useState<
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
      const nickName = onDeckItems.find(
        item => getLabwareDefURI(item.definition) === foundLabware.definitionUri
      )?.nickName
      setSelectedLabware({
        ...labwareDef,
        location: foundLabware.location,
        nickName: nickName ?? null,
        id: labwareId,
      })
      setShowLabwareDetailsModal(true)
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

  let location: JSX.Element | string | null = null
  if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'slotName' in selectedLabware?.location
  ) {
    location = <DeckInfoLabel deckLabel={selectedLabware?.location.slotName} />
  } else if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'addressableAreaName' in selectedLabware?.location
  ) {
    location = (
      <DeckInfoLabel
        deckLabel={selectedLabware?.location.addressableAreaName}
      />
    )
  }

  const selectedLabwareLocation = selectedLabware?.location

  return (
    <>
      {createPortal(
        <>
          {showLabwareDetailsModal &&
          !selectedLabwareIsTopOfStack &&
          selectedLabware != null ? (
            <Modal
              onOutsideClick={() => {
                setShowLabwareDetailsModal(false)
                setSelectedLabware(null)
              }}
            >
              <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  alignItems={ALIGN_FLEX_START}
                  gridGap={SPACING.spacing12}
                >
                  <Flex gridGap={SPACING.spacing4}>{location}</Flex>
                  <LegacyStyledText
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    fontSize={TYPOGRAPHY.fontSize22}
                  >
                    {getLabwareDisplayName(selectedLabware)}
                  </LegacyStyledText>
                  <LegacyStyledText as="p" color={COLORS.grey60}>
                    {selectedLabware.nickName}
                    {selectedLabwareLocation != null &&
                    selectedLabwareLocation !== 'offDeck' &&
                    'labwareId' in selectedLabwareLocation
                      ? t('on_adapter', {
                          adapterName: mostRecentAnalysis?.labware.find(
                            l => l.id === selectedLabwareLocation.labwareId
                          )?.displayName,
                        })
                      : null}
                  </LegacyStyledText>
                </Flex>
                <LabwareThumbnail
                  viewBox={`${selectedLabware.cornerOffsetFromSlot.x} ${selectedLabware.cornerOffsetFromSlot.y} ${selectedLabware.dimensions.xDimension} ${selectedLabware.dimensions.yDimension}`}
                >
                  <LabwareRender definition={selectedLabware} />
                </LabwareThumbnail>
              </Flex>
            </Modal>
          ) : null}
        </>,
        getTopPortalEl()
      )}
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
