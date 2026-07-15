// Respaldo de la base de datos. Pensado para correr por cron en el VPS
// (diario), pero funciona en cualquier entorno:
//
//   node server/backup.js            → respalda a ~/backups (o BACKUP_DIR)
//   node server/backup.js --email    → además manda la copia por correo
//                                      (respaldo FUERA del servidor; requiere
//                                      SMTP_* configurado)
//
// Usa `VACUUM INTO`, que produce una copia consistente y compacta aunque la
// base esté en uso (seguro con WAL) — nunca copiar el archivo .db a mano:
// con -wal pendiente la copia puede salir corrupta.
//
// Retención: se conservan los últimos 14 respaldos (uno por día); los más
// viejos se borran solos.
//
// El cron NO corre dentro de PM2, así que las variables de ~/.env (SMTP) no
// vienen en el ambiente: se leen aquí con el mismo parser que
// ecosystem.config.js, ANTES de importar el mailer (lee process.env al
// cargarse — por eso el import es dinámico, abajo).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const KEEP_BACKUPS = 14;
const BACKUP_NAME_PATTERN = /^autocells-\d{4}-\d{2}-\d{2}\.db$/;

const envFile = path.join(os.homedir(), '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) process.env[line.slice(0, idx)] ??= line.slice(idx + 1);
  }
}

const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'autocells.db');
const backupDir = process.env.BACKUP_DIR ?? path.join(os.homedir(), 'backups');
fs.mkdirSync(backupDir, { recursive: true });

const today = new Date();
const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const backupPath = path.join(backupDir, `autocells-${dateKey}.db`);

// VACUUM INTO falla si el destino existe (correr dos veces el mismo día).
if (fs.existsSync(backupPath)) fs.rmSync(backupPath);

const db = new DatabaseSync(dbPath, { readOnly: true });
// El path va incrustado en el SQL: se escapan comillas simples por si la ruta
// las trajera (en la práctica no, pero un respaldo no debe tronar por eso).
db.exec(`VACUUM INTO '${backupPath.replaceAll("'", "''")}'`);
db.close();

const size = fs.statSync(backupPath).size;
console.log(`[${new Date().toISOString()}] Respaldo creado: ${backupPath} (${(size / 1024).toFixed(1)} KB)`);

// Poda: solo los KEEP_BACKUPS más recientes (el nombre ordena por fecha).
const backups = fs
  .readdirSync(backupDir)
  .filter((name) => BACKUP_NAME_PATTERN.test(name))
  .sort()
  .reverse();
for (const name of backups.slice(KEEP_BACKUPS)) {
  fs.rmSync(path.join(backupDir, name));
  console.log(`Respaldo viejo eliminado: ${name}`);
}

// Copia fuera del servidor: por correo, al buzón de la tienda. Si el SMTP no
// está configurado se avisa y el respaldo local queda igual.
if (process.argv.includes('--email')) {
  const { isMailerConfigured } = await import('./mailer.js');
  if (!isMailerConfigured()) {
    console.log('SMTP sin configurar: el respaldo no se envió por correo.');
  } else {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: Number(process.env.SMTP_PORT ?? 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
      // BACKUP_MAIL_TO permite mandarlo a otro buzón sin tocar el código.
      to: process.env.BACKUP_MAIL_TO ?? process.env.SMTP_USER,
      subject: `Respaldo AUTOCELLS ${dateKey}`,
      text:
        `Respaldo diario de la base de datos de autocells.store (${(size / 1024).toFixed(1)} KB).\n` +
        `Para restaurarlo: reemplazar ~/app/server/autocells.db con el adjunto ` +
        `(con el backend detenido) y reiniciar PM2.`,
      attachments: [{ filename: `autocells-${dateKey}.db`, path: backupPath }],
    });
    console.log(`Respaldo enviado por correo a ${process.env.BACKUP_MAIL_TO ?? process.env.SMTP_USER}.`);
  }
}
