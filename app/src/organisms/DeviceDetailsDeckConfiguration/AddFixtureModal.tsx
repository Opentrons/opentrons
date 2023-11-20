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
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { StyledText } from '../../atoms/text'
import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'
import { TertiaryButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { LegacyModal } from '../../molecules/LegacyModal'

import type {
  CutoutConfig,
  CutoutId,
  CutoutFixtureId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import type { LegacyModalProps } from '../../molecules/LegacyModal'

interface AddFixtureModalProps {
  cutoutId: CutoutId
  setShowAddFixtureModal: (showAddFixtureModal: boolean) => void
  setCurrentDeckConfig?: React.Dispatch<React.SetStateAction<CutoutConfig[]>>
  providedFixtureOptions?: CutoutFixtureId[]
  isOnDevice?: boolean
}

export function AddFixtureModal({
  cutoutId,
  setShowAddFixtureModal,
  setCurrentDeckConfig,
  providedFixtureOptions,
  isOnDevice = false,
}: AddFixtureModalProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const deckConfig = useDeckConfigurationQuery()?.data ?? []

  const modalHeader: ModalHeaderBaseProps = {
    title: t('add_to_slot', {
      slotName: getCutoutDisplayName(cutoutId),
    }),
    hasExitIcon: true,
    onClick: () => setShowAddFixtureModal(false),
  }

  const modalProps: LegacyModalProps = {
    title: t('add_to_slot', {
      slotName: getCutoutDisplayName(cutoutId),
    }),
    onClose: () => setShowAddFixtureModal(false),
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '23.125rem',
  }

  const availableFixtures: CutoutFixtureId[] = [TRASH_BIN_ADAPTER_FIXTURE]
  if (STAGING_AREA_CUTOUTS.includes(cutoutId)) {
    availableFixtures.push(STAGING_AREA_RIGHT_SLOT_FIXTURE)
  }
  if (cutoutId === WASTE_CHUTE_CUTOUT) {
    availableFixtures.push(...WASTE_CHUTE_FIXTURES)
  }

  // For Touchscreen app
  const handleTapAdd = (requiredFixtureId: CutoutFixtureId): void => {
    if (setCurrentDeckConfig != null)
      setCurrentDeckConfig(
        (prevDeckConfig: DeckConfiguration): DeckConfiguration =>
          prevDeckConfig.map((fixture: CutoutConfig) =>
            fixture.cutoutId === cutoutId
              ? { ...fixture, cutoutFixtureId: requiredFixtureId }
              : fixture
          )
      )

    setShowAddFixtureModal(false)
  }

  // For Desktop app
  const fixtureOptions = providedFixtureOptions ?? availableFixtures

  const handleClickAdd = (requiredFixtureId: CutoutFixtureId): void => {
    const newDeckConfig = deckConfig.map(fixture =>
      fixture.cutoutId === cutoutId
        ? { ...fixture, cutoutFixtureId: requiredFixtureId }
        : fixture
    )

    updateDeckConfiguration(newDeckConfig)
    setShowAddFixtureModal(false)
  }

  return (
    <>
      {isOnDevice ? (
        <Modal
          header={modalHeader}
          onOutsideClick={() => setShowAddFixtureModal(false)}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
            <StyledText as="p">{t('add_to_slot_description')}</StyledText>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              {fixtureOptions.map(cutoutFixtureId => (
                <React.Fragment key={cutoutFixtureId}>
                  <AddFixtureButton
                    cutoutFixtureId={cutoutFixtureId}
                    handleClickAdd={handleTapAdd}
                  />
                </React.Fragment>
              ))}
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <LegacyModal {...modalProps}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            <StyledText as="p">{t('add_fixture_description')}</StyledText>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              {fixtureOptions.map(fixture => (
                <React.Fragment key={fixture}>
                  <Flex
                    flexDirection={DIRECTION_ROW}
                    alignItems={ALIGN_CENTER}
                    justifyContent={JUSTIFY_SPACE_BETWEEN}
                    padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
                    backgroundColor={COLORS.medGreyEnabled}
                    borderRadius={BORDERS.borderRadiusSize1}
                  >
                    <StyledText css={TYPOGRAPHY.pSemiBold}>
                      {getFixtureDisplayName(fixture)}
                    </StyledText>
                    <TertiaryButton onClick={() => handleClickAdd(fixture)}>
                      {t('add')}
                    </TertiaryButton>
                  </Flex>
                </React.Fragment>
              ))}
            </Flex>
          </Flex>
        </LegacyModal>
      )}
    </>
  )
}

interface AddFixtureButtonProps {
  cutoutFixtureId: CutoutFixtureId
  handleClickAdd: (cutoutFixtureId: CutoutFixtureId) => void
}
function AddFixtureButton({
  cutoutFixtureId,
  handleClickAdd,
}: AddFixtureButtonProps): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <Btn
      onClick={() => handleClickAdd(cutoutFixtureId)}
      display="flex"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      css={FIXTURE_BUTTON_STYLE}
    >
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {getFixtureDisplayName(cutoutFixtureId)}
      </StyledText>
      <StyledText as="p">{t('add')}</StyledText>
    </Btn>
  )
}

const FIXTURE_BUTTON_STYLE = css`
  background-color: ${COLORS.light1};
  cursor: default;
  border-radius: ${BORDERS.borderRadiusSize3};
  box-shadow: none;

  &:focus {
    background-color: ${COLORS.light1Pressed};
    box-shadow: none;
  }

  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.light1};
  }

  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.light1};
  }

  &:active {
    background-color: ${COLORS.light1Pressed};
  }

  &:disabled {
    background-color: ${COLORS.light1};
    color: ${COLORS.darkBlack60};
  }
`
