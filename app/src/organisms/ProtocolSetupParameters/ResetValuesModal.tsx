import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'

import type { RunTimeParameter } from '@opentrons/shared-data'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface ResetValuesModalProps {
  runTimeParametersOverrides: RunTimeParameter[]
  setRunTimeParametersOverrides: (parameters: RunTimeParameter[]) => void
  handleGoBack: () => void
}

export function ResetValuesModal({
  runTimeParametersOverrides,
  setRunTimeParametersOverrides,
  handleGoBack,
}: ResetValuesModalProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'shared'])

  const modalHeader: ModalHeaderBaseProps = {
    title: t('reset_parameter_values'),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }

  // ToDo (kk:03/18/2024) reset values function will be implemented
  const handleResetValues = (): void => {
    const clone = runTimeParametersOverrides.map(parameter =>
      parameter.type === 'csv_file'
        ? { ...parameter, file: null }
        : { ...parameter, value: parameter.default }
    )
    setRunTimeParametersOverrides(clone as RunTimeParameter[])
    handleGoBack()
  }

  const modalProps = {
    header: { ...modalHeader },
  }

  return (
    <Modal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <StyledText as="p">{t('reset_parameter_values_body')}</StyledText>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing8}
        >
          <SmallButton
            onClick={handleGoBack}
            buttonText={t('shared:go_back')}
            width="100%"
          />
          <SmallButton
            buttonType="alert"
            onClick={handleResetValues}
            buttonText={t('reset_values')}
            width="100%"
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
