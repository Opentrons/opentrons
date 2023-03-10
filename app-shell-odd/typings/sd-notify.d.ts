declare module 'sd-notify' {
    function ready(): void
    function sendStatus(text: string): void
    function startWatchdogMode(interval: number): void
    function stopWatchdogMode(): void
    export = {
        ready, sendStatus, startWatchdogMode, stopWatchdogMode
    }
}
