import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  FixtureOption,
  Flex,
  ListTable,
  Modal,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  useModulesQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  getAADisplayName,
  getFixtureDisplayName,
  replaceCutoutFixtureWithComboFixture,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  SINGLE_CENTER_CUTOUTS,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'

import { OddModal } from '/app/molecules/OddModal'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration/'

import { useSendIdentifyStacker } from '../ModuleWizardFlows/hooks'
import { getOptions } from './utils'

import type { AttachedModule } from '@opentrons/api-client'
import type { ModalProps } from '@opentrons/components'
import type {
  AddressableAreaNamesWithFakes,
  CutoutConfig,
  CutoutConfigMap,
  CutoutFixtureId,
  CutoutId,
  DeckDefinition,
} from '@opentrons/shared-data'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

const FLEX_STACKER_FIXTURE = 'flexStackerModuleV1'
const MODULE_IDENTIFY_TIME_MS = 10000

interface AddFixtureModalProps {
  cutoutId: CutoutId
  addressableAreaId: AddressableAreaNamesWithFakes
  closeModal: () => void
  deckDef: DeckDefinition
  providedFixtureOptions?: CutoutFixtureId[]
  isOnDevice?: boolean
}
type OptionStage =
  | 'modulesOrFixtures'
  | 'fixtureOptions'
  | 'moduleOptions'
  | 'wasteChuteOptions'
  | 'providedOptions'

