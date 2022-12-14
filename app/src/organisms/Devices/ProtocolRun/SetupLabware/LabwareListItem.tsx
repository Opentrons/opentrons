import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  Flex,
  SPACING,
  Icon,
  COLORS,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  LabwareRender,
  Btn,
  BORDERS,
  WELL_LABEL_OPTIONS,
  SIZE_AUTO,
} from '@opentrons/components'
import {
  getLabwareDisplayName,
  getModuleDisplayName,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  LabwareDefinition2,
  MAGNETIC_MODULE_TYPE,
  ModuleType,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { ToggleButton } from '../../../../atoms/buttons'
import { StyledText } from '../../../../atoms/text'
import { SecureLabwareModal } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/SecureLabwareModal'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { ModuleTypesThatRequireExtraAttention } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
import type { ModuleRenderInfoForProtocol } from '../../hooks'
import type { LabwareSetupItem } from './types'

const LabwareRow = styled.div`
  display: grid;
  grid-template-columns: 6fr 5fr;
  border-style: ${BORDERS.styleSolid};
  border-width: ${SPACING.spacingXXS};
  border-color: ${COLORS.medGreyEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing4};
`

interface LabwareListItemProps extends LabwareSetupItem {
  attachedModuleInfo: { [moduleId: string]: ModuleRenderInfoForProtocol }
  extraAttentionModules: ModuleTypesThatRequireExtraAttention[]
  isOt3: boolean
}

export function LabwareListItem(
  props: LabwareListItemProps
): JSX.Element | null {
  const {
    attachedModuleInfo,
    nickName,
    initialLocation,
    definition,
    moduleModel,
    moduleLocation,
    extraAttentionModules,
    isOt3,
  } = props
  const { t } = useTranslation('protocol_setup')
  const [
    secureLabwareModalType,
    setSecureLabwareModalType,
  ] = React.useState<ModuleType | null>(null)
  const labwareDisplayName = getLabwareDisplayName(definition)
  const { createLiveCommand } = useCreateLiveCommandMutation()

  let slotInfo: JSX.Element | null =
    initialLocation === 'offDeck'
      ? null
      : t('slot_location', {
          slotName: Object.values(initialLocation),
        })
  let extraAttentionText: JSX.Element | null = null
  let isCorrectHeaterShakerAttached: boolean = false
  let isHeaterShakerInProtocol: boolean = false
  let isLatchClosed: boolean = false
  let latchCommand:
    | HeaterShakerOpenLatchCreateCommand
    | HeaterShakerCloseLatchCreateCommand

  if (
    initialLocation !== 'offDeck' &&
    'moduleId' in initialLocation &&
    moduleLocation != null &&
    moduleModel != null
  ) {
    const moduleName = getModuleDisplayName(moduleModel)
    const moduleType = getModuleType(moduleModel)
    const moduleTypeNeedsAttention = extraAttentionModules.find(
      extraAttentionModType => extraAttentionModType === moduleType
    )
    let moduleSlotName = moduleLocation.slotName
    if (moduleType === THERMOCYCLER_MODULE_TYPE) {
      moduleSlotName = isOt3 ? TC_MODULE_LOCATION_OT3 : TC_MODULE_LOCATION_OT2
    }
    slotInfo = t('module_slot_location', {
      slotName: moduleSlotName,
      moduleName: moduleName,
    })
    switch (moduleTypeNeedsAttention) {
      case MAGNETIC_MODULE_TYPE:
      case THERMOCYCLER_MODULE_TYPE:
        if (moduleModel !== THERMOCYCLER_MODULE_V2) {
          extraAttentionText = (
            <Btn
              css={css`
                color: ${COLORS.darkGreyEnabled};

                &:hover {
                  color: ${COLORS.darkBlackEnabled};
                }
              `}
              onClick={() => setSecureLabwareModalType(moduleType)}
            >
              <Flex flexDirection={DIRECTION_ROW}>
                <Icon
                  name="information"
                  size="0.75rem"
                  marginTop={SPACING.spacingXS}
                />
                <StyledText
                  marginLeft={SPACING.spacing2}
                  as="p"
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
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
        extraAttentionText = (
          <StyledText as="p" color={COLORS.darkGreyEnabled}>
            {t('heater_shaker_labware_list_view')}
          </StyledText>
        )
        const matchingHeaterShaker =
          attachedModuleInfo != null &&
          attachedModuleInfo[initialLocation.moduleId] != null
            ? attachedModuleInfo[initialLocation.moduleId].attachedModuleMatch
            : null
        if (
          matchingHeaterShaker != null &&
          matchingHeaterShaker.moduleType === HEATERSHAKER_MODULE_TYPE
        ) {
          isLatchClosed =
            matchingHeaterShaker.data.labwareLatchStatus === 'idle_closed' ||
            matchingHeaterShaker.data.labwareLatchStatus === 'closing'

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
  const toggleLatch = (): void => {
    createLiveCommand({
      command: latchCommand,
    }).catch((e: Error) => {
      console.error(
        `error setting module status with command type ${latchCommand.commandType}: ${e.message}`
      )
    })
  }
  return (
    <LabwareRow>
      <Flex>
        <StandaloneLabware definition={definition} />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_CENTER}
          marginLeft={SPACING.spacing4}
          marginRight={SPACING.spacing5}
        >
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {labwareDisplayName}
          </StyledText>
          <StyledText as="p" color={COLORS.darkGreyEnabled}>
            {nickName}
          </StyledText>
        </Flex>
      </Flex>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing3}
      >
        <Flex flexDirection={DIRECTION_COLUMN} justifyContent={JUSTIFY_CENTER}>
          <StyledText as="p">{slotInfo}</StyledText>
          {extraAttentionText != null ? extraAttentionText : null}
        </Flex>
        {isHeaterShakerInProtocol ? (
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="h6" minWidth="4.62rem">
              {t('labware_latch')}
            </StyledText>
            <Flex
              flexDirection={DIRECTION_ROW}
              alignItems={ALIGN_CENTER}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              marginTop={SPACING.spacingS}
            >
              <ToggleButton
                label={`heater_shaker_${
                  moduleLocation?.slotName ?? ''
                }_latch_toggle`}
                size={SIZE_AUTO}
                disabled={!isCorrectHeaterShakerAttached}
                toggledOn={isLatchClosed}
                onClick={toggleLatch}
                display="flex"
                alignItems={ALIGN_CENTER}
              />
              <StyledText as="p">{t('secure')}</StyledText>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
      {secureLabwareModalType != null && (
        <SecureLabwareModal
          type={secureLabwareModalType as ModuleTypesThatRequireExtraAttention}
          onCloseClick={() => setSecureLabwareModalType(null)}
        />
      )}
    </LabwareRow>
  )
}

const LabwareThumbnail = styled.svg`
  transform: scale(1, -1);
  width: 4.2rem;
  flex-shrink: 0;
`

function StandaloneLabware(props: {
  definition: LabwareDefinition2
}): JSX.Element {
  const { definition } = props
  return (
    <LabwareThumbnail
      viewBox={` 0 0 ${definition.dimensions.xDimension} ${definition.dimensions.yDimension}`}
    >
      <LabwareRender
        definition={definition}
        wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
      />
    </LabwareThumbnail>
  )
}
