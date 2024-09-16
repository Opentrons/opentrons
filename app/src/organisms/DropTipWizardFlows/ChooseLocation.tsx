import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_START,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  DISPLAY_INLINE_BLOCK,
} from '@opentrons/components'
import { getDeckDefFromRobotType } from '@opentrons/shared-data'

import { TwoColumn, DeckMapContent } from '../../molecules/InterventionModal'
import { DropTipFooterButtons } from './shared'

import type {
  AddressableAreaName,
  ModuleLocation,
} from '@opentrons/shared-data'
import type { DropTipWizardContainerProps } from './types'

type ChooseLocationProps = DropTipWizardContainerProps & {
  handleProceed: () => void
  handleGoBack: () => void
  title: string
  body: string | JSX.Element
  moveToAddressableArea: (addressableArea: AddressableAreaName) => Promise<void>
}
const Title = styled.h1`
  ${TYPOGRAPHY.h1Default};
  margin-bottom: ${SPACING.spacing8};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold};
    margin-bottom: 0;
    height: ${SPACING.spacing40};
    display: ${DISPLAY_INLINE_BLOCK};
  }
`

export const ChooseLocation = (
  props: ChooseLocationProps
): JSX.Element | null => {
  const {
    handleProceed,
    handleGoBack,
    title,
    body,
    robotType,
    moveToAddressableArea,
    issuedCommandsType,
  } = props
  const { t } = useTranslation('drop_tip_wizard')
  const [
    selectedLocation,
    setSelectedLocation,
  ] = React.useState<ModuleLocation>()
  const deckDef = getDeckDefFromRobotType(robotType)

  const handleConfirmPosition = (): void => {
    const deckSlot = deckDef.locations.addressableAreas.find(
      l => l.id === selectedLocation?.slotName
    )?.id

    if (deckSlot != null) {
      void moveToAddressableArea(deckSlot).then(() => {
        handleProceed()
      })
    }
  }
  return (
    <Flex
      css={CONTAINER_STYLE}
      height={issuedCommandsType === 'fixit' ? '100%' : '24.625rem'}
    >
      <TwoColumn>
        <Flex flexDirection={DIRECTION_COLUMN} flex="1" gap={SPACING.spacing16}>
          <Title>{title}</Title>
          <LegacyStyledText as="p">{body}</LegacyStyledText>
        </Flex>
        <DeckMapContent
          kind={'deck-config'}
          setSelectedLocation={setSelectedLocation}
          robotType={robotType}
        />
      </TwoColumn>
      <DropTipFooterButtons
        primaryBtnOnClick={handleConfirmPosition}
        primaryBtnTextOverride={t('move_to_slot')}
        secondaryBtnOnClick={handleGoBack}
      />
    </Flex>
  )
}

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing32};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    justify-content: ${JUSTIFY_FLEX_START};
    gap: ${SPACING.spacing32};
    padding: none;
    height: 29.5rem;
  }
`
