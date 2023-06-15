import * as React from 'react'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
  COLORS,
} from '@opentrons/components'

import { StyledText } from '../atoms/text'
import { MediumButton } from '../atoms/buttons'
import { Modal } from '../molecules/Modal/OnDeviceDisplay/Modal'
import { appRestart } from '../redux/shell'

import type { Dispatch } from '../redux/types'
import type { ModalHeaderBaseProps } from '../molecules/Modal/OnDeviceDisplay/types'

export function OnDeviceDisplayAppFallback(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const handleRestartClick = (): void => {
    dispatch(appRestart())
  }
  const modalHeader: ModalHeaderBaseProps = {
    title: 'Restart the app',
    iconName: 'information',
    iconColor: COLORS.white,
  }

  return (
    <Modal header={modalHeader} isError>
      <Flex
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        padding={SPACING.spacing32}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {'Something went wrong'}
        </StyledText>
        <MediumButton
          buttonType="alert"
          buttonText="Restart app"
          onClick={handleRestartClick}
        />
      </Flex>
    </Modal>
  )
}
