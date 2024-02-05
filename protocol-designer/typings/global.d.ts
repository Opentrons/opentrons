declare global {
  interface Global {
    document: {
      getElementsByClassName: (val: string) => any[]
    }
  }
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: (val: string) => any
  }
  export var enablePrereleaseMode: () => void
}
// this is trickery to tell this file it is an external module: https://stackoverflow.com/a/59499895
export {}
