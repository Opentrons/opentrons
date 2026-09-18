import { Trans, useTranslation } from 'react-i18next'
import capitalize from 'lodash/capitalize'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  COLORS,
  Flex,
  JUSTIFY_FLEX_END,
  LegacyStyledText,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { isMaintenanceDoorOpenError } from '/app/local-resources/maintenance_runs/utils'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

import { BODY_STYLE, FLOWS, SECTIONS } from './constants'
import { getPipetteAnimations96 } from './utils'

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
    isDoorOpenError,
    setIsDoorOpenError,
    dismissDoorOpenError,
  } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

  const handleCommandError = (error: Error): void => {
    if (isMaintenanceDoorOpenError(error)) {
      setIsDoorOpenError(true)
      setShowErrorMessage(t('door_is_open') as string)
    } else {
      setShowErrorMessage(error.message)
    }
  }

  const handleReattachCarriageProceed = (): void => {
    chainRunCommands?.(
      [
        {
          commandType: 'home' as const,
          params: {
            axes: ['rightZ'],
          },
        },
        {
          commandType: 'unsafe/updatePositionEstimators' as const,
          params: {
            axes: ['x', 'y'],
          },
        },
      ],
      false
    )
      .then(() => {
        proceed()
      })
      .catch(handleCommandError)
  }

  return errorMessage != null ? (
    isDoorOpenError ? (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('door_is_open')}
        subHeader={t('close_door_and_try_again')}
      >
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          alignItems={Boolean(isOnDevice) ? ALIGN_CENTER : ALIGN_FLEX_END}
          gridGap={SPACING.spacing8}
        >
          {Boolean(isOnDevice) ? (
            <SmallButton
              buttonText={t('try_again')}
              onClick={dismissDoorOpenError}
            />
          ) : (
            <PrimaryButton onClick={dismissDoorOpenError}>
              {t('try_again')}
            </PrimaryButton>
          )}
        </Flex>
      </SimpleWizardBody>
    ) : (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('shared:error_encountered')}
        subHeader={errorMessage}
      />
    )
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
