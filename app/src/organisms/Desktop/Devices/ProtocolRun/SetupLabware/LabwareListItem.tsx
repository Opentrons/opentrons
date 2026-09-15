import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LabwareRender,
  ListButton,
  MODULE_ICON_NAME_BY_TYPE,
  RobotInfoLabel,
  SIZE_AUTO,
  SPACING,
  StyledText,
  Tag,
  TYPOGRAPHY,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  getLabwareLiquidRenderInfoFromStack,
  getLabwareViewBox,
  getModuleFromStack,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import { ToggleButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import { SecureLabwareModal } from './SecureLabwareModal'

import type { MouseEvent } from 'react'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  LabwareByLiquidId,
  LabwareDefinition,
  LabwareDefinitionsByURI,
  LabwareInStack,
  ModuleType,
  StackItem,
} from '@opentrons/shared-data'
import type { ModuleRenderInfoForProtocol } from '/app/resources/runs'
import type { ModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'

interface LabwareListItemProps {
  attachedModuleInfo: { [moduleId: string]: ModuleRenderInfoForProtocol }
  extraAttentionModules: ModuleTypesThatRequireExtraAttention[]
  isFlex: boolean
  slotName: string
  stackedItems: StackItem[]
  onClick: () => void
  offDeckQuantity?: number
  labwareByLiquidId?: LabwareByLiquidId
  showLabwareSVG?: boolean
  definitionsByURI?: LabwareDefinitionsByURI
  moduleTypeOverride?: ModuleType
}

export function LabwareListItem(
  props: LabwareListItemProps
): JSX.Element | null {
  const {
    stackedItems,
    slotName,
    offDeckQuantity,
    attachedModuleInfo,
    extraAttentionModules,
    isFlex,
    labwareByLiquidId,
    showLabwareSVG,
    definitionsByURI,
    moduleTypeOverride,
    onClick,
  } = props
  const moduleInStack = getModuleFromStack(stackedItems)
  const labwareInStack = stackedItems.filter(
    (lw): lw is LabwareInStack => 'labwareId' in lw
  )

  const labwareLiquidRenderInfo = getLabwareLiquidRenderInfoFromStack(
    labwareInStack,
    labwareByLiquidId
  )

  const isStacked =
    labwareLiquidRenderInfo.length > 1 ||
    labwareLiquidRenderInfo.some(labware => labware.quantity > 1)

  const { i18n, t } = useTranslation('protocol_setup')
  const [secureLabwareModalType, setSecureLabwareModalType] =
    useState<ModuleType | null>(null)
  const [isLatchLoading, setIsLatchLoading] = useState<boolean>(false)
  const [isLatchClosed, setIsLatchClosed] = useState<boolean>(false)

  const documentationState = useDocumentationState()
  const { createLiveCommand } = useCreateLiveCommandMutation(documentationState)

  let slotInfo: string | null = slotName
  if (slotName === 'offDeck') {
    slotInfo = i18n.format(t('off_deck'), 'upperCase')
  }

  let moduleType: ModuleType | null = null
  let secureLabwareInstructions: JSX.Element | null = null
  let isCorrectHeaterShakerAttached: boolean = false
  let isHeaterShakerInProtocol: boolean = false
  let latchCommand:
    HeaterShakerOpenLatchCreateCommand | HeaterShakerCloseLatchCreateCommand

  if (moduleInStack != null) {
    moduleType = getModuleType(moduleInStack.moduleModel)

    const moduleTypeNeedsAttention = extraAttentionModules.find(
      extraAttentionModType => extraAttentionModType === moduleType
    )

    switch (moduleTypeNeedsAttention) {
      case MAGNETIC_MODULE_TYPE:
      case THERMOCYCLER_MODULE_TYPE:
        if (moduleInStack.moduleModel !== THERMOCYCLER_MODULE_V2) {
          secureLabwareInstructions = (
            <Btn
              css={css`
                color: ${COLORS.grey50};

                &:hover {
                  color: ${COLORS.black90};
                }
              `}
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                setSecureLabwareModalType(moduleType)
              }}
            >
              <Flex flexDirection={DIRECTION_ROW} width="15rem">
                <Icon
                  name="information"
                  size="0.75rem"
                  marginTop={SPACING.spacing4}
                  color={COLORS.grey60}
                />
                <StyledText
                  marginLeft={SPACING.spacing4}
                  desktopStyle="bodyDefaultRegular"
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  color={COLORS.grey60}
                >
                  {t('secure_labware_instructions')}
                </StyledText>
              </Flex>
            </Btn>
          )
        }
        break
      case HEATERSHAKER_MODULE_TYPE:
        isHeaterShakerInProtocol = true
        const matchingHeaterShaker =
          attachedModuleInfo != null &&
          attachedModuleInfo[moduleInStack.moduleId] != null
            ? attachedModuleInfo[moduleInStack.moduleId].attachedModuleMatch
            : null
        if (
          matchingHeaterShaker != null &&
          matchingHeaterShaker.moduleType === HEATERSHAKER_MODULE_TYPE
        ) {
          if (
            (!isLatchClosed &&
              (matchingHeaterShaker.data.labwareLatchStatus === 'idle_closed' ||
                matchingHeaterShaker.data.labwareLatchStatus === 'closing')) ||
            (isLatchClosed &&
              (matchingHeaterShaker.data.labwareLatchStatus === 'idle_open' ||
                matchingHeaterShaker.data.labwareLatchStatus === 'opening'))
          ) {
            setIsLatchClosed(
              matchingHeaterShaker.data.labwareLatchStatus === 'idle_closed' ||
                matchingHeaterShaker.data.labwareLatchStatus === 'closing'
            )
            setIsLatchLoading(false)
          }
          latchCommand = {
            commandType: isLatchClosed
              ? 'heaterShaker/openLabwareLatch'
              : 'heaterShaker/closeLabwareLatch',
            params: { moduleId: matchingHeaterShaker.id },
          }
          //  Labware latch button is disabled unless the correct H-S is attached
          //  this is for MoaM support
          isCorrectHeaterShakerAttached = true
        }
    }
  }
  const toggleLatch = (e: MouseEvent): void => {
    e.stopPropagation()
    setIsLatchLoading(true)
    createLiveCommand({
      command: latchCommand,
    }).catch((e: Error) => {
      console.error(
        `error setting module status with command type ${latchCommand.commandType}: ${e.message}`
      )
    })
  }
  const commandType = isLatchClosed
    ? 'heaterShaker/openLabwareLatch'
    : 'heaterShaker/closeLabwareLatch'
  let hsLatchText: string = t('secure')
  if (commandType === 'heaterShaker/closeLabwareLatch' && isLatchLoading) {
    hsLatchText = t('closing')
  } else if (
    commandType === 'heaterShaker/openLabwareLatch' &&
    isLatchLoading
  ) {
    hsLatchText = t('opening')
  }

  const moduleComputedWithPotentialOverride = moduleType ?? moduleTypeOverride

  return (
    <ListButton
      onClick={onClick}
      type="noActive"
      gridGap={SPACING.spacing24}
      padding={SPACING.spacing12}
      alignItems={ALIGN_CENTER}
    >
      <Flex gridGap={SPACING.spacing2} flexWrap="wrap" width="6.25rem">
        {isFlex ? (
          <RobotInfoLabel deckLabel={slotInfo} />
        ) : (
          <StyledText
            css={TYPOGRAPHY.pSemiBold}
            data-testid={`slot_info_${slotInfo}`}
          >
            {slotInfo}
          </StyledText>
        )}
        {moduleComputedWithPotentialOverride != null ? (
          <RobotInfoLabel
            iconName={
              MODULE_ICON_NAME_BY_TYPE[moduleComputedWithPotentialOverride]
            }
          />
        ) : null}
        {isStacked ? <RobotInfoLabel iconName="stacked" /> : null}
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        width="100%"
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          width="100%"
        >
          <>
            {labwareLiquidRenderInfo.map((labware, index) => {
              const quantityTag = offDeckQuantity ?? labware.quantity
              return (
                <>
                  <Flex gridGap={SPACING.spacing24} alignItems={ALIGN_CENTER}>
                    {showLabwareSVG && definitionsByURI != null ? (
                      <StandaloneLabware
                        definition={definitionsByURI[labware.definitionUri]}
                      />
                    ) : null}
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gridGap={SPACING.spacing4}
                    >
                      <StyledText desktopStyle="bodyDefaultSemiBold">
                        {labware.displayName}
                      </StyledText>
                      {labware.lidDisplayName != null ? (
                        <StyledText
                          desktopStyle="bodyDefaultRegular"
                          color={COLORS.grey60}
                        >
                          {t('with_lid', {
                            lidDisplayName: labware.lidDisplayName,
                          })}
                        </StyledText>
                      ) : null}
                      {quantityTag > 1 || labware.liquids > 0 ? (
                        <Flex
                          flexDirection={DIRECTION_ROW}
                          gridGap={SPACING.spacing4}
                        >
                          {quantityTag > 1 ? (
                            <Tag
                              type="default"
                              text={t('labware_quantity', {
                                quantity: quantityTag,
                              })}
                            />
                          ) : null}
                          {labware.liquids > 0 ? (
                            <Tag
                              type="default"
                              text={
                                labware.quantity > 1
                                  ? t('multiple_liquid_layouts')
                                  : t('number_of_liquids', {
                                      number: labware.liquids,
                                      count: labware.liquids,
                                    })
                              }
                            />
                          ) : null}
                        </Flex>
                      ) : null}
                    </Flex>
                  </Flex>
                  {index !== labwareLiquidRenderInfo.length - 1 ? (
                    <Box
                      borderBottom={`1px solid ${String(COLORS.grey40)}`}
                      marginY="0"
                      width="100%"
                    />
                  ) : null}
                </>
              )
            })}
          </>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing24}
          alignItems={ALIGN_FLEX_END}
          marginLeft={SPACING.spacing24}
        >
          {secureLabwareInstructions ?? null}
          {isHeaterShakerInProtocol ? (
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.grey60}
                minWidth="6.2rem"
              >
                {t('labware_latch')}
              </StyledText>
              <Flex
                flexDirection={DIRECTION_ROW}
                gridGap={SPACING.spacing4}
                marginTop="3px"
              >
                <ToggleButton
                  label={`heater_shaker_${slotInfo ?? ''}_latch_toggle`}
                  size={SIZE_AUTO}
                  disabled={!isCorrectHeaterShakerAttached || isLatchLoading}
                  toggledOn={isLatchClosed}
                  onClick={toggleLatch}
                  display={DISPLAY_FLEX}
                  alignItems={ALIGN_CENTER}
                />
                <StyledText desktopStyle="bodyDefaultRegular" width="4rem">
                  {hsLatchText}
                </StyledText>
              </Flex>
            </Flex>
          ) : null}
        </Flex>
        <Icon
          name="more"
          size={SPACING.spacing24}
          marginLeft={SPACING.spacing24}
        />
      </Flex>
      {secureLabwareModalType != null && (
        <SecureLabwareModal
          type={secureLabwareModalType as ModuleTypesThatRequireExtraAttention}
          onCloseClick={() => {
            setSecureLabwareModalType(null)
          }}
        />
      )}
    </ListButton>
  )
}

const LabwareThumbnail = styled.svg`
  transform: scale(1, -1);
  width: 4.2rem;
  flex-shrink: 0;
`

function StandaloneLabware(props: {
  definition: LabwareDefinition
}): JSX.Element {
  const { definition } = props
  const { minX, minY, xDimension, yDimension } = getLabwareViewBox(definition)

  return (
    <LabwareThumbnail viewBox={`${minX} ${minY} ${xDimension} ${yDimension}`}>
      <LabwareRender
        definition={definition}
        positioningMode="passThrough"
        wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
      />
    </LabwareThumbnail>
  )
}
