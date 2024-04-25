import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useModulesQuery } from '@opentrons/react-api-client'
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
  MAGNETIC_BLOCK_V1,
} from '@opentrons/shared-data'
import { getTopPortalEl } from '../../../../App/portal'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { Modal } from '../../../../molecules/Modal'
import { useNotifyDeckConfigurationQuery } from '../../../../resources/deck_configuration'

import type { ModuleModel, DeckDefinition } from '@opentrons/shared-data'
import { FixtureOption } from '../../../DeviceDetailsDeckConfiguration/AddFixtureModal'

interface ModuleFixtureOption {
  moduleModel: ModuleModel
  usbPort?: number
  serialNumber?: string
}
interface ChooseModuleToConfigureModalProps {
  handleConfigureModule: (moduleSerialNumber?: string) => void
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
  const deckConfig = useNotifyDeckConfigurationQuery()?.data ?? []
  const unconfiguredModuleMatches =
    attachedModules.filter(
      attachedMod =>
        attachedMod.moduleModel === requiredModuleModel &&
        !deckConfig.some(
          ({ opentronsModuleSerialNumber }) =>
            attachedMod.serialNumber === opentronsModuleSerialNumber
        )
    ) ?? []

  const connectedOptions: ModuleFixtureOption[] = unconfiguredModuleMatches.map(
    attachedMod => ({
      moduleModel: attachedMod.moduleModel,
      usbPort: attachedMod.usbPort.port,
      serialNumber: attachedMod.serialNumber,
    })
  )
  const passiveOptions: ModuleFixtureOption[] =
    requiredModuleModel === MAGNETIC_BLOCK_V1
      ? [{ moduleModel: MAGNETIC_BLOCK_V1 }]
      : []
  const fixtureOptions = [...connectedOptions, ...passiveOptions].map(
    ({ moduleModel, serialNumber, usbPort }) => {
      const moduleFixtures = getCutoutFixturesForModuleModel(
        moduleModel,
        deckDef
      )
      return (
        <FixtureOption
          key={serialNumber}
          onClickHandler={() => {
            handleConfigureModule(serialNumber)
          }}
          optionName={getFixtureDisplayName(moduleFixtures[0].id, usbPort)}
          buttonText={t('shared:add')}
          isOnDevice={isOnDevice}
        />
      )
    }
  )

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
              {fixtureOptions}
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
              {fixtureOptions}
            </Flex>
          </Flex>
        </Flex>
      </LegacyModal>
    ),
    getTopPortalEl()
  )
}
