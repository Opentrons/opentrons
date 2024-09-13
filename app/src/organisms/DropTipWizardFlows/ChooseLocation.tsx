import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Btn,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_START,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  DISPLAY_INLINE_BLOCK,
} from '@opentrons/components'
import { getDeckDefFromRobotType } from '@opentrons/shared-data'

import { SmallButton, TextOnlyButton } from '../../atoms/buttons'
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
  body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
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
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        css={ALIGN_BUTTONS}
        gridGap={SPACING.spacing8}
      >
        <Btn
          onClick={() => {
            handleGoBack()
          }}
        >
          <TextOnlyButton
            onClick={handleGoBack}
            buttonText={t('shared:go_back')}
          />
        </Btn>
        <PrimaryButton
          onClick={handleConfirmPosition}
          css={css`
            body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
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
            @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
              display: none;
            }
          `}
        />
      </Flex>
    </Flex>
  )
}

const ALIGN_BUTTONS = css`
  align-items: ${ALIGN_FLEX_END};

  body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
    align-items: ${ALIGN_CENTER};
  }
`

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing32};
  body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
    justify-content: ${JUSTIFY_FLEX_START};
    gap: ${SPACING.spacing32};
    padding: none;
    height: 29.5rem;
  }
`
