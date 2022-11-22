import * as React from 'react'
import capitalize from 'lodash/capitalize'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, JUSTIFY_CENTER } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import screwPattern from '../../assets/images/change-pip/screw-pattern.png'
import { CheckPipetteButton } from './CheckPipetteButton'
import type { PipetteWizardStepProps } from './types'

export const MountPipette = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed, goBack, robotName } = props
  const { t } = useTranslation('pipette_wizard_flows')

  return (
    <GenericWizardTile
      header={t('connect_and_screw_in_pipette')}
      rightHandBody={
        <Flex justifyContent={JUSTIFY_CENTER}>
          <img
            //  TODO(jr, 11/18/22): attach real image
            src={screwPattern}
            width="171px"
            height="248px"
            alt="Screw pattern"
          />
        </Flex>
      }
      bodyText={
        <Trans
          t={t}
          i18nKey="hold_onto_pipette"
          components={{
            block: <StyledText as="p" marginBottom="1rem" />,
          }}
        />
      }
      back={goBack}
      proceedButton={
        <CheckPipetteButton
          proceed={proceed}
          robotName={robotName}
          proceedButtonText={capitalize(t('continue'))}
        />
      }
    />
  )
}
