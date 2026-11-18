# Bitácora de retardo del bucle y pool

## Entorno
Docker Compose con imagen base node:22-alpine para Pedidos. Autocannon 8.0.0 se ejecutó desde Windows con Node.js v24.11.1. El servicio reportó 12 núcleos disponibles y límites de 12 trabajadores y 24 trabajos en cola.
## 1. Resultados
Se reinició Pedidos antes de cada escenario. Los tiempos de Autocannon se midieron desde el cliente.
Bloqueante · p50 5 ms · máximo 530 ms · retardo máximo del bucle 510 ms.
Worker sin límite · p50 5377 ms · máximo 6429 ms · retardo máximo del bucle 329 ms.
Pool · p50 19 ms · máximo 5680 ms · retardo máximo del bucle 143 ms · 142 respuestas 2xx y 11 644 respuestas no 2xx observadas por el cliente.
Autocannon informa 221 solicitudes en el segundo escenario y el servidor contabilizó 172 respuestas terminadas en /reporte/worker al consultar /metricas. El total de solicitudes no equivale al de respuestas completadas.
## Escenario 1
Salida de Autocannon (se normalizaron los separadores de la tabla)
Running 15s test @ http://127.0.0.1:3000/health
20 connections
|  Stat     |  2.5%  |  50%   |  97.5%  |  99%    |  Avg      |  Stdev     |  Max     |
|  Latency  |  2 ms  |  5 ms  |  19 ms  |  27 ms  |  7.02 ms  |  14.15 ms  |  530 ms  |
|  Stat       |  1%      |  2.5%    |  50%     |  97.5%    |  Avg      |  Stdev   |  Min     |
|  Req/Sec    |  649     |  649     |  2.553   |  3.771    |  2.661,6  |  854,25  |  649     |
|  Bytes/Sec  |  176 kB  |  176 kB  |  692 kB  |  1.02 MB  |  721 kB   |  231 kB  |  176 kB  |
Req/Bytes counts sampled once per second.
# of samples: 15
40k requests in 15.03s, 10.8 MB read
Respuesta completa de GET /metricas
{
  "umbralLentaMs": 1000,
  "rutas": [
    {
      "ruta": "GET /health",
      "peticiones": 39938,
      "promedioMs": 0.23384796652311712,
      "maxMs": 22.636775999999372,
      "lentas": 0
    },
    {
      "ruta": "GET /reporte/bloqueante",
      "peticiones": 2,
      "promedioMs": 398.90448899999956,
      "maxMs": 492.26128900000003,
      "lentas": 0
    }
  ],
  "bucle": {
    "p50Ms": 10,
    "p99Ms": 24,
    "maxMs": 510
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
## Escenario 2
Salida de Autocannon (se normalizaron los separadores de la tabla)
Running 20s test @ http://127.0.0.1:3000/reporte/worker?n=2000000
50 connections
|  Stat     |  2.5%     |  50%      |  97.5%    |  99%      |  Avg         |  Stdev      |  Max      |
|  Latency  |  2993 ms  |  5377 ms  |  6131 ms  |  6140 ms  |  5129.61 ms  |  880.29 ms  |  6429 ms  |
|  Stat       |  1%   |  2.5%  |  50%      |  97.5%    |  Avg      |  Stdev   |  Min    |
|  Req/Sec    |  0    |  0     |  4        |  35       |  8,56     |  10      |  1      |
|  Bytes/Sec  |  0 B  |  0 B   |  1.16 kB  |  10.2 kB  |  2.48 kB  |  2.9 kB  |  290 B  |
Req/Bytes counts sampled once per second.
# of samples: 20
221 requests in 20.2s, 49.6 kB read
Respuesta completa de GET /metricas
{
  "umbralLentaMs": 1000,
  "rutas": [
    {
      "ruta": "GET /health",
      "peticiones": 1,
      "promedioMs": 5.977465000000052,
      "maxMs": 5.977465000000052,
      "lentas": 0
    },
    {
      "ruta": "GET /reporte/worker",
      "peticiones": 172,
      "promedioMs": 5006.099434406976,
      "maxMs": 6431.203057000001,
      "lentas": 172
    }
  ],
  "bucle": {
    "p50Ms": 10,
    "p99Ms": 73,
    "maxMs": 329
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
## Escenario 3
Salida de Autocannon (se normalizaron los separadores de la tabla)
Running 20s test @ http://127.0.0.1:3000/reporte/pool?n=2000000
50 connections
|  Stat     |  2.5%  |  50%    |  97.5%  |  99%      |  Avg      |  Stdev      |  Max      |
|  Latency  |  6 ms  |  19 ms  |  77 ms  |  3791 ms  |  75.4 ms  |  482.32 ms  |  5680 ms  |
|  Stat       |  1%      |  2.5%    |  50%     |  97.5%   |  Avg     |  Stdev    |  Min     |
|  Req/Sec    |  273     |  273     |  547     |  977     |  589,3   |  173,25   |  273     |
|  Bytes/Sec  |  102 kB  |  102 kB  |  205 kB  |  367 kB  |  221 kB  |  65.1 kB  |  102 kB  |
Req/Bytes counts sampled once per second.
# of samples: 20
142 2xx responses, 11644 non 2xx responses
12k requests in 20.07s, 4.42 MB read
Respuesta completa de GET /metricas
{
  "umbralLentaMs": 1000,
  "rutas": [
    {
      "ruta": "GET /health",
      "peticiones": 1,
      "promedioMs": 7.9399459999999635,
      "maxMs": 7.9399459999999635,
      "lentas": 0
    },
    {
      "ruta": "GET /reporte/pool",
      "peticiones": 11800,
      "promedioMs": 52.97282280805083,
      "maxMs": 5652.7079790000025,
      "lentas": 142
    }
  ],
  "bucle": {
    "p50Ms": 15,
    "p99Ms": 64,
    "maxMs": 143
  },
  "nucleos": 12,
  "pool": {
    "maxTrabajadores": 12,
    "activos": 12,
    "enCola": 21,
    "maxCola": 24,
    "rechazadas": 11658
  }
}
## 2. Análisis
1. Bloqueo y latencia de /health
El cálculo de primos ocupa el hilo principal. El retardo máximo del bucle llegó a 510 ms y Autocannon observó hasta 530 ms desde el cliente. El interceptor mide desde que Express comienza a atender la petición, por lo que el máximo interno de /health fue de 22,64 ms.
2. Un trabajador por petición
Crear un trabajador por reporte desplaza el cálculo fuera del hilo principal. Con 50 conexiones, los trabajadores compiten por los recursos disponibles y su creación añade carga. La mediana del cliente subió a 5377 ms.
3. Rechazo explícito y timeout
El pool registró 11 658 rechazos al consultar las métricas. Autocannon recibió 11 644 respuestas no 2xx dentro de su medición. Un 503 indica que el servidor rechazó la solicitud y la cabecera Retry-After propone esperar un segundo. Un timeout significa que expiró el plazo del cliente sin recibir respuesta.
4. Comportamiento de los reintentos
La carga siguió enviando peticiones con 50 conexiones. Los rechazos rápidos influyeron en la mediana de 19 ms del pool. Para un cliente de aplicación, respetar Retry-After, limitar los intentos y añadir una demora aleatoria reduce la concentración de reintentos.
5. Tres réplicas de Pedidos
/metricas refleja el proceso que atiende la consulta. Con 12 trabajadores por réplica podrían operar hasta 36 reportes simultáneos. Se pueden agregar métricas etiquetadas por réplica y usar un mecanismo compartido de admisión si se necesita un límite global.
## 3. Problemas encontrados
Se ajustó la comprobación de /health después del reinicio. Windows PowerShell trató los mensajes de progreso de Autocannon como errores y mostró caracteres alterados en las tablas. Se ajustó la captura de salida y la ejecución final completó los tres escenarios.
## 4. Uso declarado de IA
Usé Codex para implementar el interceptor y el pool, ajustar el script de carga y redactar la bitácora con las mediciones verificadas.
