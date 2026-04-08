export function configureLogging(): void {
  return;
}

export function getLogger() {
  return {
    info(event: string, payload: Record<string, unknown>) {
      console.log(JSON.stringify({ level: "info", event, time: new Date().toISOString(), ...payload }));
    },
    error(event: string, payload: Record<string, unknown>) {
      console.error(JSON.stringify({ level: "error", event, time: new Date().toISOString(), ...payload }));
    }
  };
}
