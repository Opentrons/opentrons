import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { HOMING, MOVING } from '../../redux/robot-controls'
import { RIGHT, LEFT } from '../../redux/pipettes'
import { StyledText } from '../../atoms/text'
import { WizardHeader } from '../../atoms/WizardHeader'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
} from '@opentrons/components'
import type { MovementStatus } from '../../redux/robot-controls/types'
import type { Mount } from '../../redux/pipettes/types'

interface Props {
  title: string
  mount: Mount
  movementStatus: MovementStatus
  isPipetteHoming: boolean
  currentStep: number
  totalSteps: number
}

export function InProgressModal(props: Props): JSX.Element {
  const {
    title,
    mount,
    movementStatus,
    isPipetteHoming,
    totalSteps,
    currentStep,
  } = props
  const { t } = useTranslation('change_pipette')

  let location: string = 'up'
  if (movementStatus === MOVING && mount === RIGHT) {
    location = t(`to_front_left`)
  } else if (movementStatus === MOVING && mount === LEFT) {
    location = t('to_front_right')
  }

  return (
    <>
      <WizardHeader
        totalSteps={totalSteps}
        currentStep={currentStep}
        title={title}
      />
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        height="100%"
        transform="translateY(50%)"
      >
        <Icon
          name="ot-spinner"
          size="82px"
          color={COLORS.darkGreyEnabled}
          aria-label="spinner"
          spin
        />
        <StyledText
          as="h1"
          marginTop={SPACING.spacing5}
          marginBottom={SPACING.spacing3}
        >
          {t('moving_gantry')}
        </StyledText>
        {/* extra protection in case movement status errors */}
        {movementStatus !== 'moveError' && movementStatus !== 'homeError' ? (
          <StyledText as="p">
            {movementStatus === HOMING && !isPipetteHoming
              ? t('homing')
              : t('pipette_movement', {
                  mount: mount[0].toUpperCase() + mount.slice(1),
                  location: location,
                })}
          </StyledText>
        ) : null}
      </Flex>
    </>
  )
}
