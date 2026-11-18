
import express, {Request, Response} from "express";

const PORT = Number(process.env.PORT ?? 3001);
const RETARDO_MS = Number(process.env.RETARDO_MS ?? 1000);

const stock = new Map<string, number>([
    ["LAPTOP-14", 5],
    ["MOUSE-USB", 40],
    ["TECLADO-ES", 12],
    ["MONITOR-24", 0]
]);

const esperar = (ms: number) =>
    new Promise<void>((r) => setTimeout(r, ms));

const app = express();

// Permitir recibir datos JSON
app.use(express.json());

// Verificar que Inventario está funcionando
app.get("/health", (req: Request, res: Response) => {
    res.json({status: "ok", servicio: "inventario"});
});

// Consultar el stock de un producto
app.get("/stock/:sku", async (
    req: Request<{sku: string}>,
    res: Response
) => {
    if (RETARDO_MS > 0) await esperar(RETARDO_MS);

    const disponible = stock.get(req.params.sku);

    if (disponible === undefined) {
        res.status(404).json({
            error: "SKU no encontrado " + req.params.sku
        });
        return;
    }

    res.json({sku: req.params.sku, disponible});
});

// Reservar stock de un producto
app.post("/stock/:sku/reservar", async (
    req: Request<{sku: string}>,
    res: Response
) => {
    const sku = req.params.sku;
    const {cantidad} = req.body ?? {};

    // Validar cantidad
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        res.status(400).json({
            error: "La cantidad debe ser un entero mayor que 0"
        });
        return;
    }

    // Aplicar retardo antes de descontar
    if (RETARDO_MS > 0) await esperar(RETARDO_MS);

    const disponible = stock.get(sku);

    // Verificar si existe el producto
    if (disponible === undefined) {
        res.status(404).json({
            error: "SKU no encontrado " + sku
        });
        return;
    }

    // Verificar si hay stock suficiente
    if (disponible < cantidad) {
        res.status(409).json({
            error: "Stock insuficiente",
            sku,
            solicitado: cantidad,
            disponible
        });
        return;
    }

    // Descontar stock
    const restante = disponible - cantidad;
    stock.set(sku, restante);

    res.json({
        sku,
        reservado: cantidad,
        restante
    });
});

app.listen(PORT, () => {
    console.log(
        `Servicio inventario escuchando en puerto ${PORT} retraso ${RETARDO_MS}`
    );
});
