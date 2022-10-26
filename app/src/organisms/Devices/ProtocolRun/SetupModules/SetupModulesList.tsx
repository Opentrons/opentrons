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
  TYPOGRAPHY,
} from '@opentrons/components'
import { getModuleType, TC_MODULE_LOCATION } from '@opentrons/shared-data'
import { Banner } from '../../../../atoms/Banner'
import { StyledText } from '../../../../atoms/text'
import { StatusLabel } from '../../../../atoms/StatusLabel'
import { HeaterShakerBanner } from '../../../ProtocolSetup/RunSetupCard/ModuleSetup/HeaterShakerSetupWizard/HeaterShakerBanner'
import { UnMatchedModuleWarning } from '../../../ProtocolSetup/RunSetupCard/ModuleSetup/UnMatchedModuleWarning'
import { MultipleModulesModal } from '../../../ProtocolSetup/RunSetupCard/ModuleSetup/MultipleModulesModal'
import {
  useModuleRenderInfoForProtocolById,
  useUnmatchedModulesForProtocol,
} from '../../hooks'
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

  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)

  const heaterShakerModules = Object.values(
    moduleRenderInfoForProtocolById
  ).filter(module => module.moduleDef.model === 'heaterShakerModuleV1')

  const moduleModels = map(
    moduleRenderInfoForProtocolById,
    ({ moduleDef }) => moduleDef.model
  )

  const hasADuplicateModule = new Set(moduleModels).size !== moduleModels.length

  return (
    <>
      {heaterShakerModules.length !== 0 ? (
        <HeaterShakerBanner modules={heaterShakerModules} />
      ) : null}
      {showMultipleModulesModal ? (
        <MultipleModulesModal
          onCloseClick={() => setShowMultipleModulesModal(false)}
        />
      ) : null}
      {hasADuplicateModule ? (
        <Box marginTop={SPACING.spacing3}>
          <Banner
            type="informing"
            onCloseClick={() => setShowMultipleModulesModal(true)}
            closeButton={
              <StyledText
                as="p"
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
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
          <StyledText css={TYPOGRAPHY.pSemiBold} marginLeft={SPACING.spacingM}>
            {displayName}
          </StyledText>
        </Flex>
        <StyledText as="p" width="15%">
          {t('slot_location', {
            slotName:
              getModuleType(moduleModel) === 'thermocyclerModuleType'
                ? TC_MODULE_LOCATION
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
