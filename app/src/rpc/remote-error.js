// remote call error object
export default class RemoteError extends Error {
  constructor (message, methodName, args, traceback) {
    super(message)
    this.name = this.constructor.name
    this.methodName = methodName
    this.args = args
    this.traceback = traceback
  }
}
