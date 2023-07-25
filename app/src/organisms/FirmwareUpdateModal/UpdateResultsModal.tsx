import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
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
  closeModal: () => void
  instrument?: InstrumentData
}

export function UpdateResultsModal(
  props: UpdateResultsModalProps
): JSX.Element {
  const { isSuccess, closeModal, instrument } = props
  const { i18n, t } = useTranslation(['firmware_update', 'shared'])

  const updateFailedHeader: ModalHeaderBaseProps = {
    title: t('update_failed'),
    iconName: 'ot-alert',
    iconColor: COLORS.red2,
  }

  return (
    <>
      {!isSuccess || instrument?.ok !== true ? (
        <Modal header={updateFailedHeader}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="p" marginBottom={SPACING.spacing32}>
              {t('download_logs')}
            </StyledText>
            <SmallButton
              onClick={() => closeModal()}
              buttonText={i18n.format(t('shared:close'), 'capitalize')}
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
              backgroundColor={COLORS.green3}
              borderRadius={BORDERS.borderRadiusSize3}
              flexDirection={DIRECTION_COLUMN}
              color={COLORS.darkBlack90}
              padding={SPACING.spacing24}
              alignItems={ALIGN_CENTER}
            >
              <Icon
                name="ot-check"
                color={COLORS.green2}
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
                    instrument: capitalize(
                      instrument?.instrumentModel ?? 'instrument'
                    ),
                  }}
                  components={{
                    bold: <strong />,
                  }}
                />
              </StyledText>
            </Flex>
            <SmallButton
              onClick={() => closeModal()}
              buttonText={i18n.format(t('shared:close'), 'capitalize')}
              width="100%"
            />
          </Flex>
        </Modal>
      )}
    </>
  )
}
