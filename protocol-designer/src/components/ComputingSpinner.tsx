import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import { Box, CURSOR_WAIT, POSITION_FIXED } from '@opentrons/components'
import * as fileDataSelectors from '../file-data/selectors'

const waitCursorStyle = css`
  cursor: ${CURSOR_WAIT};
`

export const ComputingSpinner = (): JSX.Element | null => {
  const showSpinner = useSelector(fileDataSelectors.getTimelineIsBeingComputed)

  return showSpinner ? (
    <Box
      css={waitCursorStyle}
      opacity={0}
      zIndex={999}
      position={POSITION_FIXED}
      top={0}
      bottom={0}
      left={0}
      right={0}
      data-test="ComputingSpinner"
    />
  ) : null
}
