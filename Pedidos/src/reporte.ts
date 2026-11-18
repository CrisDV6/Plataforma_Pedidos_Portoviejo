import { join } from "node:path";
import { Worker } from "node:worker_threads";

export function contarPrimos(n: number): number {
    let total = 0;
    for (let candidato = 2; candidato <= n; candidato++) {
        let divisor = 2;
        while (divisor * divisor <= candidato && candidato % divisor !== 0) {
            divisor++;
        }
        if (divisor * divisor > candidato) total++;
    }
    return total;
}

export function ejecutarReporte(n: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const extension = __filename.endsWith(".ts") ? "ts" : "js";
        const ruta = join(__dirname, `worker-reporte.${extension}`);
        const worker = extension === "ts"
            ? new Worker(`require(${JSON.stringify(require.resolve("tsx/cjs"))}); require(require("node:worker_threads").workerData.ruta);`, {
                eval: true,
                execArgv: [],
                workerData: { n, ruta },
            })
            : new Worker(ruta, { workerData: { n } });

        let resultado: number | undefined;
        worker.once("message", (primos: number) => { resultado = primos; });
        worker.once("error", reject);
        worker.once("exit", (codigo) => {
            if (codigo === 0 && resultado !== undefined) resolve(resultado);
            else reject(new Error(`El trabajador terminó sin resultado (código ${codigo})`));
        });
    });
}
