import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Flex,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'

import {
  ABSORBANCE_READER_INITIALIZE,
  ABSORBANCE_READER_LID,
  ABSORBANCE_READER_READ,
} from '../../../constants'
import { StyledTrans } from './StyledTrans'

import type { RobotState } from '@opentrons/step-generation'
import type { FormData } from '../../../form-types'

interface AbsorbanceReaderSummaryProps {
  currentStep: FormData
  labwareNicknamesById: Record<string, string>
  labwareState: RobotState['labware']
}

export function AbsorbanceReaderSummary(
  props: AbsorbanceReaderSummaryProps
): JSX.Element | null {
  const { t } = useTranslation('protocol_steps')
  const { currentStep, labwareNicknamesById, labwareState } = props
  const {
    moduleId: absorbanceReaderModuleId,
    absorbanceReaderFormType,
    fileName,
    lidOpen,
    mode,
    referenceWavelength,
    referenceWavelengthActive,
    wavelengths,
  } = currentStep
  const labwareOnAbsorbanceReaderId = Object.values(
    labwareState
  ).find(({ stack }) => stack.includes(absorbanceReaderModuleId as string))
    ?.stack[0] // top element of stack including absorbance reader
  const labwareOnAbsorbanceReaderNickname =
    labwareOnAbsorbanceReaderId != null
      ? labwareNicknamesById[labwareOnAbsorbanceReaderId]
      : null
  let stepSummaryContent: JSX.Element | null = null
  switch (absorbanceReaderFormType) {
    case ABSORBANCE_READER_READ: {
      stepSummaryContent = (
        <StyledTrans
          i18nKey="protocol_steps:absorbance_reader.read"
          tagText={labwareOnAbsorbanceReaderNickname ?? undefined}
          tagText2={`${fileName}`}
        />
      )
      break
    }
    case ABSORBANCE_READER_INITIALIZE: {
      const wavelengthsComponents = (
        <Flex gridGap={SPACING.spacing4}>
          {wavelengths.map((wavelength: number, index: number) => (
            <>
              <Tag
                text={`${wavelength} ${t('application:units.nanometer')}`}
                type="default"
              />
              {index < wavelengths.length - 1 ? (
                <StyledText>,</StyledText>
              ) : null}
            </>
          ))}
        </Flex>
      )
      if (mode === 'single') {
        stepSummaryContent =
          referenceWavelengthActive === true && referenceWavelength != null ? (
            <StyledTrans
              i18nKey="protocol_steps:absorbance_reader.initialize_single_with_reference"
              tagText={`${wavelengths[0]}${t('application:units.nanometer')}`}
              tagText2={`${referenceWavelength}${t(
                'application:units.nanometer'
              )}`}
            />
          ) : (
            <StyledTrans
              i18nKey="protocol_steps:absorbance_reader.initialize_single"
              tagText={`${wavelengths[0]}${t('application:units.nanometer')}`}
            />
          )
        break
      }
      // mode is multi
      stepSummaryContent = (
        <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('protocol_steps:absorbance_reader.initialize_multi')}
          </StyledText>
          {wavelengthsComponents}
        </Flex>
      )
      break
    }
    case ABSORBANCE_READER_LID: {
      stepSummaryContent = (
        <StyledTrans
          i18nKey="protocol_steps:absorbance_reader.initialize_lid"
          tagText={t(
            `protocol_steps:absorbance_reader.${
              lidOpen === true ? 'open' : 'closed'
            }`
          )}
        />
      )
      break
    }
  }
  return stepSummaryContent
}
