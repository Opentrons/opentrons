// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Box, POSITION_FIXED } from '@opentrons/components'
import * as fileDataSelectors from '../file-data/selectors'

export const ComputingSpinner = (): React.Node => {
  const showSpinner = useSelector(fileDataSelectors.getTimelineIsBeingComputed)

  return (
    showSpinner && (
      <Box
        cursor="wait" // TODO(IL, 2020-07-16): make a const CURSOR_WAIT to import here
        opacity={0}
        zIndex={999}
        position={POSITION_FIXED}
        top={0}
        bottom={0}
        left={0}
        right={0}
        data-test="ComputingSpinner"
      />
    )
  )
}
