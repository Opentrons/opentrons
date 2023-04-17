import * as React from 'react'
import logo from '../../assets/images/odd/opentrons_logo.png'

export function SleepScreen(): JSX.Element {
  const speed = 50
  const scale = 0.4
  let canvas: HTMLCanvasElement
  let ctx: any
  let logoColor: string

  const dvd = {
    x: 200,
    y: 300,
    xspeed: 10,
    yspeed: 10,
    img: new Image(),
  }

  // Pick a random color in RGB format
  const pickColor = (): void => {
    const r = Math.random() * (254 - 0) + 0
    const g = Math.random() * (254 - 0) + 0
    const b = Math.random() * (254 - 0) + 0

    logoColor = `rgb(${r}, ${g}, ${b})`
  }

  // Check for border collision
  const checkHitBox = (): void => {
    if (dvd.x + dvd.img.width * scale >= canvas?.width || dvd.x <= 0) {
      dvd.xspeed *= -1
      pickColor()
    }

    if (dvd.y + dvd.img.height * scale >= canvas?.height || dvd.y <= 0) {
      dvd.yspeed *= -1
      pickColor()
    }
  }

  const update = (): void => {
    setTimeout(() => {
      // Draw the canvas background
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas?.width, canvas?.height)
      // Draw DVD Logo and his background
      ctx.fillStyle = logoColor
      ctx.fillRect(dvd.x, dvd.y, dvd.img.width * scale, dvd.img.height * scale)
      ctx.drawImage(
        dvd.img,
        dvd.x,
        dvd.y,
        dvd.img.width * scale,
        dvd.img.height * scale
      )
      // Move the logo
      dvd.x += dvd.xspeed
      dvd.y += dvd.yspeed
      // Check for collision
      checkHitBox()
      update()
    }, speed)
  }

  const main = (): void => {
    // @ts-expect-error
    canvas = document.getElementById('odd-screen')
    ctx = canvas?.getContext('2d')
    dvd.img.src = logo

    // Draw the "tv screen"
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    pickColor()
    update()
  }

  React.useEffect(() => {
    main()
  }, [])

  return (
    <div>
      <canvas id="odd-screen"></canvas>
    </div>
  )
}
