import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  LEGACY_COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'

import type { InstrumentData } from '@opentrons/api-client'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

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
  const { i18n, t } = useTranslation(['firmware_update', 'shared'])

  const updateFailedHeader: ModalHeaderBaseProps = {
    title: t('update_failed'),
    iconName: 'ot-alert',
    iconColor: LEGACY_COLORS.red2,
  }
  let instrumentName = 'instrument'
  if (instrument?.ok) {
    instrumentName =
      instrument?.instrumentType === 'pipette'
        ? getPipetteModelSpecs(instrument.instrumentModel)?.displayName ??
          'pipette'
        : 'Flex Gripper'
  }
  return (
    <>
      {!isSuccess ? (
        <Modal header={updateFailedHeader}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="p" marginBottom={SPACING.spacing32}>
              {t('download_logs')}
            </StyledText>
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
        </Modal>
      ) : (
        <Modal>
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
              borderRadius={BORDERS.borderRadiusSize3}
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
              <StyledText
                as="h4"
                marginBottom={SPACING.spacing4}
                fontWeight={TYPOGRAPHY.fontWeightBold}
              >
                {t('successful_update')}
              </StyledText>
              <StyledText as="p" textAlign={TYPOGRAPHY.textAlignCenter}>
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
              </StyledText>
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
        </Modal>
      )}
    </>
  )
}
