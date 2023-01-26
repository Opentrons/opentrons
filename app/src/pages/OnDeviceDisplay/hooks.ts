import { useRef, useEffect, useState, CSSProperties } from 'react'
import interact from 'interactjs'

type Partial<T> = {
  [P in keyof T]?: T[P]
}

const initPosition = {
  width: 0,
  height: 0,
  x: 0,
  y: 0,
}

/**
 * HTML要素を動かせるようにする
 * 返り値で所得できるinteractRefと、interactStyleをそれぞれ対象となるHTML要素の
 * refとstyleに指定することで、そのHTML要素のリサイズと移動が可能になる
 * @param position HTML要素の初期座標と大きさ、指定されない場合はinitPositionで指定された値になる
 */
export function useInteractJS(
  position: Partial<typeof initPosition> = initPosition
) {
  const [_position, setPosition] = useState({
    ...initPosition,
    ...position,
  })
  const [isEnabled, setEnable] = useState(true)

  const interactRef = useRef(null)
  let { x, y, width, height } = _position

  const enable = () => {
    interact((interactRef.current as unknown) as HTMLElement)
      .draggable({
        origin: 'self',
        inertia: true,
        modifiers: [
          interact.modifiers.restrict({
            restriction: 'self', // keep the drag coords within the element
          }),
          // interact.modifiers.snap({
          //   targets: [interact.snappers.grid({ x: 30, y: 30 })],
          //   range: Infinity,
          //   relativePoints: [{ x: 0, y: 0 }]
          // })
          // interact.modifiers.restrict({
          //   restriction: element.parentNode,
          //   elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
          //   endOnly: true
          // })
        ],
        // startAxis: "x",
        // lockAxis: "x"
      })
      .on('dragmove', event => {
        x += event.dx
        y += event.dy
        const sliderWidth = interact.getElementRect(event.target).width
        const value = event.pageX / sliderWidth
        event.target.style.paddingLeft = `${value * 100}%`
        event.target.setAttribute('data-value', (value * 100).toFixed(2))

        setPosition({
          width,
          height,
          x,
          y,
        })
      })
      .on('resizemove', event => {
        width = event.rect.width
        height = event.rect.height
        x += event.deltaRect.left
        y += event.deltaRect.top

        setPosition({
          x,
          y,
          width,
          height,
        })
      })
  }

  const disable = () => {
    interact((interactRef.current as unknown) as HTMLElement).unset()
  }

  useEffect(() => {
    if (isEnabled) {
      enable()
    } else {
      disable()
    }
    return disable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled])

  return {
    ref: interactRef,
    style: {
      transform: `translate3D(${_position.x}px, ${_position.y}px, 0)`,
      width: _position.width + 'px',
      // width: _position.progress * 100 + "%",
      height: _position.height + 'px',
      position: 'absolute' as CSSProperties['position'],
    },
    position: _position,
    isEnabled,
    enable: () => setEnable(true),
    disable: () => setEnable(false),
  }
}
