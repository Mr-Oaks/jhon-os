// Planned integrations. The demo does not connect to any of them; each one
// gets a page that explains what it will do and what it needs to go live.

export type Integration = {
  slug: string;
  nombre: string;
  resumen: string;
  hoy: string;
  conectada: string[];
  requisitos: string[];
  tecnologia: string;
};

export const integrations: Integration[] = [
  {
    slug: "correo",
    nombre: "Envío de cotizaciones por correo",
    resumen: "La cotización aprobada sale como PDF adjunto desde el correo de la empresa.",
    hoy: "El agente arma la cotización y la muestra lista para descargar. No se envía ningún correo.",
    conectada: [
      "Apruebas la cotización en pantalla y eliges al destinatario.",
      "El correo sale desde la cuenta de la empresa, con el PDF adjunto y copia para ti.",
      "El envío queda registrado junto al cliente, con fecha y folio.",
    ],
    requisitos: ["Una cuenta de correo de la empresa", "Dominio verificado, si se usa un servicio de envío", "Lista de quién puede enviar cotizaciones"],
    tecnologia: "Gmail API o Resend",
  },
  {
    slug: "resumen-diario",
    nombre: "Resumen diario a las 9 am",
    resumen: "Cada mañana llega un correo con los pendientes del día.",
    hoy: "El resumen se genera cuando lo pides en el chat, con una bandeja y una agenda de ejemplo.",
    conectada: [
      "A las 9 am se revisan los correos del día anterior y la agenda de hoy.",
      "El correo incluye facturas vencidas, mantenimientos del día y artículos bajo mínimo.",
      "Cada persona recibe solo lo que le corresponde según su rol.",
    ],
    requisitos: ["Acceso de lectura al correo y al calendario", "Horario y destinatarios del resumen"],
    tecnologia: "Vercel Cron, Gmail API y Google Calendar API",
  },
  {
    slug: "calendario",
    nombre: "Calendario y agenda",
    resumen: "Juntas, visitas y mantenimientos programados, en un solo lugar.",
    hoy: "La agenda del demo es fija y de ejemplo.",
    conectada: [
      "El agente consulta las citas del día y de la semana.",
      "Los mantenimientos de póliza se agendan con la cuadrilla asignada.",
      "Propone horarios libres para una visita, y tú confirmas.",
    ],
    requisitos: ["Cuenta de Google Workspace o Microsoft 365", "Calendarios compartidos por cuadrilla"],
    tecnologia: "Google Calendar API",
  },
  {
    slug: "hojas",
    nombre: "Datos en Google Sheets",
    resumen: "Clientes, cobranza, catálogo y almacén leídos de las hojas que la empresa ya usa.",
    hoy: "Los datos del demo son ficticios y viven dentro del proyecto.",
    conectada: [
      "El agente lee las pestañas de clientes, proyectos, cobranza, catálogo, almacén y políticas.",
      "Un cambio en la hoja se refleja en la siguiente respuesta.",
      "Cada cotización generada se anota en su propia pestaña.",
    ],
    requisitos: ["Una hoja con las pestañas acordadas", "Compartirla con la cuenta de servicio del agente"],
    tecnologia: "Google Sheets API con cuenta de servicio",
  },
  {
    slug: "accesos",
    nombre: "Accesos y permisos por rol",
    resumen: "Cada persona entra con su cuenta y ve solo lo que le toca.",
    hoy: "El demo es abierto, con un código de acceso opcional y un límite de mensajes.",
    conectada: [
      "Inicio de sesión con el correo de la empresa.",
      "Dirección ve cobranza y márgenes. Los técnicos ven equipos, historial y manuales.",
      "Queda un registro de quién consultó y quién aprobó cada envío.",
    ],
    requisitos: ["Lista de usuarios y roles", "Definir qué datos ve cada rol"],
    tecnologia: "Firebase Authentication y reglas de seguridad de Firestore",
  },
  {
    slug: "whatsapp",
    nombre: "WhatsApp para técnicos en campo",
    resumen: "El técnico pregunta desde el sitio, sin abrir otra aplicación.",
    hoy: "El agente solo responde en esta página.",
    conectada: [
      "Consulta el historial del equipo antes de abrirlo.",
      "Busca códigos de error y pasos de diagnóstico en los manuales.",
      "Envía fotografías y lecturas para el reporte de servicio.",
    ],
    requisitos: ["Número de WhatsApp Business", "Cuenta de Meta Business verificada", "Manuales de los fabricantes en PDF"],
    tecnologia: "WhatsApp Business Cloud API",
  },
  {
    slug: "facturacion",
    nombre: "Facturación y ERP",
    resumen: "La cobranza y el inventario leídos del sistema donde se facturan.",
    hoy: "Las facturas y existencias del demo son de ejemplo.",
    conectada: [
      "Saldos y vencimientos al día, sin capturar dos veces.",
      "Recordatorios de pago redactados para que los apruebes.",
      "Existencias descontadas al cerrar cada orden de servicio.",
    ],
    requisitos: ["Saber qué sistema se usa hoy para facturar e inventariar", "Acceso de lectura o exportación programada"],
    tecnologia: "API o exportación del sistema contable",
  },
];

export function getIntegration(slug: string): Integration | undefined {
  return integrations.find((i) => i.slug === slug);
}
