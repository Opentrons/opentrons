import { Trans, useTranslation } from 'react-i18next'
import first from 'lodash/first'
import last from 'lodash/last'

import {
  ALIGN_CENTER,
  Flex,
  NO_WRAP,
  SPACING,
  StyledText,
  Tag,
  WRAP,
} from '@opentrons/components'

export const getWellsForStepSummary = (
  targetWells: string[],
  labwareWells: string[]
): string => {
  if (targetWells.length === 1) {
    return targetWells[0]
  }
  const firstElementIndexOffset = labwareWells.indexOf(targetWells[0])
  const isInOrder = targetWells.every(
    (targetWell, i) =>
      labwareWells.indexOf(targetWell) === firstElementIndexOffset + i
  )
  return isInOrder
    ? `${first(targetWells)}-${last(targetWells)}`
    : `${targetWells.length} wells`
}

interface StyledTransProps {
  i18nKey: string
  tagText?: string
  values?: object
}

export function StyledTrans(props: StyledTransProps): JSX.Element {
  const { i18nKey, tagText, values } = props
  const { t } = useTranslation(['protocol_steps', 'application'])

  return (
    <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER} flexWrap={WRAP}>
      <Trans
        t={t}
        i18nKey={i18nKey}
        components={{
          text: (
            <StyledText
              desktopStyle="bodyDefaultRegular"
              style={{ whiteSpace: NO_WRAP }}
            />
          ),
          semiBoldText: (
            <StyledText
              desktopStyle="bodyDefaultSemiBold"
              style={{ whiteSpace: NO_WRAP }}
            />
          ),
          tag: <Tag type="default" text={tagText ?? ''} />,
        }}
        values={values}
      />
    </Flex>
  )
}
