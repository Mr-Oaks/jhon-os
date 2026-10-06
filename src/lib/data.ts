// Fictional seed data. Every company, person, brand and amount here is invented.
// Dates are stored as day offsets from "today" so the demo never goes stale.

export type Client = {
  id: string;
  empresa: string;
  contacto: string;
  correo: string;
  telefono: string;
  estatus: "Póliza vigente" | "Activo" | "Prospecto";
  notas: string;
  claves: string[];
};
export type Project = {
  id: string;
  clienteId: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  equipos: string;
  memoriaTecnica: string;
};
export type Invoice = {
  factura: string;
  clienteId: string;
  monto: number;
  emision: string;
  vencimiento: string;
  estatus: "Pagada" | "Pendiente" | "Vencida";
};
export type Product = {
  sku: string;
  tipo: string;
  marca: string;
  modelo: string;
  capacidad: string;
  especificaciones: string;
  precio: number;
  claves: string[];
};
export type Service = {
  clave: string;
  descripcion: string;
  unidad: string;
  precio: number;
  claves: string[];
};
export type Stock = { sku: string; existencia: number; minimo: number; ubicacion: string };
export type Faq = { pregunta: string; respuesta: string; claves: string[] };
export type Mail = { de: string; asunto: string; resumen: string; accion: string };
export type Event = { hora: string; titulo: string; lugar: string };
export type Maintenance = { clienteId: string; fecha: string; alcance: string };

const DAY = 86_400_000;
const mxDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" });
/** ISO date (YYYY-MM-DD) in Mexico City time, `days` away from today. */
export function dayOffset(days: number): string {
  return mxDate.format(new Date(Date.now() + days * DAY));
}

export const clientes: Client[] = [
  {
    id: "C-001",
    empresa: "Hotel Marea Azul",
    contacto: "Laura Méndez, gerente de mantenimiento",
    correo: "laura.mendez@mareaazul.example",
    telefono: "55 0000 0101",
    estatus: "Póliza vigente",
    notas: "Prefiere visitas antes de las 8 am. El acceso es por el andén de servicio.",
    claves: ["marea azul", "marea"],
  },
  {
    id: "C-002",
    empresa: "Plaza Comercial Los Encinos",
    contacto: "Ing. Roberto Salas, administración",
    correo: "rsalas@losencinos.example",
    telefono: "55 0000 0202",
    estatus: "Activo",
    notas: "Las maniobras con grúa solo se autorizan en domingo.",
    claves: ["los encinos", "encinos", "plaza comercial"],
  },
  {
    id: "C-003",
    empresa: "Clínica Santa Elena",
    contacto: "Dra. Patricia Rojas, dirección médica",
    correo: "direccion@santaelena.example",
    telefono: "55 0000 0303",
    estatus: "Póliza vigente",
    notas: "Las áreas de quirófano usan filtración HEPA. Coordinar cada visita con enfermería.",
    claves: ["santa elena", "clinica santa", "clinica"],
  },
  {
    id: "C-004",
    empresa: "Corporativo Altavista",
    contacto: "Jorge Ibarra, compras",
    correo: "jibarra@altavista.example",
    telefono: "55 0000 0404",
    estatus: "Activo",
    notas: "Paga a 30 días. Pide orden de compra antes de cualquier trabajo.",
    claves: ["altavista", "corporativo"],
  },
  {
    id: "C-005",
    empresa: "Restaurante La Brasa",
    contacto: "Mariana Torres, propietaria",
    correo: "mariana@labrasa.example",
    telefono: "55 0000 0505",
    estatus: "Prospecto",
    notas: "Pidió cotización para climatizar la terraza. Aún sin levantamiento.",
    claves: ["la brasa", "brasa"],
  },
];

