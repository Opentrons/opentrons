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
  Modal,
} from '@opentrons/components'
import { OddModal } from '/app/molecules/OddModal'
import { getIsOnDevice } from '/app/redux/config'
import { getLocationInfoNames } from '../utils/getLocationInfoNames'
import { getSlotLabwareDefinition } from '../utils/getSlotLabwareDefinition'
import { Divider } from '/app/atoms/structure'
import { getModuleImage } from '../SetupModuleAndDeck/utils'
import {
  FLEX_ROBOT_TYPE,
  getModuleDisplayName,
  getModuleType,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import tiprackAdapter from '/app/assets/images/labware/opentrons_flex_96_tiprack_adapter.png'

import type { RobotType, RunTimeCommand } from '@opentrons/shared-data'

const HIDE_SCROLLBAR = css`
  ::-webkit-scrollbar {
    display: none;
  }
`

const IMAGE_STYLE = css`
  max-width: 11.5rem;
  max-height: 6.875rem;
`

const IMAGE_CONTAINER_STYLE = css`
  width: 11.5rem;
  height: 100%;
  justify-content: ${JUSTIFY_CENTER};
`

const LIST_ITEM_STYLE = css`
  align-items: ${ALIGN_CENTER};
  height: 6.875rem;
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
`

interface LabwareStackModalProps {
  labwareIdTop: string
  commands: RunTimeCommand[] | null
  closeModal: () => void
  robotType?: RobotType
}

export const LabwareStackModal = (
  props: LabwareStackModalProps
): JSX.Element | null => {
  const {
    labwareIdTop,
    commands,
    closeModal,
    robotType = FLEX_ROBOT_TYPE,
  } = props
  const { t } = useTranslation('protocol_setup')
  const isOnDevice = useSelector(getIsOnDevice)

  if (commands == null) {
    return null
  }
  const {
    slotName,
    adapterName,
    adapterId,
    moduleModel,
    labwareName,
    labwareNickname,
  } = getLocationInfoNames(labwareIdTop, commands)

  const topDefinition = getSlotLabwareDefinition(labwareIdTop, commands)
  const adapterDef =
    adapterId != null
      ? getSlotLabwareDefinition(adapterId ?? '', commands)
      : null
  const isModuleThermocycler =
    moduleModel == null
      ? false
      : getModuleType(moduleModel) === THERMOCYCLER_MODULE_TYPE
  const thermocyclerLocation =
    robotType === FLEX_ROBOT_TYPE
      ? TC_MODULE_LOCATION_OT3
      : TC_MODULE_LOCATION_OT2
  const moduleDisplayName =
    moduleModel != null ? getModuleDisplayName(moduleModel) : null ?? ''
  const isAdapterForTiprack =
    adapterDef?.parameters.loadName === 'opentrons_flex_96_tiprack_adapter'
  const tiprackAdapterImg = <img src={tiprackAdapter} css={IMAGE_STYLE} />
  const moduleImg =
    moduleModel != null ? (
      <img src={getModuleImage(moduleModel, true)} css={IMAGE_STYLE} />
    ) : null

  return isOnDevice ? (
    <OddModal
      onOutsideClick={closeModal}
      header={{
        title: (
          <Flex gridGap={SPACING.spacing8}>
            <DeckInfoLabel
              deckLabel={isModuleThermocycler ? thermocyclerLocation : slotName}
            />
            <DeckInfoLabel iconName="stacked" />
          </Flex>
        ),
        onClick: closeModal,
        padding: `${SPACING.spacing32} ${SPACING.spacing32} ${SPACING.spacing12}`,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        css={HIDE_SCROLLBAR}
        overflowY="scroll"
        width="41.675rem"
      >
        <>
          <Flex css={LIST_ITEM_STYLE}>
            <LabwareStackLabel
              isOnDevice
              text={labwareName}
              subText={labwareNickname}
            />
            <Flex css={IMAGE_CONTAINER_STYLE}>
              <LabwareStackRender
                definitionTop={topDefinition}
                definitionBottom={adapterDef}
                highlightBottom={false}
                highlightTop={adapterDef != null && !isAdapterForTiprack}
              />
            </Flex>
          </Flex>
          <Divider marginY={SPACING.spacing16} />
        </>
        {adapterDef != null ? (
          <>
            <Flex css={LIST_ITEM_STYLE}>
              <LabwareStackLabel text={adapterName ?? ''} isOnDevice />
              {isAdapterForTiprack ? (
                <Flex css={IMAGE_CONTAINER_STYLE}>{tiprackAdapterImg}</Flex>
              ) : (
                <Flex css={IMAGE_CONTAINER_STYLE}>
                  <LabwareStackRender
                    definitionTop={topDefinition}
                    definitionBottom={adapterDef}
                    highlightBottom={true}
                    highlightTop={false}
                  />
                </Flex>
              )}
            </Flex>
            {moduleModel != null ? (
              <Divider marginY={SPACING.spacing16} />
            ) : null}
          </>
        ) : null}
        {moduleModel != null ? (
          <Flex css={LIST_ITEM_STYLE}>
            <LabwareStackLabel text={moduleDisplayName} isOnDevice />
            <Flex css={IMAGE_CONTAINER_STYLE}>{moduleImg}</Flex>
          </Flex>
        ) : null}
      </Flex>
    </OddModal>
  ) : (
    <Modal
      onClose={closeModal}
      closeOnOutsideClick
      title={t('stacked_slot')}
      titleElement1={
        <DeckInfoLabel
          deckLabel={isModuleThermocycler ? thermocyclerLocation : slotName}
        />
      }
      titleElement2={<DeckInfoLabel iconName="stacked" />}
      childrenPadding={0}
      marginLeft="0"
    >
      <Box padding={SPACING.spacing24} backgroundColor={COLORS.white}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <>
            <Flex css={LIST_ITEM_STYLE}>
              <LabwareStackLabel text={labwareName} subText={labwareNickname} />
              <Flex css={IMAGE_CONTAINER_STYLE}>
                <LabwareStackRender
                  definitionTop={topDefinition}
                  definitionBottom={adapterDef}
                  highlightBottom={false}
                  highlightTop={adapterDef != null && !isAdapterForTiprack}
                />
              </Flex>
            </Flex>
            <Divider marginY={SPACING.spacing16} />
          </>
          {adapterDef != null ? (
            <>
              <Flex css={LIST_ITEM_STYLE}>
                <LabwareStackLabel text={adapterName ?? ''} />
                {isAdapterForTiprack ? (
                  <Flex css={IMAGE_CONTAINER_STYLE}>{tiprackAdapterImg}</Flex>
                ) : (
                  <Flex css={IMAGE_CONTAINER_STYLE}>
                    <LabwareStackRender
                      definitionTop={topDefinition}
                      definitionBottom={adapterDef}
                      highlightBottom
                      highlightTop={false}
                    />
                  </Flex>
                )}
              </Flex>
              {moduleModel != null ? (
                <Divider marginY={SPACING.spacing16} />
              ) : null}
            </>
          ) : null}
          {moduleModel != null ? (
            <Flex css={LIST_ITEM_STYLE}>
              <LabwareStackLabel text={moduleDisplayName} />
              <Flex css={IMAGE_CONTAINER_STYLE}>{moduleImg}</Flex>
            </Flex>
          ) : null}
        </Flex>
      </Box>
    </Modal>
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
