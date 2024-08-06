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
  JUSTIFY_CENTER,
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
import tiprackAdapter from '../../../../assets/images/labware/opentrons_flex_96_tiprack_adapter.png'

const HIDE_SCROLLBAR = css`
  ::-webkit-scrollbar {
    display: none;
  }
`

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

  const topDefinition = getSlotLabwareDefinition(labwareIdTop, commands)
  const adapterDef = getSlotLabwareDefinition(adapterId ?? '', commands)
  const moduleDisplayName =
    moduleModel != null ? getModuleDisplayName(moduleModel) : null ?? ''
  const tiprackAdapterImg = (
    <img width="156px" height="130px" src={tiprackAdapter} />
  )
  const moduleImg =
    moduleModel != null ? (
      <img width="156px" height="130px" src={getModuleImage(moduleModel)} />
    ) : null

  return isOnDevice ? (
    <Modal
      onOutsideClick={closeModal}
      header={{
        title: (
          <Flex gridGap={SPACING.spacing4}>
            <DeckInfoLabel deckLabel={slotName} />
            <DeckInfoLabel iconName="stacked" />
          </Flex>
        ),
        onClick: closeModal,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        css={HIDE_SCROLLBAR}
        overflowY="scroll"
        gridGap={SPACING.spacing16}
        width="41.675rem"
      >
        <>
          <Flex
            alignItems={ALIGN_CENTER}
            height="6.875rem"
            gridGap={SPACING.spacing32}
          >
            <LabwareStackLabel
              isOnDevice
              text={labwareName}
              subText={labwareNickname}
            />
            <LabwareStackRender
              definitionTop={topDefinition}
              definitionBottom={adapterDef}
              highlightBottom={false}
              highlightTop={true}
            />
          </Flex>
          <Divider marginY={SPACING.spacing16} />
        </>
        {adapterDef != null ? (
          <>
            <Flex
              alignItems={ALIGN_CENTER}
              height="6.875rem"
              gridGap={SPACING.spacing32}
            >
              <LabwareStackLabel text={adapterName ?? ''} isOnDevice />
              {adapterDef.parameters.loadName ===
              'opentrons_flex_96_tiprack_adapter' ? (
                tiprackAdapterImg
              ) : (
                <LabwareStackRender
                  definitionTop={topDefinition}
                  definitionBottom={adapterDef}
                  highlightBottom={true}
                  highlightTop={false}
                />
              )}
            </Flex>
            {moduleModel != null ? (
              <Divider marginY={SPACING.spacing16} />
            ) : null}
          </>
        ) : null}
        {moduleModel != null ? (
          <Flex
            alignItems={ALIGN_CENTER}
            height="6.875rem"
            gridGap={SPACING.spacing32}
          >
            <LabwareStackLabel text={moduleDisplayName} isOnDevice />
            {moduleImg}
          </Flex>
        ) : null}
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
    >
      <Box padding={SPACING.spacing24} backgroundColor={COLORS.white}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <>
            <Flex
              alignItems={ALIGN_CENTER}
              height="6.875rem"
              gridGap={SPACING.spacing32}
            >
              <LabwareStackLabel text={labwareName} subText={labwareNickname} />
              <LabwareStackRender
                definitionTop={topDefinition}
                definitionBottom={adapterDef}
                highlightBottom={false}
                highlightTop={true}
              />
            </Flex>
            <Divider marginY={SPACING.spacing16} />
          </>
          {adapterDef != null ? (
            <>
              <Flex
                alignItems={ALIGN_CENTER}
                height="6.875rem"
                gridGap={SPACING.spacing32}
              >
                <LabwareStackLabel text={adapterName ?? ''} />
                <LabwareStackRender
                  definitionTop={topDefinition}
                  definitionBottom={adapterDef}
                  highlightBottom={true}
                  highlightTop={false}
                />
              </Flex>
              <Divider marginY={SPACING.spacing16} />
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
  isOnDevice?: boolean
}
function LabwareStackLabel(props: LabwareStackLabelProps): JSX.Element {
  const { text, subText, isOnDevice = false } = props
  return isOnDevice ? (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="28rem"
      flex="0 0 auto"
      justifyContent={JUSTIFY_CENTER}
    >
      <StyledText oddStyle="bodyTextBold">{text}</StyledText>
      {subText != null ? (
        <StyledText oddStyle="bodyTextRegular" color={COLORS.grey60}>
          {subText}
        </StyledText>
      ) : null}
    </Flex>
  ) : (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="14.75rem"
      flex="0 0 auto"
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