export const productos: Product[] = [
  {
    sku: "AER-MS12",
    tipo: "Minisplit inverter",
    marca: "Aeris",
    modelo: "Brisa 12",
    capacidad: "1 tonelada (12,000 BTU/h)",
    especificaciones: "SEER 18, refrigerante R-32, 220 V, frío y calor, garantía de 5 años en compresor",
    precio: 9800,
    claves: ["aer-ms12", "brisa 12", "minisplit de 1 tonelada", "minisplit 1 tonelada", "minisplit de 1 tr", "minisplit 1 tr", "minisplit de una tonelada", "minisplit de 12000", "minisplit de 12,000"],
  },
  {
    sku: "AER-MS24",
    tipo: "Minisplit inverter",
    marca: "Aeris",
    modelo: "Brisa 24",
    capacidad: "2 toneladas (24,000 BTU/h)",
    especificaciones: "SEER 17, refrigerante R-32, 220 V, frío y calor, garantía de 5 años en compresor",
    precio: 16900,
    claves: ["aer-ms24", "brisa 24", "minisplit de 2 tonelada", "minisplit 2 tonelada", "minisplit de 2 tr", "minisplit 2 tr", "minisplit de dos tonelada", "minisplit de 24000", "minisplit de 24,000"],
  },
  {
    sku: "NOR-PK05",
    tipo: "Equipo paquete",
    marca: "Nordika",
    modelo: "Rooftop 60",
    capacidad: "5 toneladas (60,000 BTU/h)",
    especificaciones: "SEER 14, refrigerante R-410A, 220 V trifásico, descarga horizontal o vertical, peso de 210 kg",
    precio: 68500,
    claves: ["nor-pk05", "rooftop 60", "paquete de 5 tonelada", "paquete 5 tonelada", "paquete de 5 tr", "paquete 5 tr", "paquete de cinco tonelada"],
  },
  {
    sku: "NOR-PK10",
    tipo: "Equipo paquete",
    marca: "Nordika",
    modelo: "Rooftop 120",
    capacidad: "10 toneladas (120,000 BTU/h)",
    especificaciones: "EER 11.2, refrigerante R-410A, 220 V trifásico, dos circuitos, peso de 430 kg",
    precio: 124000,
    claves: ["nor-pk10", "rooftop 120", "paquete de 10 tonelada", "paquete 10 tonelada", "paquete de 10 tr", "paquete 10 tr", "paquete de diez tonelada"],
  },
  {
    sku: "TER-FC03",
    tipo: "Fan and coil",
    marca: "Termia",
    modelo: "Ducto 36",
    capacidad: "3 toneladas (36,000 BTU/h)",
    especificaciones: "Para ducto, motor de 3 velocidades, 220 V, compatible con agua helada",
    precio: 21400,
    claves: ["ter-fc03", "ducto 36", "fan and coil", "fan & coil", "fan coil", "fancoil"],
  },
  {
    sku: "TER-CAL80",
    tipo: "Calefactor a gas",
    marca: "Termia",
    modelo: "Hogar 80",
    capacidad: "80,000 BTU/h",
    especificaciones: "Eficiencia AFUE de 80%, gas natural o LP, encendido electrónico, para ducto",
    precio: 18700,
    claves: ["ter-cal80", "hogar 80", "calefactor"],
  },
  {
    sku: "REF-CAP45",
    tipo: "Refacción",
    marca: "Genérica",
    modelo: "Capacitor dual 45+5 µF",
    capacidad: "440 V",
    especificaciones: "Capacitor de marcha para compresor y motor de ventilador",
    precio: 380,
    claves: ["ref-cap45", "capacitor"],
  },
  {
    sku: "REF-FIL20",
    tipo: "Refacción",
    marca: "Genérica",
    modelo: "Filtro plisado MERV 8",
    capacidad: "20 x 20 x 2 in",
    especificaciones: "Filtro desechable para manejadoras y equipos paquete",
    precio: 145,
    claves: ["ref-fil20", "filtro"],
  },
];

