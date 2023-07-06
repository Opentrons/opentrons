import * as React from 'react'
import { useDispatch } from 'react-redux'
import type { FallbackProps } from 'react-error-boundary'

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
import { Modal } from '../molecules/Modal'
import { appRestart, sendLog } from '../redux/shell'

import type { Dispatch } from '../redux/types'
import type { ModalHeaderBaseProps } from '../molecules/Modal/types'

export function OnDeviceDisplayAppFallback({
  error,
}: FallbackProps): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const handleRestartClick = (): void => {
    dispatch(appRestart(`${error.message}`))
  }
  const modalHeader: ModalHeaderBaseProps = {
    title: 'Restart the app',
    iconName: 'information',
    iconColor: COLORS.white,
  }

  // immediately report to robot logs that something fatal happened
  React.useEffect(() => {
    dispatch(sendLog(`ODD app encountered a fatal error: ${error.message}`))
  }, [])

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
        <StyledText as="p">{error.message}</StyledText>
        <MediumButton
          buttonType="alert"
          buttonText="Restart app"
          onClick={handleRestartClick}
        />
      </Flex>
    </Modal>
  )
}
