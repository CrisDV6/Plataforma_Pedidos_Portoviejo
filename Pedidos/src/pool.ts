import { availableParallelism } from "node:os";
import { ejecutarReporte } from "./reporte";

function limite(valor: string | undefined, defecto: number, minimo: number): number {
    const numero = Number(valor ?? defecto);
    return Number.isSafeInteger(numero) && numero >= minimo ? numero : defecto;
}

const maxTrabajadores = limite(process.env.MAX_TRABAJADORES, availableParallelism(), 1);
const maxCola = limite(process.env.MAX_COLA, 2 * maxTrabajadores, 0);
let activos = 0;
let rechazadas = 0;
const cola: Array<() => void> = [];

export function estadoPool() {
    return { maxTrabajadores, activos, enCola: cola.length, maxCola, rechazadas };
}

export function contarPrimosEnPool(n: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const ejecutar = () => {
            activos++;
            void completar();
        };

        async function completar(): Promise<void> {
            try {
                resolve(await ejecutarReporte(n));
            } catch (error) {
                reject(error);
            } finally {
                activos--;
                cola.shift()?.();
            }
        }

        if (activos < maxTrabajadores) ejecutar();
        else if (cola.length < maxCola) cola.push(ejecutar);
        else {
            rechazadas++;
            const error = new Error("La cola de trabajadores está llena");
            error.name = "PoolLleno";
            reject(error);
        }
    });
}