export const servicios: Service[] = [
  { clave: "SRV-INST-MS", descripcion: "Instalación de minisplit, hasta 4 m de tubería", unidad: "equipo", precio: 2800, claves: ["srv-inst-ms", "instalacion de minisplit"] },
  { clave: "SRV-INST-PK", descripcion: "Instalación de equipo paquete, con maniobra", unidad: "equipo", precio: 14500, claves: ["srv-inst-pk", "instalacion de paquete", "instalacion de equipo paquete"] },
  { clave: "SRV-MP", descripcion: "Mantenimiento preventivo", unidad: "equipo", precio: 950, claves: ["srv-mp", "mantenimiento preventivo"] },
  { clave: "SRV-MC-HR", descripcion: "Mano de obra correctiva", unidad: "hora", precio: 520, claves: ["srv-mc-hr", "mano de obra", "hora de mano"] },
  { clave: "SRV-DIAG", descripcion: "Visita de diagnóstico", unidad: "visita", precio: 750, claves: ["srv-diag", "diagnostico"] },
];

export const almacen: Stock[] = [
  { sku: "AER-MS12", existencia: 14, minimo: 6, ubicacion: "Rack A1" },
  { sku: "AER-MS24", existencia: 5, minimo: 4, ubicacion: "Rack A2" },
  { sku: "NOR-PK05", existencia: 0, minimo: 1, ubicacion: "Patio" },
  { sku: "NOR-PK10", existencia: 1, minimo: 1, ubicacion: "Patio" },
  { sku: "TER-FC03", existencia: 3, minimo: 2, ubicacion: "Rack B1" },
  { sku: "TER-CAL80", existencia: 2, minimo: 2, ubicacion: "Rack B2" },
  { sku: "REF-CAP45", existencia: 3, minimo: 10, ubicacion: "Gaveta 4" },
  { sku: "REF-FIL20", existencia: 48, minimo: 24, ubicacion: "Estante C" },
];

export const faq: Faq[] = [
  { pregunta: "¿Qué garantía damos en instalaciones?", respuesta: "Un año en mano de obra de instalación. La garantía del equipo es la del fabricante y la tramitamos nosotros.", claves: ["garantia"] },
  { pregunta: "¿Cuál es el horario de servicio?", respuesta: "Lunes a viernes de 8:00 a 18:00 y sábados de 8:00 a 14:00. Los clientes con póliza tienen guardia las 24 horas.", claves: ["horario", "guardia", "emergencia", "urgencia"] },
  { pregunta: "¿Cuáles son las condiciones de pago?", respuesta: "50% de anticipo y 50% contra entrega. Los clientes con póliza pagan a 30 días con orden de compra.", claves: ["anticipo", "condiciones de pago", "forma de pago", "credito"] },
  { pregunta: "¿Qué incluye el mantenimiento preventivo?", respuesta: "Limpieza de serpentines y filtros, revisión de presiones y amperajes, apriete de conexiones eléctricas, limpieza de drenajes y reporte con fotografías.", claves: ["que incluye", "incluye el mantenimiento"] },
  { pregunta: "¿En qué zona damos servicio?", respuesta: "Ciudad de México y área metropolitana. Fuera de esa zona se cotizan viáticos.", claves: ["zona", "cobertura", "viatico"] },
  { pregunta: "¿Cómo se levanta un reporte de servicio?", respuesta: "El técnico captura equipo, falla, lecturas y fotografías antes de salir del sitio, y el cliente firma de conformidad.", claves: ["reporte de servicio", "levantar un reporte", "levanta un reporte"] },
];

export const bandeja: Mail[] = [
  { de: "Laura Méndez (Hotel Marea Azul)", asunto: "Goteo en el equipo del piso 3", resumen: "La habitación 304 reporta goteo en la unidad interior desde ayer.", accion: "Agendar visita de diagnóstico hoy" },
  { de: "Jorge Ibarra (Corporativo Altavista)", asunto: "Orden de compra de la ampliación", resumen: "Envía la orden de compra y pide fecha de arranque.", accion: "Confirmar fecha de inicio" },
  { de: "Mariana Torres (Restaurante La Brasa)", asunto: "¿Ya tienen la cotización?", resumen: "Pregunta por la cotización de la terraza.", accion: "Programar levantamiento y cotizar" },
  { de: "Distribuidora Nordika", asunto: "Entrega del Rooftop 60", resumen: "El equipo paquete de 5 toneladas llega en tres días hábiles.", accion: "Avisar a Plaza Los Encinos" },
];

