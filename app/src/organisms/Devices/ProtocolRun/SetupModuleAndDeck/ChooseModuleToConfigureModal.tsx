import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  useDeckConfigurationQuery,
  useModulesQuery,
  useStopRunMutation,
} from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getFixtureDisplayName,
  getCutoutFixturesForModuleModel,
  MAGNETIC_BLOCK_V1,
  getModuleDisplayName,
} from '@opentrons/shared-data'
import { getTopPortalEl } from '../../../../App/portal'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { Modal } from '../../../../molecules/Modal'
import { FixtureOption } from '../../../DeviceDetailsDeckConfiguration/AddFixtureModal'

import type { ModuleModel, DeckDefinition } from '@opentrons/shared-data'
import { SmallButton } from '../../../../atoms/buttons'
import { useHistory } from 'react-router-dom'
import { useCurrentRunId } from '../../../ProtocolUpload/hooks'

const EQUIPMENT_POLL_MS = 5000
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
  robotName: string
  displaySlotName: string
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
    robotName,
    displaySlotName
  } = props
  const { t } = useTranslation(['protocol_setup', 'shared'])
  const history = useHistory()
  const currentRunId = useCurrentRunId()
  const { stopRun } = useStopRunMutation()
  const attachedModules =
    useModulesQuery({ refetchInterval: EQUIPMENT_POLL_MS })?.data?.data ?? []
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
  const handleCancelRun = (): void => {
    if (currentRunId != null) stopRun(currentRunId)
  }
  const handleNavigateToDeviceDetails = (): void => { history.push(`/devices/${robotName}`) }
  const emptyState = (
    <Flex>
      <StyledText as="p">{t('there_are_no_unconfigured_modules', { module: getModuleDisplayName(requiredModuleModel) })}</StyledText>
      {isOnDevice
        ? (
          <SmallButton
            onClick={handleCancelRun}
            buttonText={t('cancel_protocol_and_edit_deck_config')} />
        ) : (
          <PrimaryButton onClick={handleNavigateToDeviceDetails}>
            {t('update_deck_config')}
          </PrimaryButton>
        )}
    </Flex>
  )

  const contents = fixtureOptions.length > 0
    ? (
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p">
          {t('add_this_deck_hardware')}
        </StyledText>
        {fixtureOptions}
      </Flex>
    ) : emptyState

  return createPortal(
    isOnDevice ? (
      <Modal
        onOutsideClick={onCloseClick}
        header={{
          title: t('add_to_slot', { slotName: displaySlotName }),
          hasExitIcon: true,
          onClick: onCloseClick,
        }}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingTop={SPACING.spacing8}
              gridGap={SPACING.spacing8}
            >
              {contents}
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
            <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('add_to_slot', { slotName: displaySlotName })}
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
              {contents}
            </Flex>
          </Flex>
        </Flex>
      </LegacyModal>
    ),
    getTopPortalEl()
  )
}
