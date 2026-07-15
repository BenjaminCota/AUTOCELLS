// Escalabilidad en una sola máquina: Node corre JS en un solo hilo, así que
// `node server/index.js` usa un único núcleo. Este launcher levanta un worker
// por núcleo (todos comparten el puerto; el sistema operativo reparte las
// conexiones) y revive a los que mueran, para que una caída no tire el sitio.
// Es seguro con SQLite porque la base está en modo WAL con busy_timeout (ver
// db.js): varios procesos pueden leer y escribir el mismo archivo, y las
// carreras entre procesos las resuelven los constraints UNIQUE (ver index.js).
// Uso: `npm run server:cluster` (WORKERS=n para fijar el número a mano).
import cluster from 'node:cluster';
import os from 'node:os';

if (cluster.isPrimary) {
  const workers = Number(process.env.WORKERS) || os.availableParallelism();
  console.log(`API de AUTOCELLS en cluster: ${workers} workers (pid maestro ${process.pid})`);
  for (let i = 0; i < workers; i += 1) cluster.fork();

  cluster.on('exit', (worker, code) => {
    console.warn(`Worker ${worker.process.pid} terminó (código ${code}); levantando reemplazo.`);
    cluster.fork();
  });
} else {
  await import('./index.js');
}
