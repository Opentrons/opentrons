import { useTranslation, Trans } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { usePipetteModelSpecs } from '/app/local-resources/instruments'

import type { InstrumentData, PipetteData } from '@opentrons/api-client'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface UpdateResultsModalProps {
  isSuccess: boolean
  shouldExit: boolean
  onClose: () => void
  instrument?: InstrumentData
}

export function UpdateResultsModal(
  props: UpdateResultsModalProps
): JSX.Element {
  const { isSuccess, shouldExit, onClose, instrument } = props
  const { i18n, t } = useTranslation(['firmware_update', 'shared', 'branded'])

  const updateFailedHeader: OddModalHeaderBaseProps = {
    title: t('update_failed'),
    iconName: 'ot-alert',
    iconColor: COLORS.red50,
  }

  const pipetteDisplayName = usePipetteModelSpecs(
    (instrument as PipetteData)?.instrumentModel
  )?.displayName

  let instrumentName = 'instrument'
  if (instrument?.ok) {
    instrumentName =
      instrument?.instrumentType === 'pipette'
        ? pipetteDisplayName ?? 'pipette'
        : 'Flex Gripper'
  }
  return (
    <>
      {!isSuccess ? (
        <OddModal header={updateFailedHeader}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <LegacyStyledText as="p" marginBottom={SPACING.spacing32}>
              {t('branded:firmware_update_download_logs')}
            </LegacyStyledText>
            <SmallButton
              onClick={onClose}
              buttonText={
                shouldExit
                  ? i18n.format(t('shared:close'), 'capitalize')
                  : t('shared:next')
              }
              width="100%"
            />
          </Flex>
        </OddModal>
      ) : (
        <OddModal>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing32}
            alignItems={ALIGN_CENTER}
            width="100%"
            justifyContent={ALIGN_CENTER}
          >
            <Flex
              height="11.5rem"
              width="100%"
              backgroundColor={COLORS.green35}
              borderRadius={BORDERS.borderRadius12}
              flexDirection={DIRECTION_COLUMN}
              color={COLORS.grey60}
              padding={SPACING.spacing24}
              alignItems={ALIGN_CENTER}
            >
              <Icon
                name="ot-check"
                color={COLORS.green50}
                size="2.5rem"
                marginBottom={SPACING.spacing16}
              />
              <LegacyStyledText
                as="h4"
                marginBottom={SPACING.spacing4}
                fontWeight={TYPOGRAPHY.fontWeightBold}
              >
                {t('successful_update')}
              </LegacyStyledText>
              <LegacyStyledText as="p" textAlign={TYPOGRAPHY.textAlignCenter}>
                <Trans
                  t={t}
                  i18nKey="ready_to_use"
                  values={{
                    instrument: instrumentName,
                  }}
                  components={{
                    bold: <strong />,
                  }}
                />
              </LegacyStyledText>
            </Flex>
            <SmallButton
              onClick={onClose}
              buttonText={
                shouldExit
                  ? i18n.format(t('shared:close'), 'capitalize')
                  : t('shared:next')
              }
              width="100%"
            />
          </Flex>
        </OddModal>
      )}
    </>
  )
}
