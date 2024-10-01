import { Trans, useTranslation } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import {
  COLORS,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'
import { SmallButton } from '/app/atoms/buttons'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'
import { getPipetteAnimations96 } from './utils'
import { BODY_STYLE, FLOWS, SECTIONS } from './constants'

import type { PipetteWizardStepProps } from './types'

export const Carriage = (props: PipetteWizardStepProps): JSX.Element | null => {
  const {
    goBack,
    flowType,
    isOnDevice,
    proceed,
    chainRunCommands,
    errorMessage,
    setShowErrorMessage,
  } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

  const handleReattachCarriageProceed = (): void => {
    chainRunCommands?.(
      [
        {
          commandType: 'home' as const,
          params: {
            axes: ['rightZ'],
          },
        },
      ],
      false
    )
      .then(() => {
        proceed()
      })
      .catch(error => {
        setShowErrorMessage(error.message as string)
      })
  }

  return errorMessage != null ? (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.red50}
      header={t('shared:error_encountered')}
      subHeader={errorMessage}
    />
  ) : (
    <GenericWizardTile
      header={i18n.format(
        t(flowType === FLOWS.ATTACH ? 'unscrew_carriage' : 'reattach_carriage'),
        'capitalize'
      )}
      rightHandBody={getPipetteAnimations96({
        section: SECTIONS.CARRIAGE,
        flowType,
      })}
      bodyText={
        <Trans
          t={t}
          i18nKey={
            flowType === FLOWS.ATTACH ? 'unscrew_at_top' : 'how_to_reattach'
          }
          components={{
            block: (
              <LegacyStyledText
                css={BODY_STYLE}
                marginBottom={SPACING.spacing16}
              />
            ),
          }}
        />
      }
      back={flowType === FLOWS.ATTACH ? undefined : goBack}
      proceedButton={
        Boolean(isOnDevice) ? (
          <SmallButton
            onClick={
              flowType === FLOWS.ATTACH
                ? proceed
                : handleReattachCarriageProceed
            }
            buttonText={capitalize(t('shared:continue') as string)}
          />
        ) : (
          <PrimaryButton
            onClick={
              flowType === FLOWS.ATTACH
                ? proceed
                : handleReattachCarriageProceed
            }
          >
            {capitalize(t('shared:continue') as string)}
          </PrimaryButton>
        )
      }
    />
  )
}
