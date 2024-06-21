import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useModulesQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
  ABSORBANCE_READER_CUTOUTS,
  ABSORBANCE_READER_V1,
  ABSORBANCE_READER_V1_FIXTURE,
  HEATER_SHAKER_CUTOUTS,
  HEATERSHAKER_MODULE_V1,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_CENTER_CUTOUTS,
  SINGLE_LEFT_CUTOUTS,
  SINGLE_RIGHT_CUTOUTS,
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TEMPERATURE_MODULE_CUTOUTS,
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V2_FIXTURE,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_MODULE_V2,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'
import { TertiaryButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { LegacyModal } from '../../molecules/LegacyModal'
import { useNotifyDeckConfigurationQuery } from '../../resources/deck_configuration/'

import type {
  CutoutConfig,
  CutoutId,
  CutoutFixtureId,
} from '@opentrons/shared-data'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import type { LegacyModalProps } from '../../molecules/LegacyModal'

interface AddFixtureModalProps {
  cutoutId: CutoutId
  closeModal: () => void
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
  closeModal,
  providedFixtureOptions,
  isOnDevice = false,
}: AddFixtureModalProps): JSX.Element {
  const { t } = useTranslation(['device_details', 'shared'])
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const { data: modulesData } = useModulesQuery()
  const deckConfig = useNotifyDeckConfigurationQuery()?.data ?? []
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
  const [optionStage, setOptionStage] = React.useState<OptionStage>(
    initialStage
  )

  const modalHeader: ModalHeaderBaseProps = {
    title: t('add_to_slot', {
      slotName: getCutoutDisplayName(cutoutId),
    }),
    hasExitIcon: providedFixtureOptions == null,
    onClick: closeModal,
  }

  const modalProps: LegacyModalProps = {
    title: t('add_to_slot', {
      slotName: getCutoutDisplayName(cutoutId),
    }),
    onClose: closeModal,
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '26.75rem',
  }

  let availableOptions: CutoutConfig[][] = []

  if (providedFixtureOptions != null) {
    availableOptions = providedFixtureOptions?.map(o => [
      {
        cutoutId,
        cutoutFixtureId: o,
        opentronsModuleSerialNumber: undefined,
      },
    ])
  } else if (optionStage === 'fixtureOptions') {
    if (
      SINGLE_RIGHT_CUTOUTS.includes(cutoutId) ||
      SINGLE_LEFT_CUTOUTS.includes(cutoutId)
    ) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
          },
        ],
      ]
    }
    if (STAGING_AREA_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
          },
        ],
      ]
    }
  } else if (optionStage === 'moduleOptions') {
    availableOptions = [
      ...availableOptions,
      [
        {
          cutoutId,
          cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
        },
      ],
    ]
    if (SINGLE_RIGHT_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
          },
        ],
      ]
    }
    if (unconfiguredMods.length > 0) {
      if (THERMOCYCLER_MODULE_CUTOUTS.includes(cutoutId)) {
        const unconfiguredTCs = unconfiguredMods
          .filter(mod => mod.moduleModel === THERMOCYCLER_MODULE_V2)
          .map(mod => [
            {
              cutoutId: THERMOCYCLER_MODULE_CUTOUTS[0],
              cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE,
              opentronsModuleSerialNumber: mod.serialNumber,
            },
            {
              cutoutId: THERMOCYCLER_MODULE_CUTOUTS[1],
              cutoutFixtureId: THERMOCYCLER_V2_FRONT_FIXTURE,
              opentronsModuleSerialNumber: mod.serialNumber,
            },
          ])
        availableOptions = [...availableOptions, ...unconfiguredTCs]
      }
      if (
        HEATER_SHAKER_CUTOUTS.includes(cutoutId) &&
        unconfiguredMods.some(m => m.moduleModel === HEATERSHAKER_MODULE_V1)
      ) {
        const unconfiguredHeaterShakers = unconfiguredMods
          .filter(mod => mod.moduleModel === HEATERSHAKER_MODULE_V1)
          .map(mod => [
            {
              cutoutId,
              cutoutFixtureId: HEATERSHAKER_MODULE_V1_FIXTURE,
              opentronsModuleSerialNumber: mod.serialNumber,
            },
          ])
        availableOptions = [...availableOptions, ...unconfiguredHeaterShakers]
      }
      if (
        TEMPERATURE_MODULE_CUTOUTS.includes(cutoutId) &&
        unconfiguredMods.some(m => m.moduleModel === TEMPERATURE_MODULE_V2)
      ) {
        const unconfiguredTemperatureModules = unconfiguredMods
          .filter(mod => mod.moduleModel === TEMPERATURE_MODULE_V2)
          .map(mod => [
            {
              cutoutId,
              cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
              opentronsModuleSerialNumber: mod.serialNumber,
            },
          ])
        availableOptions = [
          ...availableOptions,
          ...unconfiguredTemperatureModules,
        ]
      }
      if (
        ABSORBANCE_READER_CUTOUTS.includes(cutoutId) &&
        unconfiguredMods.some(m => m.moduleModel === ABSORBANCE_READER_V1)
      ) {
        const unconfiguredAbsorbanceReaders = unconfiguredMods
          .filter(mod => mod.moduleModel === ABSORBANCE_READER_V1)
          .map(mod => [
            {
              cutoutId,
              cutoutFixtureId: ABSORBANCE_READER_V1_FIXTURE,
              opentronsModuleSerialNumber: mod.serialNumber,
            },
          ])
        availableOptions = [
          ...availableOptions,
          ...unconfiguredAbsorbanceReaders,
        ]
      }
    }
  } else if (optionStage === 'wasteChuteOptions') {
    availableOptions = WASTE_CHUTE_FIXTURES.map(fixture => [
      {
        cutoutId,
        cutoutFixtureId: fixture,
      },
    ])
  }

  let nextStageOptions = null
  if (optionStage === 'modulesOrFixtures') {
    nextStageOptions = (
      <>
        {SINGLE_CENTER_CUTOUTS.includes(cutoutId) ? null : (
          <FixtureOption
            key="fixturesOption"
            optionName="Fixtures"
            buttonText={t('select_options')}
            onClickHandler={() => {
              setOptionStage('fixtureOptions')
            }}
            isOnDevice={isOnDevice}
          />
        )}
        <FixtureOption
          key="modulesOption"
          optionName="Modules"
          buttonText={t('select_options')}
          onClickHandler={() => {
            setOptionStage('moduleOptions')
          }}
          isOnDevice={isOnDevice}
        />
      </>
    )
  } else if (
    optionStage === 'fixtureOptions' &&
    cutoutId === WASTE_CHUTE_CUTOUT
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

  const handleAddFixture = (addedCutoutConfigs: CutoutConfig[]): void => {
    const newDeckConfig = deckConfig.map(fixture => {
      const replacementCutoutConfig = addedCutoutConfigs.find(
        c => c.cutoutId === fixture.cutoutId
      )
      return replacementCutoutConfig ?? fixture
    })

    updateDeckConfiguration(newDeckConfig)
    closeModal()
  }

  const fixtureOptions = availableOptions.map(cutoutConfigs => (
    <FixtureOption
      key={cutoutConfigs[0].cutoutFixtureId}
      optionName={getFixtureDisplayName(
        cutoutConfigs[0].cutoutFixtureId,
        (modulesData?.data ?? []).find(
          m => m.serialNumber === cutoutConfigs[0].opentronsModuleSerialNumber
        )?.usbPort.port
      )}
      buttonText={t('add')}
      onClickHandler={() => {
        handleAddFixture(cutoutConfigs)
      }}
      isOnDevice={isOnDevice}
    />
  ))

  return (
    <>
      {isOnDevice ? (
        <Modal
          header={modalHeader}
          onOutsideClick={() => {
            if (providedFixtureOptions == null) closeModal()
          }}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
            <StyledText as="p">{t('add_fixture_description')}</StyledText>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              {fixtureOptions}
              {nextStageOptions}
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <LegacyModal {...modalProps}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            <StyledText as="p">{t('add_fixture_description')}</StyledText>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              {fixtureOptions}
              {nextStageOptions}
            </Flex>
          </Flex>
          {optionStage === 'wasteChuteOptions' ? (
            <Btn
              onClick={() => {
                setOptionStage('fixtureOptions')
              }}
              aria-label="back"
              paddingX={SPACING.spacing16}
              marginTop={'1.44rem'}
              marginBottom={'0.56rem'}
            >
              <StyledText css={GO_BACK_BUTTON_STYLE}>
                {t('shared:go_back')}
              </StyledText>
            </Btn>
          ) : null}
        </LegacyModal>
      )}
    </>
  )
}

