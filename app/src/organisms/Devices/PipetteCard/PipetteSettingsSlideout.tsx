import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, DIRECTION_COLUMN, useInterval } from '@opentrons/components'
import { PipetteModelSpecs } from '@opentrons/shared-data'
import { fetchPipetteSettings } from '../../../redux/pipettes'
import { Slideout } from '../../../atoms/Slideout'
import { ConfigurePipette } from '../../ConfigurePipette'

import type { AttachedPipette } from '../../../redux/pipettes/types'
import type { Dispatch } from '../../../redux/types'

const FETCH_PIPETTES_INTERVAL_MS = 5000

interface PipetteSettingsSlideoutProps {
  robotName: string
  pipetteName: PipetteModelSpecs['displayName']
  onCloseClick: () => unknown
  isExpanded: boolean
  pipetteId: AttachedPipette['id']
}

export const PipetteSettingsSlideout = (
  props: PipetteSettingsSlideoutProps
): JSX.Element | null => {
  const { pipetteName, robotName, isExpanded, pipetteId, onCloseClick } = props
  const { t } = useTranslation('device_details')
  const dispatch = useDispatch<Dispatch>()

  useInterval(
    () => {
      dispatch(fetchPipetteSettings(robotName))
    },
    FETCH_PIPETTES_INTERVAL_MS,
    true
  )

  return (
    <Slideout
      title={t('pipette_settings', { pipetteName: pipetteName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      padding={'0'}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        data-testid={`PipetteSettingsSlideout_${robotName}_${pipetteId}`}
      >
        <ConfigurePipette
          robotName={robotName}
          closeModal={onCloseClick}
          pipetteId={pipetteId}
        />
      </Flex>
    </Slideout>
  )
}
