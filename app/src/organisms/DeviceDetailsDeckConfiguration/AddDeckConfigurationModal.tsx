import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  Btn,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ListItem } from '../../atoms/ListItem'
import { Modal } from '../../molecules/Modal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface AddDeckConfigurationModalProps {
  slotName: string
}

// ToDo (kk:09/29/2023)
// update this component when Deck configuration component is ready
export function AddDeckConfigurationModal({
  slotName,
}: AddDeckConfigurationModalProps): JSX.Element {
  const { t } = useTranslation('device_details')

  const modalHeader: ModalHeaderBaseProps = {
    title: t('add_to_slot', { slotName: slotName }),
    hasExitIcon: true,
  }

  return (
    <Modal header={modalHeader}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <StyledText as="p">{t('add_to_slot_description')}</StyledText>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <FixtureButton fixtureName={t('stagin_area_slot')} />
        <FixtureButton fixtureName={t('trash')} />
        <FixtureButton fixtureName={t('waste_chute')} />
      </Flex>
    </Modal>
  )
}

interface FixtureButtonProps {
  fixtureName: string
  // setFixture: (fixtureName: string) => void
}
function FixtureButton({
  fixtureName,
}: // setFixture,
FixtureButtonProps): JSX.Element {
  return (
    <ListItem type="noActive">
      <Btn
      // onClick={() => setFixture(fixtureName)}
      >
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {fixtureName}
        </StyledText>
      </Btn>
    </ListItem>
  )
}
