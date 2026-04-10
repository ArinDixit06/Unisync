export function configureLogging() {
    return;
}
export function getLogger() {
    return {
        info(event, payload) {
            console.log(JSON.stringify({ level: "info", event, time: new Date().toISOString(), ...payload }));
        },
        error(event, payload) {
            console.error(JSON.stringify({ level: "error", event, time: new Date().toISOString(), ...payload }));
        }
    };
}
