import { makeWorker } from './makeWorker'
// @ts-expect-error(sa, 2021-6-20): Window and WorkerContext types are not compatible
makeWorker(self)
