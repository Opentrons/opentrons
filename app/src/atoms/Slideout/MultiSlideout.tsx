import { Slideout } from './index'

import type { MultiSlideoutSpecs, SlideoutProps } from './index'

type MultiSlideoutProps = SlideoutProps & MultiSlideoutSpecs

export const MultiSlideout = (props: MultiSlideoutProps): JSX.Element => {
  const {
    isExpanded,
    title,
    onCloseClick,
    children,
    footer,
    maxSteps,
    currentStep,
  } = props

  return (
    <Slideout
      title={title}
      isExpanded={isExpanded}
      footer={footer}
      onCloseClick={onCloseClick}
      multiSlideoutSpecs={{ currentStep, maxSteps }}
    >
      {children}
    </Slideout>
  )
}
