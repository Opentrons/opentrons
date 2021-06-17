declare global {
  namespace NodeJS {
    export interface Global {
      document: {
        getElementsByClassName: (val: string) => any[]
      }
    }
  }
}
// this is trickery to tell this file it is an external module: https://stackoverflow.com/a/59499895
export {}
