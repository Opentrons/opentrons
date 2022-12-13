import * as React from 'react'
import map from 'lodash/map'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  BORDERS,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
} from '@opentrons/shared-data'
import { Banner } from '../../../../atoms/Banner'
import { StyledText } from '../../../../atoms/text'
import { StatusLabel } from '../../../../atoms/StatusLabel'
import { UnMatchedModuleWarning } from '../../../ProtocolSetup/RunSetupCard/ModuleSetup/UnMatchedModuleWarning'
import { MultipleModulesModal } from '../../../ProtocolSetup/RunSetupCard/ModuleSetup/MultipleModulesModal'
import {
  ModuleRenderInfoForProtocol,
  useIsOT3,
  useModuleRenderInfoForProtocolById,
  useUnmatchedModulesForProtocol,
} from '../../hooks'
import { HeaterShakerWizard } from '../../HeaterShakerWizard'
import { getModuleImage } from './utils'

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

  const {
    missingModuleIds,
    remainingAttachedModules,
  } = useUnmatchedModulesForProtocol(robotName, runId)

  const isOt3 = useIsOT3(robotName)

  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)

  const moduleModels = map(
    moduleRenderInfoForProtocolById,
    ({ moduleDef }) => moduleDef.model
  )

  const hasADuplicateModule = new Set(moduleModels).size !== moduleModels.length

  return (
    <>
      {showMultipleModulesModal ? (
        <MultipleModulesModal
          onCloseClick={() => setShowMultipleModulesModal(false)}
        />
      ) : null}
      {hasADuplicateModule ? (
        <Box marginTop={SPACING.spacing3}>
          <Banner
            iconMarginRight={SPACING.spacing4}
            iconMarginLeft={SPACING.spacing3}
            size={SPACING.spacingM}
            type="informing"
            onCloseClick={() => setShowMultipleModulesModal(true)}
            closeButton={
              <StyledText
                as="p"
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
                marginRight={SPACING.spacing3}
              >
                {t('learn_more')}
              </StyledText>
            }
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText css={TYPOGRAPHY.pSemiBold}>
                {t('multiple_modules')}
              </StyledText>
              <StyledText as="p">{t('view_moam')}</StyledText>
            </Flex>
          </Banner>
        </Box>
      ) : null}
      {remainingAttachedModules.length !== 0 &&
      missingModuleIds.length !== 0 ? (
        <UnMatchedModuleWarning />
      ) : null}
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginTop={SPACING.spacing4}
        marginLeft={SPACING.spacingM}
        marginBottom={SPACING.spacing2}
      >
        <StyledText
          css={TYPOGRAPHY.labelSemiBold}
          marginBottom={SPACING.spacing3}
          data-testid="SetupModulesList_module_name"
          width="45%"
        >
          {t('module_name')}
        </StyledText>
        <StyledText
          css={TYPOGRAPHY.labelSemiBold}
          data-testid="SetupModulesList_location"
          marginRight={SPACING.spacing4}
          width="15%"
        >
          {t('location')}
        </StyledText>
        <StyledText
          css={TYPOGRAPHY.labelSemiBold}
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
        data-testid="SetupModulesList_ListView"
        gridGap={SPACING.spacing2}
        marginBottom={SPACING.spacing5}
      >
        {map(
          moduleRenderInfoForProtocolById,
          ({ moduleDef, attachedModuleMatch, slotName, moduleId }) => {
            return (
              <ModulesListItem
                key={`SetupModulesList_${moduleDef.model}_slot_${slotName}`}
                moduleModel={moduleDef.model}
                displayName={moduleDef.displayName}
                location={slotName}
                attachedModuleMatch={attachedModuleMatch}
                heaterShakerModuleFromProtocol={
                  moduleRenderInfoForProtocolById[moduleId].moduleDef
                    .moduleType === HEATERSHAKER_MODULE_TYPE
                    ? moduleRenderInfoForProtocolById[moduleId]
                    : null
                }
                isOt3={isOt3}
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
  heaterShakerModuleFromProtocol: ModuleRenderInfoForProtocol | null
  isOt3: boolean
}

export const ModulesListItem = ({
  moduleModel,
  displayName,
  location,
  attachedModuleMatch,
  heaterShakerModuleFromProtocol,
  isOt3,
}: ModulesListItemProps): JSX.Element => {
  const { t } = useTranslation('protocol_setup')
  const moduleConnectionStatus =
    attachedModuleMatch != null
      ? t('module_connected')
      : t('module_not_connected')
  const [
    showHeaterShakerFlow,
    setShowHeaterShakerFlow,
  ] = React.useState<Boolean>(false)
  const heaterShakerAttachedModule =
    attachedModuleMatch != null &&
    attachedModuleMatch.moduleType === HEATERSHAKER_MODULE_TYPE
      ? attachedModuleMatch
      : null

  return (
    <Box
      border={BORDERS.styleSolid}
      borderColor={COLORS.medGreyEnabled}
      borderWidth={SPACING.spacingXXS}
      borderRadius={BORDERS.radiusSoftCorners}
      padding={SPACING.spacing4}
      backgroundColor={COLORS.white}
      data-testid="ModulesListItem_Row"
    >
      {showHeaterShakerFlow && heaterShakerModuleFromProtocol != null ? (
        <HeaterShakerWizard
          onCloseClick={() => setShowHeaterShakerFlow(false)}
          moduleFromProtocol={heaterShakerModuleFromProtocol}
          attachedModule={heaterShakerAttachedModule}
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={JUSTIFY_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex alignItems={JUSTIFY_CENTER} width="45%">
          <img width="60px" height="54px" src={getModuleImage(moduleModel)} />
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              css={TYPOGRAPHY.pSemiBold}
              marginLeft={SPACING.spacingM}
            >
              {displayName}
            </StyledText>
            {moduleModel === HEATERSHAKER_MODULE_V1 ? (
              <Btn
                marginLeft={SPACING.spacingM}
                css={css`
                  color: ${COLORS.darkGreyEnabled};

                  &:hover {
                    color: ${COLORS.darkBlackEnabled};
                  }
                `}
                marginTop={SPACING.spacing2}
                onClick={() => setShowHeaterShakerFlow(true)}
              >
                <Flex flexDirection={DIRECTION_ROW}>
                  <Icon
                    name="information"
                    size="0.75rem"
                    marginTop={SPACING.spacingXS}
                  />
                  <StyledText
                    marginLeft={SPACING.spacing2}
                    textDecoration={TYPOGRAPHY.textDecorationUnderline}
                    as="p"
                  >
                    {t('view_module_setup_instructions')}
                  </StyledText>
                </Flex>
              </Btn>
            ) : null}
          </Flex>
        </Flex>
        <StyledText as="p" width="15%">
          {t('slot_location', {
            slotName:
              getModuleType(moduleModel) === 'thermocyclerModuleType'
                ? isOt3
                  ? TC_MODULE_LOCATION_OT3
                  : TC_MODULE_LOCATION_OT2
                : location,
          })}
        </StyledText>
        <Flex width="15%">
          <StatusLabel
            id={location}
            status={moduleConnectionStatus}
            backgroundColor={
              attachedModuleMatch != null
                ? COLORS.successBackgroundLight
                : COLORS.warningBackgroundLight
            }
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
