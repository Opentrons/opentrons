import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import { SPACING, PrimaryButton } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { getPipetteAnimations96 } from './utils'
import { BODY_STYLE, FLOWS, SECTIONS } from './constants'

import type { PipetteWizardStepProps } from './types'

export const Carriage = (props: PipetteWizardStepProps): JSX.Element | null => {
  const { goBack, flowType, isOnDevice, proceed } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

  return (
    <GenericWizardTile
      header={i18n.format(
        t(flowType === FLOWS.ATTACH ? 'unscrew_carriage' : 'reattach_carriage'),
        'capitalize'
      )}
      rightHandBody={getPipetteAnimations96({
        section: SECTIONS.CARRIAGE,
        flowType: flowType,
      })}
      bodyText={
        <Trans
          t={t}
          i18nKey={
            flowType === FLOWS.ATTACH ? 'unscrew_at_top' : 'how_to_reattach'
          }
          components={{
            block: (
              <StyledText css={BODY_STYLE} marginBottom={SPACING.spacing16} />
            ),
          }}
        />
      }
      back={flowType === FLOWS.ATTACH ? undefined : goBack}
      proceedButton={
        isOnDevice ? (
          <SmallButton
            onClick={proceed}
            buttonText={capitalize(t('shared:continue'))}
          />
        ) : (
          <PrimaryButton onClick={proceed}>
            {capitalize(t('shared:continue'))}
          </PrimaryButton>
        )
      }
    />
  )
}
