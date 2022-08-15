import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { WizardHeader } from '../../../atoms/WizardHeader'
import { StyledText } from '../../../atoms/text'
import { PrimaryButton } from '../../../atoms/buttons'

import type { Mount } from '../../../redux/robot/types'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

export interface ClearDeckModalProps {
  onContinueClick: () => unknown
  onCancelClick: () => unknown
  totalSteps: number
  currentStep: number
  mount: Mount
  pipetteName?: PipetteModelSpecs['displayName']
}

export function ClearDeckModal(props: ClearDeckModalProps): JSX.Element {
  const {
    onContinueClick,
    onCancelClick,
    totalSteps,
    currentStep,
    mount,
    pipetteName,
  } = props
  const { t } = useTranslation('change_pipette')

  return (
    <>
      <WizardHeader
        totalSteps={totalSteps}
        currentStep={currentStep}
        title={
          pipetteName != null
            ? t('detach_pipette', {
                pipette: pipetteName,
                mount: mount[0].toUpperCase() + mount.slice(1),
              })
            : t('attach_pipette')
        }
        onExit={onCancelClick}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        marginBottom="13.5rem"
        paddingX={SPACING.spacing6}
        paddingTop={SPACING.spacing6}
      >
        <Trans
          t={t}
          i18nKey="remove_labware_before_start"
          components={{
            h1: <StyledText as="h1" marginBottom={SPACING.spacing4} />,
            block: <StyledText as="p" />,
          }}
        />
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END} marginBottom={SPACING.spacing6}>
        <PrimaryButton marginX={SPACING.spacing6} onClick={onContinueClick}>
          {t('get_started')}
        </PrimaryButton>
      </Flex>
    </>
  )
}
