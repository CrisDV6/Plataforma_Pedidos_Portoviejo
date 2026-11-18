import { parentPort, workerData } from "node:worker_threads";
import { contarPrimos } from "./reporte";

parentPort?.postMessage(contarPrimos(workerData.n));
