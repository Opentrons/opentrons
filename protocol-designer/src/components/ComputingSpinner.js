// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  Flex,
  Icon,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  POSITION_FIXED,
} from '@opentrons/components'
import * as fileDataSelectors from '../file-data/selectors'

export const ComputingSpinner = (): React.Node => {
  const showSpinner = useSelector(fileDataSelectors.getTimelineIsBeingComputed)

  return (
    showSpinner && (
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        backgroundColor="rgba(115, 115, 115, 0.9)"
        zIndex={999}
        position={POSITION_FIXED}
        top={0}
        bottom={0}
        left={0}
        right={0}
        data-test="ComputingSpinner"
      >
        <Icon name="ot-spinner" width="7.5rem" marginBottom="3rem" spin />
      </Flex>
    )
  )
}
