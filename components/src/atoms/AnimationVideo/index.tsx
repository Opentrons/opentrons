import type { ComponentProps, ReactNode } from 'react'

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
export function AnimationVideo(props: AnimationVideoProps): ReactNode {
  const {
    autoPlay = true,
    loop = true,
    // Our animations don't have audio, but we apparently need to pass `muted` anyway.
    // It prevents the browser from trying to play audio on connected Bluetooth
    // headphones, which would interrupt audio coming from other devices.
    //
    // Because of some React nonsense, the rendered DOM node will not have a `muted`
    // attribute, but its `muted` property will be true, which is good enough.
    // https://github.com/facebook/react/issues/10389
    muted = true,
    controls = false,
    disableRemotePlayback = true,
    disablePictureInPicture = true,
    ...restProps
  } = props
  return (
    <video
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      controls={controls}
      disableRemotePlayback={disableRemotePlayback}
      disablePictureInPicture={disablePictureInPicture}
      {...restProps}
      // Child <source>s rendered via {...restProps} spreading above.
    />
  )
}
