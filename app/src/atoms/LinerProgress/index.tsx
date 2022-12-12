import * as React from 'react'
import { css } from 'styled-components'

import { COLORS, Box } from '@opentrons/components'

interface LinerProgressProps {
  completed: number
  /** optional liner progress's background the color default color is white */
  bgColor?: string
  /** optional liner progress's height the default height is 0.5rem(8px) */
  height?: string
  /** optional liner progress bar color the default color is blueEnabled */
  color?: string
  /** optional liner progress bar radius the default is 0 */
  borderRadius?: string
  /** optional  */
  animationStyle?: string
}

export function LinerProgress({
  completed,
  bgColor = COLORS.white,
  height = '0.5rem',
  color = COLORS.blueEnabled,
  borderRadius = '0',
}: LinerProgressProps): JSX.Element {
  const [progress, setProgress] = React.useState<string>(`${completed}%`)

  const LINER_PROGRESS_CONTAINER_STYLE = css`
    height: ${height};
    background: ${bgColor};
    padding: 0;
    width: 100%;
    margin: 0;
    overflow: hidden;
    border-radius: ${borderRadius};
  `

  const LINER_PROGRESS_FILLER_STYLE = css`
    height: ${height};
    width: ${progress};
    background: ${color};
    transition: ${progress} 1s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: right;
    border-radius: inherit;
  `

  const getCurrentProgress = (): string => {
    const ratio = completed / 100
    return ratio > 1 ? '100%' : `${String(ratio * 100)}%`
  }

  const currentProgress = getCurrentProgress()

  React.useEffect(() => {
    requestAnimationFrame(() => setProgress(currentProgress))
  }, [currentProgress])

  return (
    <Box
      role="progressbar"
      css={LINER_PROGRESS_CONTAINER_STYLE}
      data-testid="LinerProgress_Container"
    >
      <Box
        css={LINER_PROGRESS_FILLER_STYLE}
        data-testid="LinerProgress_Bar"
      ></Box>
    </Box>
  )
}
