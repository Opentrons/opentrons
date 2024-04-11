import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDeckConfigurationQuery, useModulesQuery } from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getFixtureDisplayName,
  getCutoutFixturesForModuleModel,
} from '@opentrons/shared-data'
import { getTopPortalEl } from '../../../../App/portal'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { Modal } from '../../../../molecules/Modal'

import type { ModuleModel, DeckDefinition } from '@opentrons/shared-data'
import { FixtureOption } from '../../../DeviceDetailsDeckConfiguration/AddFixtureModal'

interface ChooseModuleToConfigureModalProps {
  handleConfigureModule: (moduleSerialNumber: string) => void
  onCloseClick: () => void
  deckDef: DeckDefinition
  isOnDevice: boolean
  requiredModuleModel: ModuleModel
}

export const ChooseModuleToConfigureModal = (
  props: ChooseModuleToConfigureModalProps
): JSX.Element => {
  const {
    handleConfigureModule,
    onCloseClick,
    deckDef,
    requiredModuleModel,
    isOnDevice,
  } = props
  const { t } = useTranslation(['protocol_setup', 'shared'])
  const attachedModules = useModulesQuery().data?.data ?? []
  const deckConfig = useDeckConfigurationQuery()?.data ?? []
  const unconfiguredModuleMatches =
    attachedModules.filter(
      attachedMod =>
        attachedMod.moduleModel === requiredModuleModel &&
        !deckConfig.some(
          ({ opentronsModuleSerialNumber }) =>
            attachedMod.serialNumber === opentronsModuleSerialNumber
        )
    ) ?? []

  return createPortal(
    isOnDevice ? (
      <Modal
        onOutsideClick={onCloseClick}
        header={{
          title: t('deck_conflict'),
          hasExitIcon: true,
          onClick: onCloseClick,
          iconName: 'ot-alert',
          iconColor: COLORS.yellow50,
        }}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingTop={SPACING.spacing8}
              gridGap={SPACING.spacing8}
            >
              {unconfiguredModuleMatches
                .map(attachedModule => {
                  const moduleFixtures = getCutoutFixturesForModuleModel(
                    attachedModule.moduleModel,
                    deckDef
                  )
                  return (
                    <FixtureOption
                      key={attachedModule.serialNumber}
                      onClickHandler={() =>
                        handleConfigureModule(attachedModule.serialNumber)
                      }
                      optionName={getFixtureDisplayName(
                        moduleFixtures[0].id,
                        attachedModule.usbPort.port
                      )}
                      buttonText={t('shared:add')}
                      isOnDevice={isOnDevice}
                    />
                  )
                })}
            </Flex>
          </Flex>
        </Flex>
      </Modal>
    ) : (
      <LegacyModal
        title={
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing10}
            alignItems={ALIGN_CENTER}
          >
            <Icon name="ot-alert" size="1rem" color={COLORS.yellow50} />
            <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('deck_conflict')}
            </StyledText>
          </Flex>
        }
        onClose={onCloseClick}
        width="27.75rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex paddingY={SPACING.spacing16} flexDirection={DIRECTION_COLUMN}>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingTop={SPACING.spacing8}
              gridGap={SPACING.spacing8}
            >
              {unconfiguredModuleMatches
                .filter(m => m.moduleModel === requiredModuleModel)
                .map(attachedModule => {
                  const moduleFixtures = getCutoutFixturesForModuleModel(
                    attachedModule.moduleModel,
                    deckDef
                  )
                  return (
                    <FixtureOption
                      key={attachedModule.serialNumber}
                      onClickHandler={() =>
                        handleConfigureModule(attachedModule.serialNumber)
                      }
                      optionName={getFixtureDisplayName(
                        moduleFixtures[0].id,
                        attachedModule.usbPort.port
                      )}
                      buttonText={t('shared:add')}
                      isOnDevice={isOnDevice}
                    />
                  )
                })}
            </Flex>
          </Flex>
        </Flex>
      </LegacyModal>
    ),
    getTopPortalEl()
  )
}
