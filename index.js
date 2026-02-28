const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");

const app = express();
app.use(express.json());

let latestQR = null;
let isReady = false;

const FORWARD_URL = process.env.FORWARD_URL || "http://localhost:4000/webhook";

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
  // Ignorar mensajes de grupos y de estado
  if (message.from === "status@broadcast") return;
  if (message.fromMe) return;

  const payload = {
    from: message.from,
    body: message.body,
    timestamp: message.timestamp,
    type: message.type,
  };

  console.log(`Mensaje recibido de ${message.from}: ${message.body}`);

  try {
    const response = await fetch(FORWARD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log(`Respuesta del endpoint:`, data);

    // Reaccionar al mensaje con check verde si el webhook respondio ok
    await message.react("\u2705");

    // Si el endpoint devuelve un reply, responder al remitente
    if (data.reply) {
      await client.sendMessage(message.from, data.reply);
      console.log(`Respuesta enviada a ${message.from}: ${data.reply}`);
    }
  } catch (error) {
    console.error(`Error al enviar al endpoint: ${error.message}`);
    await message.react("\u274c");
  }
});

client.initialize();

// Endpoint para ver el QR en el navegador
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

// Endpoint de health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", whatsapp: isReady ? "connected" : "disconnected" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
