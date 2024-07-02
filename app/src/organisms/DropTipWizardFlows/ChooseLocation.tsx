import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  DISPLAY_INLINE_BLOCK,
} from '@opentrons/components'
import { getDeckDefFromRobotType } from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons'
import { TwoColumn, DeckMapContent } from '../../molecules/InterventionModal'

import type {
  AddressableAreaName,
  ModuleLocation,
} from '@opentrons/shared-data'
import type { DropTipWizardContainerProps } from './types'

// TODO: get help link article URL

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
  } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])
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
    <Flex>
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
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        css={ALIGN_BUTTONS}
        gridGap={SPACING.spacing8}
        marginTop="auto"
      >
        <Btn
          onClick={() => {
            handleGoBack()
          }}
        >
          <LegacyStyledText css={GO_BACK_BUTTON_STYLE}>
            {t('shared:go_back')}
          </LegacyStyledText>
        </Btn>
        <PrimaryButton
          onClick={handleConfirmPosition}
          css={css`
            @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
              display: none;
            }
          `}
        >
          {i18n.format(t('move_to_slot'), 'capitalize')}
        </PrimaryButton>
        <SmallButton
          buttonText={i18n.format(t('move_to_slot'), 'capitalize')}
          onClick={handleConfirmPosition}
          css={css`
            @media not ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
              display: none;
            }
          `}
        />
      </Flex>
    </Flex>
  )
}

const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.grey50};

  &:hover {
    opacity: 70%;
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    font-size: ${TYPOGRAPHY.fontSize22};
    padding-left: 0;
    &:hover {
      opacity: 100%;
    }
  }
`

const ALIGN_BUTTONS = css`
  align-items: ${ALIGN_FLEX_END};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    align-items: ${ALIGN_CENTER};
  }
`
