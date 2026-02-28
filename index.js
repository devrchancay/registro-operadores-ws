require("dotenv").config();

const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");
const db = require("./models");

const app = express();
app.use(express.json());

let latestQR = null;
let isReady = false;

const ACCIONES = {
  "marcar entrada": "entrada",
  "marcar salida": "salida",
  "inicio almuerzo": "inicio_almuerzo",
  "fin almuerzo": "fin_almuerzo",
};

function parseMessage(body) {
  const decoded = Buffer.from(body, "base64").toString("utf-8");
  const data = JSON.parse(decoded);

  const tipo = ACCIONES[data.accion.toLowerCase()];
  if (!tipo) return null;

  const [dia, mes, anio] = data.fecha.split("/");
  const hora = new Date(`${anio}-${mes}-${dia}T${data.hora}`);

  return { tipo, hora, lat: data.lat, lng: data.lng };
}

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "/data/ws",
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  },
});

client.on("qr", (qr) => {
  qrcodeTerminal.generate(qr, { small: true });
  latestQR = qr;
  console.log("Escanea el QR en http://localhost:3000/qr");
});

client.on("ready", () => {
  isReady = true;
  console.log("Cliente de WhatsApp listo!");
});

client.on("message", async (message) => {
  if (message.from === "status@broadcast") return;
  if (message.fromMe) return;

  console.log(`Mensaje recibido de ${message.from}: ${message.body}`);

  let data;
  try {
    data = parseMessage(message.body);
  } catch {
    return;
  }

  if (!data) return;

  const number = message.from.replace("@c.us", "");

  try {
    await db.Registro.create({
      number,
      tipo_registro: data.tipo,
      hora: data.hora,
      ubicacion: { type: "Point", coordinates: [data.lng, data.lat] },
    });

    await message.react("\u2705");
    console.log(`Registro guardado: ${number} - ${data.tipo}`);
  } catch (error) {
    console.error(`Error guardando registro: ${error.message}`);
    await message.react("\u274c");
  }
});

client.initialize();

app.get("/qr", async (req, res) => {
  if (!latestQR) {
    return res.send("No hay un QR disponible. Espera que el cliente lo genere.");
  }
  try {
    const qrImage = await qrcode.toDataURL(latestQR);
    const html = `
      <html>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;">
          <h2>Escanea este QR con WhatsApp</h2>
          <img src="${qrImage}" />
        </body>
      </html>`;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generando el QR");
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", whatsapp: isReady ? "connected" : "disconnected" });
});

const PORT = process.env.PORT || 3000;

db.sequelize
  .authenticate()
  .then(() => {
    console.log("Conexion a MySQL establecida");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error conectando a MySQL:", err.message);
    process.exit(1);
  });
