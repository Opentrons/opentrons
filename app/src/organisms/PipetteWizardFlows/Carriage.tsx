import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PrimaryButton,
  SecondaryButton,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { getPipetteAnimations96 } from './utils'
import { BODY_STYLE, FLOWS, SECTIONS } from './constants'

import type { PipetteWizardStepProps } from './types'

export const Carriage = (props: PipetteWizardStepProps): JSX.Element | null => {
  const { goBack, proceed, flowType, chainRunCommands, isOnDevice } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  const [errorMessage, setErrorMessage] = React.useState<boolean>(false)
  const [numberOfTryAgains, setNumberOfTryAgains] = React.useState<number>(0)
  const handleCheckZAxis = (): void => {
    setNumberOfTryAgains(numberOfTryAgains + 1)
    chainRunCommands(
      [
        {
          commandType: 'home' as const,
          params: { axes: ['rightZ'] },
        },
      ],
      false
    )
      .then(() => {
        proceed()
      })
      .catch(error => {
        console.error(error.message)
        setErrorMessage(true)
      })
  }

  return errorMessage ? (
    <SimpleWizardBody
      iconColor={COLORS.errorEnabled}
      header={i18n.format(t('z_axis_still_attached'), 'capitalize')}
      subHeader={t(
        numberOfTryAgains > 2
          ? 'something_seems_wrong'
          : 'detach_z_axis_screw_again'
      )}
      isSuccess={false}
    >
      <SecondaryButton
        isDangerous
        onClick={goBack}
        marginRight={SPACING.spacing4}
      >
        {i18n.format(t('cancel_attachment'), 'capitalize')}
      </SecondaryButton>
      <PrimaryButton
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        onClick={handleCheckZAxis}
      >
        {t('shared:try_again')}
      </PrimaryButton>
    </SimpleWizardBody>
  ) : (
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
            onClick={handleCheckZAxis}
            buttonText={capitalize(t('shared:continue'))}
            buttonType="primary"
          />
        ) : (
          <PrimaryButton onClick={handleCheckZAxis}>
            {capitalize(t('shared:continue'))}
          </PrimaryButton>
        )
      }
    />
  )
}