export const agenda: Event[] = [
  { hora: "8:00", titulo: "Mantenimiento preventivo, torre A", lugar: "Hotel Marea Azul" },
  { hora: "11:30", titulo: "Revisión de avance con el Ing. Salas", lugar: "Plaza Comercial Los Encinos" },
  { hora: "16:00", titulo: "Llamada de seguimiento de cobranza", lugar: "Corporativo Altavista" },
];

export function proyectos(): Project[] {
  return [
    { id: "P-1042", clienteId: "C-001", fecha: dayOffset(-21), tipo: "Mantenimiento", descripcion: "Mantenimiento preventivo trimestral de 42 minisplits en habitaciones.", equipos: "42 × Aeris Brisa 12", memoriaTecnica: "Se cambiaron 3 capacitores y se corrigió el drenaje en las habitaciones 210 y 304." },
    { id: "P-0987", clienteId: "C-001", fecha: dayOffset(-190), tipo: "Instalación", descripcion: "Sustitución del equipo paquete del lobby.", equipos: "1 × Nordika Rooftop 120", memoriaTecnica: "Carga térmica de 9.4 TR. Se reutilizó la ductería y se rebalanceó a 4,000 CFM." },
    { id: "P-1050", clienteId: "C-002", fecha: dayOffset(-9), tipo: "Instalación", descripcion: "Climatización de 4 locales nuevos en planta alta. En proceso.", equipos: "4 × Aeris Brisa 24, 1 × Nordika Rooftop 60 pendiente de entrega", memoriaTecnica: "Avance del 60%. Falta izar el equipo paquete, programado para el domingo." },
    { id: "P-1031", clienteId: "C-003", fecha: dayOffset(-45), tipo: "Mantenimiento", descripcion: "Cambio de filtros HEPA y prefiltros en quirófanos 1 y 2.", equipos: "2 manejadoras con Termia Ducto 36", memoriaTecnica: "Presión diferencial final de 0.9 inH2O. Próximo cambio en 6 meses." },
    { id: "P-1012", clienteId: "C-004", fecha: dayOffset(-70), tipo: "Instalación", descripcion: "Climatización de la sala de juntas y del site de cómputo.", equipos: "2 × Aeris Brisa 24, 1 × Aeris Brisa 12", memoriaTecnica: "El site quedó con equipo redundante y alarma de temperatura a 27 °C." },
  ];
}

export function cobranza(): Invoice[] {
  const rows: Array<[string, string, number, number, number, boolean]> = [
    ["F-2291", "C-001", 39900, -20, 10, false],
    ["F-2260", "C-001", 143840, -185, -155, true],
    ["F-2302", "C-002", 86400, -8, 22, false],
    ["F-2274", "C-003", 27840, -44, -14, false],
    ["F-2251", "C-004", 58580, -68, -38, false],
    ["F-2288", "C-004", 12180, -25, 5, false],
  ];
  const today = dayOffset(0);
  return rows.map(([factura, clienteId, monto, em, ven, pagada]) => {
    const vencimiento = dayOffset(ven);
    return {
      factura,
      clienteId,
      monto,
      emision: dayOffset(em),
      vencimiento,
      estatus: pagada ? "Pagada" : vencimiento < today ? "Vencida" : "Pendiente",
    };
  });
}

export function mantenimientos(): Maintenance[] {
  return [
    { clienteId: "C-001", fecha: dayOffset(0), alcance: "Preventivo de la torre A, 21 minisplits" },
    { clienteId: "C-003", fecha: dayOffset(4), alcance: "Revisión mensual de manejadoras de quirófano" },
    { clienteId: "C-004", fecha: dayOffset(12), alcance: "Preventivo semestral del site de cómputo" },
    { clienteId: "C-001", fecha: dayOffset(70), alcance: "Preventivo trimestral de habitaciones" },
  ];
}
