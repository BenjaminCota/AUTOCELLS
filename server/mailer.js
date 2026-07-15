// Envío de correos con nodemailer sobre cualquier SMTP, configurado por
// variables de entorno — así el VPS decide el proveedor sin tocar código.
// Opciones sin costo: Gmail con "contraseña de aplicación" (SMTP_HOST
// smtp.gmail.com, puerto 465) o Brevo gratis (300 correos/día).
//
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  → credenciales del proveedor
//   MAIL_FROM   → remitente (default: SMTP_USER)
//   PUBLIC_URL  → origen público del sitio para armar los enlaces del correo
//                 (default http://localhost:5173 en dev)
//
// Sin SMTP configurado (dev), el correo NO se envía: el enlace se imprime en
// la consola del server y se regresa al cliente como `devVerifyUrl` para que
// la interfaz lo muestre — mismo espíritu que el "correo simulado" que ya
// usaba el registro. En producción, con SMTP configurado, ese atajo desaparece.
import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, PUBLIC_URL } = process.env;

export const publicUrl = (PUBLIC_URL ?? 'http://localhost:5173').replace(/\/$/, '');

export function isMailerConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

const transporter = isMailerConfigured()
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 465),
      secure: Number(SMTP_PORT ?? 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

// Código de 6 dígitos para restablecer la contraseña (se teclea en la misma
// página de "Olvidé mi contraseña", no es un enlace). Sin SMTP, igual que la
// verificación: se imprime en consola y viaja como devResetCode al cliente.
export async function sendPasswordResetEmail({ to, name, code }) {
  if (!transporter) {
    console.log(`[correo simulado] Código de recuperación para ${to}: ${code}`);
    return { sent: false };
  }

  await transporter.sendMail({
    from: MAIL_FROM ?? SMTP_USER,
    to,
    subject: 'Tu código para restablecer la contraseña — AUTOCELLS',
    text:
      `Hola ${name},\n\n` +
      `Tu código para restablecer la contraseña es: ${code}\n\n` +
      `Escríbelo en la página de recuperación. Vence en 30 minutos.\n` +
      `Si tú no pediste este código, ignora este correo: tu contraseña no cambia.`,
    html:
      `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">` +
      `<h2 style="color: #0e7490;">AUTOCELLS</h2>` +
      `<p>Hola <strong>${name}</strong>,</p>` +
      `<p>Tu código para restablecer la contraseña es:</p>` +
      `<p style="text-align: center; margin: 24px 0; font-size: 32px; font-weight: bold; ` +
      `letter-spacing: 8px; color: #0e7490;">${code}</p>` +
      `<p style="color: #58595b; font-size: 13px;">Escríbelo en la página de recuperación. ` +
      `Vence en 30 minutos. Si tú no pediste este código, ignora este correo: ` +
      `tu contraseña no cambia.</p>` +
      `</div>`,
  });
  return { sent: true };
}

export async function sendVerificationEmail({ to, name, verifyUrl }) {
  if (!transporter) {
    console.log(`[correo simulado] Verificación para ${to}: ${verifyUrl}`);
    return { sent: false };
  }

  await transporter.sendMail({
    from: MAIL_FROM ?? SMTP_USER,
    to,
    subject: 'Verifica tu correo — AUTOCELLS',
    text:
      `Hola ${name},\n\n` +
      `Gracias por crear tu cuenta en AUTOCELLS. Confirma tu correo entrando a:\n\n` +
      `${verifyUrl}\n\n` +
      `El enlace vence en 24 horas. Si tú no creaste esta cuenta, ignora este correo.`,
    html:
      `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">` +
      `<h2 style="color: #0e7490;">AUTOCELLS</h2>` +
      `<p>Hola <strong>${name}</strong>,</p>` +
      `<p>Gracias por crear tu cuenta. Confirma tu correo con el siguiente botón:</p>` +
      `<p style="text-align: center; margin: 24px 0;">` +
      `<a href="${verifyUrl}" style="background: #0e7490; color: #ffffff; padding: 12px 24px; ` +
      `border-radius: 12px; text-decoration: none; font-weight: bold;">Verificar mi correo</a></p>` +
      `<p style="color: #58595b; font-size: 13px;">El enlace vence en 24 horas. ` +
      `Si tú no creaste esta cuenta, ignora este correo.</p>` +
      `</div>`,
  });
  return { sent: true };
}
