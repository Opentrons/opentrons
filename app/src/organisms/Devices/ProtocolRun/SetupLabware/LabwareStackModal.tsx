import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LabwareStackRender,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { Modal } from '../../../../molecules/Modal'
import { getIsOnDevice } from '../../../../redux/config'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { getLocationInfoNames } from '../utils/getLocationInfoNames'
import { getSlotLabwareDefinition } from '../utils/getSlotLabwareDefinition'
import { Divider } from '../../../../atoms/structure'
import { getModuleImage } from '../SetupModuleAndDeck/utils'
import { getModuleDisplayName } from '@opentrons/shared-data'

interface LabwareStackModalProps {
  labwareIdTop: string
  runId: string
  closeModal: () => void
}

export const LabwareStackModal = (
  props: LabwareStackModalProps
): JSX.Element | null => {
  const { labwareIdTop, runId, closeModal } = props
  const { t } = useTranslation('protocol_setup')
  const isOnDevice = useSelector(getIsOnDevice)
  const protocolData = useMostRecentCompletedAnalysis(runId)
  if (protocolData == null) {
    return null
  }
  const commands = protocolData?.commands ?? []
  const {
    slotName,
    adapterName,
    adapterId,
    moduleModel,
    labwareName,
    labwareNickname,
  } = getLocationInfoNames(labwareIdTop, commands)
  // working up to here

  const topDefinition = getSlotLabwareDefinition(
    labwareIdTop,
    protocolData.commands
  )
  const isAdapterOnly =
    adapterId == null && topDefinition.metadata.displayCategory === 'adapter'
  const moduleDisplayName =
    moduleModel != null ? getModuleDisplayName(moduleModel) : null ?? ''
  const moduleImg =
    moduleModel != null ? (
      <img width="156px" height="140px" src={getModuleImage(moduleModel)} />
    ) : null
  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `

  const adapterDef = getSlotLabwareDefinition(adapterId ?? '', commands)
  return isOnDevice ? (
    <Modal
      modalSize="large"
      onOutsideClick={closeModal}
      header={{
        title: labwareName,
        hasExitIcon: true,
        onClick: closeModal,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        height="23.70375rem"
        css={HIDE_SCROLLBAR}
        minWidth="10.313rem"
        overflowY="scroll"
        gridGap={SPACING.spacing16}
      >
        {}
      </Flex>
      <Flex width="38.75rem">
        <Flex marginLeft={SPACING.spacing32}>
          <svg
            viewBox="0.5 2.2 127 78"
            height="100%"
            width="100%"
            transform="scale(1, -1)"
          >
            {}
          </svg>
        </Flex>
      </Flex>
    </Modal>
  ) : (
    <LegacyModal
      onClose={closeModal}
      closeOnOutsideClick
      title={
        <Flex gridGap={SPACING.spacing8}>
          <DeckInfoLabel deckLabel={slotName} />
          <DeckInfoLabel iconName="stacked" />
          <StyledText>{t('stacked_slot')}</StyledText>
        </Flex>
      }
      childrenPadding={0}
      width="31.25rem"
    >
      <Box
        padding={SPACING.spacing24}
        backgroundColor={COLORS.white}
        height="28.125rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <>
            <Flex
              alignItems={ALIGN_CENTER}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              height="6.875rem"
            >
              <LabwareStackLabel text={labwareName} subText={labwareNickname} />
              <svg
                viewBox="-150 -120 300 300"
                transform={
                  isAdapterOnly ? 'scale(1.25, -1.25)' : 'scale(1.25, -0.75)'
                }
              >
                <LabwareStackRender
                  definitionTop={topDefinition}
                  definitionBottom={adapterDef}
                  highlightBottom={false}
                  highlightTop={true}
                />
              </svg>
            </Flex>
            <Divider marginY={SPACING.spacing16} />
          </>
          {adapterDef != null ? (
            <>
              <Flex
                alignItems={ALIGN_CENTER}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                height="6.875rem"
              >
                <LabwareStackLabel text={adapterName ?? ''} />
                <svg
                  viewBox="-150 -120 300 300"
                  transform={'scale(1.25, -0.75)'}
                >
                  <LabwareStackRender
                    definitionTop={topDefinition}
                    definitionBottom={adapterDef}
                    highlightBottom={true}
                    highlightTop={false}
                  />
                </svg>
              </Flex>
              {moduleModel != null ? (
                <Divider marginY={SPACING.spacing16} />
              ) : null}
            </>
          ) : null}
          {moduleModel != null ? (
            <Flex
              alignItems={ALIGN_CENTER}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              height="6.875rem"
            >
              <LabwareStackLabel text={moduleDisplayName} />
              {moduleImg}
            </Flex>
          ) : null}
        </Flex>
      </Box>
    </LegacyModal>
  )
}

interface LabwareStackLabelProps {
  text: string
  subText?: string
}
function LabwareStackLabel(props: LabwareStackLabelProps): JSX.Element {
  const { text, subText } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      minWidth="14.75rem"
      maxWidth="14.75rem"
    >
      <StyledText desktopStyle="bodyLargeSemiBold">{text}</StyledText>
      {subText != null ? (
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {subText}
        </StyledText>
      ) : null}
    </Flex>
  )
}
