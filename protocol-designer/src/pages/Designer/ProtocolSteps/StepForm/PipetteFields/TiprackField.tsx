import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { getPipetteEntities } from '/protocol-designer/step-forms/selectors'
import { getTiprackOptions } from '/protocol-designer/ui/labware/selectors'

import type { ReactNode } from 'react'
import type { FieldProps } from '../types'

interface TiprackFieldProps extends FieldProps {
  pipetteId?: unknown
}
export function TiprackField(props: TiprackFieldProps): ReactNode {
  const {
    value,
    pipetteId,
    errorToShow,
    padding = `0 ${SPACING.spacing16}`,
  } = props
  const { t } = useTranslation('protocol_steps')
  const pipetteEntities = useSelector(getPipetteEntities)
  const options = useSelector(getTiprackOptions)
  const defaultTiprackUris =
    pipetteId != null ? pipetteEntities[pipetteId as string].tiprackDefURI : []
  const tiprackOptions = options.filter(option =>
    defaultTiprackUris.includes(option.value)
  )

  const hasMissingTiprack = defaultTiprackUris.length > tiprackOptions.length
  return (
    <>
      {tiprackOptions.length > 1 ? (
        <DropdownStepFormField
          {...props}
          options={tiprackOptions}
          value={String(value) != null ? String(value) : null}
          title={t('tiprack')}
          tooltipContent={hasMissingTiprack ? 'missing_tiprack' : null}
          width="100%"
        />
      ) : (
        <Flex
          padding={padding ?? SPACING.spacing16}
          gridGap={SPACING.spacing8}
          flexDirection={DIRECTION_COLUMN}
          width="100%"
        >
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('tiprack')}
          </StyledText>
          <ListItem type={errorToShow ? 'error' : 'default'}>
            <Flex padding={SPACING.spacing12}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {tiprackOptions[0]?.name ?? t('no_tiprack')}
              </StyledText>
            </Flex>
          </ListItem>
        </Flex>
      )}
    </>
  )
}