const FIXTURE_BUTTON_STYLE_ODD = css`
  background-color: ${COLORS.grey35};
  cursor: default;
  border-radius: ${BORDERS.borderRadius16};
  box-shadow: none;

  &:focus {
    background-color: ${COLORS.grey40};
    box-shadow: none;
  }

  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.grey35};
  }

  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.grey35};
  }

  &:active {
    background-color: ${COLORS.grey40};
  }

  &:disabled {
    background-color: ${COLORS.grey35};
    color: ${COLORS.grey50};
  }
`
const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.grey50};

  &:hover {
    opacity: 70%;
  }
`

interface FixtureOptionProps {
  onClickHandler: React.MouseEventHandler
  optionName: string
  buttonText: string
  isOnDevice: boolean
}
export function FixtureOption(props: FixtureOptionProps): JSX.Element {
  const { onClickHandler, optionName, buttonText, isOnDevice } = props
  return isOnDevice ? (
    <Btn
      onClick={props.onClickHandler}
      display="flex"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      css={FIXTURE_BUTTON_STYLE_ODD}
    >
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {props.optionName}
      </StyledText>
      <StyledText as="p">{props.buttonText}</StyledText>
    </Btn>
  ) : (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
      backgroundColor={COLORS.grey20}
      borderRadius={BORDERS.borderRadius4}
    >
      <StyledText css={TYPOGRAPHY.pSemiBold}>{optionName}</StyledText>
      <TertiaryButton onClick={onClickHandler}>{buttonText}</TertiaryButton>
    </Flex>
  )
}
