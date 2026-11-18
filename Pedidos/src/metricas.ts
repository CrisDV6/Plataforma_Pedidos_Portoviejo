import { NextFunction, Request, Response } from "express";
import { monitorEventLoopDelay } from "node:perf_hooks";

const UMBRAL_LENTA_MS = Number(process.env.UMBRAL_LENTA_MS ?? 1000);
const retardoBucle = monitorEventLoopDelay({ resolution: 10 });
retardoBucle.enable();

interface Estadistica {
    peticiones: number;
    totalMs: number;
    maxMs: number;
    lentas: number;
}

const porRuta = new Map<string, Estadistica>();

export function medirLatencia(req: Request, res: Response, next: NextFunction): void {
    const inicio = performance.now();
    const clave = `${req.method} ${req.path}`;
    res.once("finish", () => {
        const ms = performance.now() - inicio;
        const estadistica = porRuta.get(clave) ?? { peticiones: 0, totalMs: 0, maxMs: 0, lentas: 0 };
        estadistica.peticiones++;
        estadistica.totalMs += ms;
        estadistica.maxMs = Math.max(estadistica.maxMs, ms);
        estadistica.lentas += Number(ms > UMBRAL_LENTA_MS);
        porRuta.set(clave, estadistica);
    });
    next();
}

export function resumenMetricas() {
    return {
        umbralLentaMs: UMBRAL_LENTA_MS,
        rutas: [...porRuta].map(([ruta, e]) => ({
            ruta,
            peticiones: e.peticiones,
            promedioMs: e.totalMs / e.peticiones,
            maxMs: e.maxMs,
            lentas: e.lentas,
        })),
        bucle: {
            p50Ms: Math.round(retardoBucle.percentile(50) / 1e6),
            p99Ms: Math.round(retardoBucle.percentile(99) / 1e6),
            maxMs: Math.round(retardoBucle.max / 1e6),
        },
    };
}
