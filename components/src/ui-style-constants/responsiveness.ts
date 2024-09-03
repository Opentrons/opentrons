// TODO(BC, 2023-04-20): this is media not sufficient to determine that we are on the
// touch-only On Device Display of the flex. For development purposes, we are omitting
// the (hover: none) to allow for off device testing. The hover rule should be reintroduced
// before the release of this code to prevent Funny desktop app behavior when the viewport
// is precisely 600x1024
export const touchscreenMediaQuerySpecs = '(height: 600px) and (width: 1024px)'

// This needs to be recalculated on-render to work with storybook viewport settings, so
// if you need to support both media types in js use the function
export const isTouchscreenDynamic = (): boolean =>
  typeof window === 'object' && window.matchMedia != null
    ? window.matchMedia(touchscreenMediaQuerySpecs).matches
    : false

export const isTouchscreen = isTouchscreenDynamic()
