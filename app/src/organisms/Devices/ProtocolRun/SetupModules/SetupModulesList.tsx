import * as React from 'react'
import map from 'lodash/map'
import { useTranslation } from 'react-i18next'
import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'
import { getModuleType } from '@opentrons/shared-data'
import { useModuleRenderInfoForProtocolById } from '../../hooks'
import { getModuleImage } from './utils'
import { StyledText } from '../../../../atoms/text'
import { StatusLabel } from '../../../../atoms/StatusLabel'

import type { ModuleModel } from '@opentrons/shared-data'
import type { AttachedModule } from '../../../../redux/modules/types'

interface SetupModulesListProps {
  robotName: string
  runId: string
}

export const SetupModulesList = (props: SetupModulesListProps): JSX.Element => {
  const { robotName, runId } = props
  const { t } = useTranslation('protocol_setup')
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )

  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginTop={SPACING.spacing4}
        marginLeft={SPACING.spacingM}
      >
        <StyledText
          as="labelSemiBold"
          marginBottom={SPACING.spacing3}
          data-testid="SetupModulesList_module_name"
          width="45%"
        >
          {t('module_name')}
        </StyledText>
        <StyledText
          as="labelSemiBold"
          data-testid="SetupModulesList_location"
          marginRight={SPACING.spacing4}
          width="15%"
        >
          {t('location')}
        </StyledText>
        <StyledText
          as="labelSemiBold"
          data-testid="SetupModulesList_connection_status"
          marginRight={SPACING.spacing4}
          width="15%"
        >
          {t('connection_status')}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        width="100%"
        overflowY="auto"
        marginTop={SPACING.spacing2}
        marginBottom={SPACING.spacing5}
        data-testid="SetupModulesList_ListView"
        gridGap={SPACING.spacing3}
      >
        {map(
          moduleRenderInfoForProtocolById,
          ({ moduleDef, attachedModuleMatch, slotName }) => {
            return (
              <ModulesListItem
                key={`SetupModulesList_${moduleDef.model}_slot_${slotName}`}
                moduleModel={moduleDef.model}
                displayName={moduleDef.displayName}
                location={slotName}
                attachedModuleMatch={attachedModuleMatch}
              />
            )
          }
        )}
      </Flex>
    </>
  )
}

interface ModulesListItemProps {
  moduleModel: ModuleModel
  displayName: string
  location: string
  attachedModuleMatch: AttachedModule | null
}

export const ModulesListItem = ({
  moduleModel,
  displayName,
  location,
  attachedModuleMatch,
}: ModulesListItemProps): JSX.Element => {
  const { t } = useTranslation('protocol_setup')

  const moduleConnectionStatus =
    attachedModuleMatch != null
      ? t('module_connected')
      : t('module_not_connected')

  return (
    <Box
      css={BORDERS.cardOutlineBorder}
      padding={SPACING.spacing4}
      backgroundColor={COLORS.white}
      data-testid="ModulesListItem_Row"
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={JUSTIFY_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex alignItems={JUSTIFY_CENTER} width="45%">
          <img width="60px" height="54px" src={getModuleImage(moduleModel)} />
          <StyledText as="pSemiBold" marginLeft={SPACING.spacingM}>
            {displayName}
          </StyledText>
        </Flex>
        <StyledText as="p" width="15%">
          {t('slot_location', {
            slotName:
              getModuleType(moduleModel) === 'thermocyclerModuleType'
                ? '7+10'
                : location,
          })}
        </StyledText>
        <Flex width="15%">
          <StatusLabel
            status={moduleConnectionStatus}
            backgroundColor={COLORS.successBackgroundLight}
            iconColor={
              attachedModuleMatch != null
                ? COLORS.successEnabled
                : COLORS.warningEnabled
            }
            textColor={
              attachedModuleMatch != null
                ? COLORS.successText
                : COLORS.warningText
            }
          />
        </Flex>
      </Flex>
    </Box>
  )
}
