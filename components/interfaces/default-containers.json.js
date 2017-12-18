declare module './src/default-containers.json' {
  declare var containers: {
    [containerType: string]: {
      'origin-offset'?: {
        x: number,
        y: number
      },
      locations: {
        [wellName: string]: {
          x: number,
          y: number,
          z: number,
          depth: number,
          diameter: number,
          'total-liquid-volume': number
        }
      }
    }
  }
}
