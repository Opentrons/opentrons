// remote call error object
export class RemoteError extends Error {
  constructor(message, methodName, args, traceback) {
    super(message)
    this.name = 'RemoteError'
    this.methodName = methodName
    this.args = args
    this.traceback = traceback
  }
}
