# Interceptor de métricas en Pedidos

## Medición en Docker Compose
En Chrome se inició GET /reporte/bloqueante?n=2000000 y se lanzó GET /health 50 ms después. Ambas solicitudes devolvieron HTTP 200. Chrome registró 614 ms para el reporte y 551 ms para /health.
## Respuesta completa de GET /metricas
{
  "umbralLentaMs": 1000,
  "rutas": [
    {
      "ruta": "GET /health",
      "peticiones": 2,
      "promedioMs": 4.973528500006087,
      "maxMs": 8.64763500000117,
      "lentas": 0
    },
    {
      "ruta": "GET /favicon.ico",
      "peticiones": 1,
      "promedioMs": 3.67112799998722,
      "maxMs": 3.67112799998722,
      "lentas": 0
    },
    {
      "ruta": "GET /.well-known/appspecific/com.chrome.devtools.json",
      "peticiones": 1,
      "promedioMs": 1.888548000017181,
      "maxMs": 1.888548000017181,
      "lentas": 0
    },
    {
      "ruta": "GET /reporte/bloqueante",
      "peticiones": 1,
      "promedioMs": 479.5369790000259,
      "maxMs": 479.5369790000259,
      "lentas": 0
    }
  ],
  "bucle": {
    "p50Ms": 10,
    "p99Ms": 11,
    "maxMs": 481
  },
  "nucleos": 12,
  "pool": {
    "maxTrabajadores": 12,
    "activos": 0,
    "enCola": 0,
    "maxCola": 24,
    "rechazadas": 0
  }
}
## Explicación
Chrome midió 551 ms desde que se envió GET /health hasta que terminó la respuesta.
El cálculo del reporte ocupa el hilo principal y demora la atención de otras solicitudes.
El interceptor empieza a medir cuando Express puede procesar la petición y se detiene al enviar la respuesta.
El máximo interno de /health fue de 8,65 ms en dos peticiones y el bucle registró un retardo máximo de 481 ms.
La espera anterior al interceptor explica la diferencia con el tiempo observado en Chrome.