export function AddFixtureModal({
  cutoutId,
  addressableAreaId,
  closeModal,
  providedFixtureOptions,
  isOnDevice = false,
  deckDef,
}: AddFixtureModalProps): JSX.Element {
  const { t } = useTranslation(['device_details', 'shared'])
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const { data: modulesData } = useModulesQuery()
  const deckConfig = useNotifyDeckConfigurationQuery()?.data ?? []

  const deckConfigWithAA = replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(
    deckConfig
  )
  const unconfiguredMods =
    modulesData?.data.filter(
      attachedMod =>
        !deckConfig.some(
          ({ opentronsModuleSerialNumber }) =>
            attachedMod.serialNumber === opentronsModuleSerialNumber
        )
    ) ?? []

  let initialStage: OptionStage = SINGLE_CENTER_CUTOUTS.includes(cutoutId) // only mag block (a module) can be configured in column 2
    ? 'moduleOptions'
    : 'modulesOrFixtures'
  if (providedFixtureOptions != null) {
    // only show provided options if given as props
    initialStage = 'providedOptions'
  }
  const [optionStage, setOptionStage] = useState<OptionStage>(initialStage)

  const modalHeader: OddModalHeaderBaseProps = {
    title: t('add_to', {
      slotName: getAADisplayName(addressableAreaId),
    }),
    hasExitIcon: providedFixtureOptions == null,
    onClick: closeModal,
  }

  const modalProps: ModalProps = {
    title: t('add_to', {
      slotName: getAADisplayName(addressableAreaId),
    }),
    onClose: closeModal,
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '26.75rem',
  }

  const availableOptions = getOptions(
    cutoutId,
    providedFixtureOptions,
    unconfiguredMods,
    optionStage,
    addressableAreaId,
    deckDef
  )

  let nextStageOptions = null
  if (optionStage === 'modulesOrFixtures') {
    nextStageOptions = (
      <>
        {SINGLE_CENTER_CUTOUTS.includes(cutoutId) ? null : (
          <FixtureOption
            key="fixturesOption"
            optionName="Fixtures"
            buttonText={t('add')}
            onClickHandler={() => {
              setOptionStage('fixtureOptions')
            }}
            isOnDevice={isOnDevice}
          />
        )}
        <FixtureOption
          key="modulesOption"
          optionName="Modules"
          buttonText={t('add')}
          onClickHandler={() => {
            setOptionStage('moduleOptions')
          }}
          isOnDevice={isOnDevice}
        />
      </>
    )
  } else if (
    optionStage === 'fixtureOptions' &&
    cutoutId === WASTE_CHUTE_CUTOUT &&
    addressableAreaId === 'D3'
  ) {
    nextStageOptions = (
      <>
        <FixtureOption
          key="wasteChuteStageOption"
          optionName="Waste chute"
          buttonText={t('select_options')}
          onClickHandler={() => {
            setOptionStage('wasteChuteOptions')
          }}
          isOnDevice={isOnDevice}
        />
      </>
    )
  }

  const sendIdentifyStacker = useSendIdentifyStacker()
  const [identifyInUse, setIdentifyInUse] = useState<string | null>(null)
  const [identifyTimeout, setTimeoutID] = useState<NodeJS.Timeout | null>(null)

  const handleAddFixture = (
    addedCutoutConfigs: CutoutConfigMap[],
    fixtureSerialNumber?: string
  ): void => {
    const addedCutoutConfigsWithCombo = replaceCutoutFixtureWithComboFixture(
      addedCutoutConfigs,
      deckConfigWithAA,
      cutoutId
    )
    const newDeckConfig: CutoutConfig[] = deckConfig.map(fixture => {
      return (
        addedCutoutConfigsWithCombo.find(
          c => c.cutoutId === fixture.cutoutId
        ) ?? fixture
      )
    }) as CutoutConfig[] // we can do this bc we are mapping each aa to the proper fixture

    if (fixtureSerialNumber) {
      const module =
        unconfiguredMods?.find(m => m.serialNumber === fixtureSerialNumber) ??
        null
      if (module !== null) {
        sendIdentifyStacker(module, false)
        if (identifyTimeout !== null) {
          clearTimeout(identifyTimeout)
        }
      }
    }
    updateDeckConfiguration(newDeckConfig)
    closeModal()
  }

  const stackerIdentifyHandler = (module: AttachedModule): void => {
    // Identify the stacker module
    sendIdentifyStacker(module, true, 'blue')
    // Ensure that the module reverts after a set time
    setIdentifyInUse(module.serialNumber)
    const timeoutID = setTimeout(() => {
      sendIdentifyStacker(module, false)
      setIdentifyInUse(null)
    }, MODULE_IDENTIFY_TIME_MS)
    setTimeoutID(timeoutID)
  }

  const handleIdentifyFixture = (fixtureSerialNumber: string): void => {
    const module =
      unconfiguredMods.find(m => m.serialNumber === fixtureSerialNumber) ?? null
    if (identifyInUse === null && module !== null) {
      stackerIdentifyHandler(module)
    } else if (
      identifyInUse !== fixtureSerialNumber &&
      identifyInUse !== null
    ) {
      const previousModule =
        unconfiguredMods.find(m => m.serialNumber === identifyInUse) ?? null
      if (previousModule !== null && module !== null) {
        sendIdentifyStacker(previousModule, false)
        if (identifyTimeout !== null) {
          clearTimeout(identifyTimeout)
        }
        stackerIdentifyHandler(module)
      }
    }
  }

  const fixtureOptions = availableOptions.map(cutoutConfigs => {
    const usbPort = (modulesData?.data ?? []).find(
      m => m.serialNumber === cutoutConfigs[0].opentronsModuleSerialNumber
    )?.usbPort
    const portDisplay =
      usbPort?.hubPort != null
        ? `${usbPort.port}.${usbPort.hubPort}`
        : usbPort?.port

    const fixtureSerialNumber = cutoutConfigs[0].opentronsModuleSerialNumber
    if (
      fixtureSerialNumber !== undefined &&
      cutoutConfigs[0].cutoutFixtureId.includes(FLEX_STACKER_FIXTURE)
    ) {
      return (
        <FixtureOption
          key={cutoutConfigs[0].cutoutFixtureId}
          optionName={getFixtureDisplayName(
            cutoutConfigs[0].cutoutFixtureId,
            portDisplay
          )}
          buttonText={t('add')}
          onClickHandler={() => {
            handleAddFixture(cutoutConfigs, fixtureSerialNumber)
          }}
          secondaryButtonText={t('identify')}
          secondaryOnClickHandler={() => {
            handleIdentifyFixture(fixtureSerialNumber)
          }}
          isOnDevice={isOnDevice}
        />
      )
    } else {
      return (
        <FixtureOption
          key={cutoutConfigs[0].cutoutFixtureId}
          optionName={getFixtureDisplayName(
            cutoutConfigs[0].cutoutFixtureId,
            portDisplay
          )}
          buttonText={t('add')}
          onClickHandler={() => {
            handleAddFixture(cutoutConfigs)
          }}
          isOnDevice={isOnDevice}
        />
      )
    }
  })

  return (
    <>
      {isOnDevice ? (
        <OddModal
          header={modalHeader}
          onOutsideClick={() => {
            if (providedFixtureOptions == null) closeModal()
          }}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
            <StyledText oddStyle="bodyTextRegular">
              {t('add_fixture_description')}
            </StyledText>
            <ListTable>
              {fixtureOptions}
              {nextStageOptions}
            </ListTable>
          </Flex>
        </OddModal>
      ) : (
        <Modal {...modalProps}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('add_fixture_description')}
            </StyledText>
            <ListTable>
              {fixtureOptions}
              {nextStageOptions}
            </ListTable>
          </Flex>
        </Modal>
      )}
    </>
  )
}
