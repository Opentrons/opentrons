import type { ComponentProps } from 'react'

export type AnimationVideoProps = ComponentProps<'video'>

/**
 * A `<video>` tag with default props for showing a looping animation.
 *
 * @example
 * ```jsx
 * <AnimationVideo>
 *   <source src="foo.webm" />
 * </AnimationVideo>
 * ```
 */
export function AnimationVideo(props: AnimationVideoProps): JSX.Element {
  return (
    <video
      autoPlay
      loop
      // Our animations don't have audio, but we apparently need to pass `muted` anyway.
      // It prevents the browser from trying to play audio on connected Bluetooth
      // headphones, which would interrupt audio coming from other devices.
      //
      // Bcause of some React nonsense, the rendered DOM node will not have a `muted`
      // attribute, but its `muted` property will be true, which is good enough.
      // https://github.com/facebook/react/issues/10389
      muted
      controls={false}
      {...props}
    >
      {/* Child <source> rendered via {...props} spreading above. */}
    </video>
  )
}
