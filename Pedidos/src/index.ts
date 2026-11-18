
import express, {Request, Response} from 'express';
import {randomUUID} from "node:crypto";
import { medirLatencia, resumenMetricas } from "./metricas";
import { contarPrimos, ejecutarReporte } from "./reporte";

const PORT = Number(process.env.PORT ?? 3000);
const INVENTARIO_URL = process.env.INVENTARIO_URL ?? 'http://localhost:3001';
const TIMEOUT = Number(process.env.TIMEOUT ?? 2000);

interface Pedido {
    id: string;
    sku: string;
    cantidad: number;
    creadoEn: string;
}

const pedidos: Pedido[] = [];
const app = express();
app.use(express.json());
app.use(medirLatencia);

app.get("/metricas", (_req, res) => {
    res.json(resumenMetricas());
});

function registrarReporte(
    modo: string,
    calcular: (n: number) => number | Promise<number>
): void {
    app.get(`/reporte/${modo}`, async (req, res) => {
        const n = Number(req.query.n ?? 2_000_000);
        if (!Number.isSafeInteger(n) || n < 1 || n > 10_000_000) {
            res.status(400).json({ error: "n debe ser un entero entre 1 y 10000000" });
            return;
        }

        const inicio = performance.now();
        try {
            const primos = await calcular(n);
            res.json({ modo, n, primos, ms: Math.round(performance.now() - inicio) });
        } catch (error) {
            throw error;
        }
    });
}

registrarReporte("bloqueante", contarPrimos);
registrarReporte("worker", ejecutarReporte);

// HEALTH: comprueba que Pedidos está encendido
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", servicio: "pedidos" });
});

// READINESS: comprueba que Inventario esté disponible
app.get("/health/ready", async (_req: Request, res: Response) => {
    const inicio = performance.now();

    try {
        const r = await fetch(INVENTARIO_URL + "/health", {
            signal: AbortSignal.timeout(1000)
        });

        const ms = Math.round(performance.now() - inicio);

        if (r.ok) {
            res.status(200).json({
                status: "listo",
                inventario: "ok",
                ms
            });
            return;
        }

        res.status(503).json({
            status: "no-listo",
            inventario: "HTTP " + r.status,
            ms
        });

    } catch (error) {
        const ms = Math.round(performance.now() - inicio);
        const e = error as Error;

        res.status(503).json({
            status: "no-listo",
            inventario: e.name === "TimeoutError"
                ? "Inventario no respondió en 1000ms"
                : "No se pudo conectar con Inventario",
            ms
        });
    }
});

// CONSULTAR PEDIDOS
app.get("/pedidos", async (req: Request, res: Response) => {
    res.json(pedidos);
});

// CREAR PEDIDO Y RESERVAR STOCK
app.post("/pedidos", async (req: Request, res: Response) => {
    const {sku, cantidad} = req.body ?? {};

    if (
        typeof sku !== "string" ||
        !sku.trim() ||
        !Number.isInteger(cantidad) ||
        cantidad <= 0
    ) {
        res.status(400).json({
            error: "sku y cantidad son requeridos"
        });
        return;
    }

    const inicio = performance.now();

    try {
        // Reservar stock en Inventario usando POST
        const r = await fetch(
            INVENTARIO_URL + "/stock/" +
            encodeURIComponent(sku) + "/reservar",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({cantidad}),
                signal: AbortSignal.timeout(TIMEOUT)
            }
        );

        // SKU no encontrado
        if (r.status === 404) {
            res.status(404).json({
                error: "sku no encontrado en inventario " + sku
            });
            return;
        }

        // Stock insuficiente
        if (r.status === 409) {
            const detalle = await r.json();
            res.status(409).json(detalle);
            return;
        }

        // Otro error de Inventario
        if (!r.ok) {
            res.status(503).json({
                error: "Error al reservar stock",
                codigo: r.status
            });
            return;
        }

        // Crear pedido después de reservar correctamente
        const pedido: Pedido = {
            id: randomUUID(),
            sku,
            cantidad,
            creadoEn: new Date().toISOString()
        };

        pedidos.push(pedido);

        res.status(201).json(pedido);

    } catch (error) {
        const durancionMS = Math.round(performance.now() - inicio);
        const e = error as Error & {cause?: {code?: string}};

        const motivo = e.name === "TimeoutError"
            ? "Inventario no respondio en " + TIMEOUT + "ms"
            : "no se pudo conectar con inventario " +
              (e.cause?.code ?? e.message);

        console.error("error al crear pedido", motivo);

        res.status(503).json({
            error: "inventario no disponible",
            motivo,
            durancionMS
        });
    }
});

app.listen(PORT, () => {
    console.log(
        "pedidos en puerto " + PORT +
        " inventario en " + INVENTARIO_URL +
        " timeout en " + TIMEOUT + "ms"
    );
});
