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
  RobotWorkSpace,
  LabwareRender,
  Btn,
  BORDERS,
  WRAP,
  POSITION_FIXED,
} from '@opentrons/components'
import {
  getLabwareDisplayName,
  getModuleDisplayName,
  getModuleType,
  LabwareDefinition2,
  MAGNETIC_MODULE_TYPE,
  ModuleType,
  TC_MODULE_LOCATION,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { StyledText } from '../../../../atoms/text'
import { SecureLabwareModal } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/SecureLabwareModal'
import { useProtocolDetailsForRun } from '../../../Devices/hooks'
import { getAllLabwareAndTiprackIdsInOrder } from './utils'
import type {
  LoadLabwareRunTimeCommand,
  LoadModuleRunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type { ModuleTypesThatRequiresExtraAttention } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'

const LABWARE_CARD_STYLE = css`
  box-shadow: 0 0 0 1px ${COLORS.medGreyEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
  &:hover {
    cursor: pointer;
    box-shadow: 0 0 0 1px ${COLORS.medGreyHover};
  }
`
const StyledTable = styled.table`
  width: 100%;
  text-align: ${TYPOGRAPHY.textAlignLeft};
  table-layout: ${POSITION_FIXED};
`
const StyledTableHeader = styled.th`
  ${TYPOGRAPHY.labelSemiBold}
  padding: ${SPACING.spacing3};
`
const StyledTableRow = styled.tr``
const StyledTableCell = styled.td`
  padding: ${SPACING.spacing3};
  text-overflow: ${WRAP};
`
interface SetupLabwareListProps {
  runId: string
  extraAttentionModules: ModuleTypesThatRequiresExtraAttention[]
}
export function SetupLabwareList(
  props: SetupLabwareListProps
): JSX.Element | null {
  const { runId, extraAttentionModules } = props
  const protocolData = useProtocolDetailsForRun(runId).protocolData
  const { t } = useTranslation('protocol_setup')
  if (protocolData == null) return null
  const labwareIdsInOrder = getAllLabwareAndTiprackIdsInOrder(
    protocolData.labware,
    protocolData.labwareDefinitions,
    protocolData.commands
  )
  const labwareCommands = protocolData.commands.filter(
    command =>
      command.commandType === 'loadLabware' &&
      command.result.definition.metadata.displayCategory !== 'trash'
  )
  const labwareCommandsInOrder = labwareIdsInOrder.map(id =>
    labwareCommands.find(command => command.result.labwareId === id)
  )
  return (
    <Flex padding={SPACING.spacing4}>
      <StyledTable key={runId}>
        <thead>
          <tr>
            <StyledTableHeader key="labware_name">
              {t('labware_name')}
            </StyledTableHeader>
            <StyledTableHeader key="initial_location">
              {t('initial_location')}
            </StyledTableHeader>
          </tr>
        </thead>
        {labwareCommandsInOrder.map((command, index) =>
          command != null ? (
            <LabwareListItem
              key={`${command.id}_${index}`}
              extraAttentionModules={extraAttentionModules}
              id={index}
              runId={runId}
              params={command.params as LoadLabwareRunTimeCommand['params']}
              definition={command.result.definition}
            />
          ) : null
        )}
      </StyledTable>
    </Flex>
  )
}

interface LabwareListItemProps {
  id: number
  runId: string
  params: LoadLabwareRunTimeCommand['params']
  definition: LabwareDefinition2
  extraAttentionModules: ModuleTypesThatRequiresExtraAttention[]
}

export function LabwareListItem(
  props: LabwareListItemProps
): JSX.Element | null {
  const { id, params, runId, definition, extraAttentionModules } = props
  const { t } = useTranslation('protocol_setup')
  const [
    secureLabwareModalType,
    setSecureLabwareModalType,
  ] = React.useState<ModuleType | null>(null)
  const protocolData = useProtocolDetailsForRun(runId).protocolData
  const labwareDisplayName = getLabwareDisplayName(definition)
  if (protocolData == null) return null

  let slotInfo: JSX.Element = t('slot_location', {
    slotName: Object.values(params.location),
  })
  let extraAttentionText: JSX.Element | null = null

  if ('moduleId' in params.location) {
    const moduleId = params.location.moduleId
    const moduleModel = protocolData.modules[moduleId].model
    const moduleRunTimeCommand = protocolData.commands
      .filter(
        (command): command is LoadModuleRunTimeCommand =>
          command.commandType === 'loadModule'
      )
      .find(command => command.params.moduleId === moduleId)
    let moduleSlotName = moduleRunTimeCommand?.params.location.slotName
    const moduleName = getModuleDisplayName(moduleModel)
    const moduleType = getModuleType(moduleModel)

    const moduleTypeNeedsAttention = extraAttentionModules.find(
      extraAttentionModType => extraAttentionModType === moduleType
    )
    if (moduleName?.includes('Thermocycler')) {
      moduleSlotName = TC_MODULE_LOCATION
    }
    slotInfo = t('module_slot_location', {
      slotName: moduleSlotName,
      moduleName: moduleName,
    })
    switch (moduleTypeNeedsAttention) {
      case MAGNETIC_MODULE_TYPE:
      case THERMOCYCLER_MODULE_TYPE:
        extraAttentionText = (
          <Btn
            color={COLORS.darkGreyEnabled}
            marginTop={SPACING.spacing3}
            data-testid={`SetupLabwareList_${moduleType}_${id}`}
            onClick={() => setSecureLabwareModalType(moduleType)}
          >
            <Flex flexDirection={DIRECTION_ROW}>
              <Icon
                name="information"
                size="0.75rem"
                marginTop={SPACING.spacingXS}
              />

              <StyledText marginLeft={SPACING.spacing2} as="p">
                {t('secure_labware_instructions')}
              </StyledText>
            </Flex>
          </Btn>
        )
        break
      //  TODO(jr, 10/17/22): add case for Heater-Shaker Module
    }
  }
  return (
    <>
      <tbody css={LABWARE_CARD_STYLE}>
        <StyledTableRow key={id}>
          <StyledTableCell>
            <Flex flexDirection={DIRECTION_ROW}>
              <Flex width="4.1rem" height="3.6rem">
                <RobotWorkSpace
                  data-testid={`${id}_${runId}`}
                  key={id}
                  viewBox={`0 0 ${definition.dimensions.xDimension} ${definition.dimensions.yDimension}`}
                >
                  {() => <LabwareRender definition={definition} />}
                </RobotWorkSpace>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                justifyContent={JUSTIFY_CENTER}
                marginLeft={SPACING.spacing4}
              >
                <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {labwareDisplayName}
                </StyledText>
                <StyledText as="p" color={COLORS.darkGreyEnabled}>
                  {/* params.displayName is the nickName, different from labareDisplayName */}
                  {params.displayName !== null &&
                  params.displayName !== labwareDisplayName
                    ? params.displayName
                    : null}
                </StyledText>
              </Flex>
            </Flex>
          </StyledTableCell>
          <StyledTableCell>
            <>
              <StyledText as="p">{slotInfo}</StyledText>
              {extraAttentionText != null ? extraAttentionText : null}
            </>
          </StyledTableCell>
        </StyledTableRow>
      </tbody>
      <tbody>
        {/* TODO(jr, 10/17/22): find a way to add a border to a table row (tr). Right now,
        we are faking it with a box-shadow and this StyledTableRow  */}
        <StyledTableRow
          key={`StyledTableRow_${id}`}
          css={css`
            height: ${SPACING.spacing2};
          `}
        />
      </tbody>
      {secureLabwareModalType != null && (
        <SecureLabwareModal
          type={secureLabwareModalType as ModuleTypesThatRequiresExtraAttention}
          onCloseClick={() => setSecureLabwareModalType(null)}
        />
      )}
    </>
  )
}
