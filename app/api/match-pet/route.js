import { after } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { dataService } from "@/lib/dataService";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuración de lotes y rate limiting
// 5 TPM → 1 solicitud cada 13s entre lotes
const BATCH_SIZE = 100;         // Mascotas por lote (1 solicitud = hasta 100 fotos)
const DELAY_BETWEEN_BATCHES = 13000; // ms entre cada lote (respeta 5 TPM)
const MATCH_THRESHOLD = 75;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function urlToGenerativePart(imageUrl) {
  if (imageUrl.startsWith("data:")) {
    const [meta, data] = imageUrl.split(",");
    const mimeType = meta.match(/data:(.*);base64/)[1];
    return { inlineData: { data, mimeType } };
  }
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  return { inlineData: { data: base64, mimeType } };
}

// Analiza un lote de mascotas en UNA SOLA solicitud a Gemini
async function analyzeBatch(model, spottedPart, batch, batchIndex) {
  // Cargar imágenes del lote, ignorar las que fallen
  const validPets = [];
  const petParts = [];

  for (const pet of batch) {
    try {
      const part = await urlToGenerativePart(pet.photo);
      petParts.push(part);
      validPets.push(pet);
    } catch (err) {
      console.warn(`[match-pet] No se pudo cargar imagen de "${pet.name}":`, err.message);
    }
  }

  if (validPets.length === 0) return [];

  // Describir cada mascota por su posición en el array de imágenes
  const petList = validPets
    .map((pet, i) => `  - Imagen ${i + 2}: id="${pet.id}", nombre="${pet.name}"`)
    .join("\n");

  const prompt = `Eres un sistema experto en identificación de mascotas.

La IMAGEN 1 es una foto de una mascota avistada en la calle.
Las siguientes ${validPets.length} imágenes son fotos de mascotas reportadas como extraviadas:
${petList}

Para CADA mascota de la lista, compara su imagen con la Imagen 1 y determina si podrían ser el mismo animal.
Evalúa: raza, color de pelaje, patrones/manchas, tamaño aproximado, forma de las orejas y rasgos faciales distintivos.

Sé estricto y conservador. Solo puntúa por encima de 75 si hay características físicas específicas y concretas que coincidan claramente entre las dos imágenes. No confundas por especie similar.

Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, con exactamente ${validPets.length} elementos:
[{"petId": "<id>", "score": <entero 0-100>, "reasoning": "<2 oraciones en español explicando por qué sí o no coinciden>"}]`;

  const result = await model.generateContent([prompt, spottedPart, ...petParts]);
  const text = result.response.text().trim();

  console.log(`[match-pet][lote ${batchIndex + 1}] Respuesta de Gemini:`, text.substring(0, 300) + "...");

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn(`[match-pet][lote ${batchIndex + 1}] No se pudo extraer JSON array`);
    return [];
  }

  const results = JSON.parse(jsonMatch[0]);

  // Cruzar resultados con la info de cada mascota
  return results
    .filter((r) => typeof r.score === "number" && r.score >= MATCH_THRESHOLD)
    .map((r) => {
      const pet = validPets.find((p) => p.id === r.petId);
      if (!pet) return null;
      return {
        petId: pet.id,
        petName: pet.name,
        ownerId: pet.userId,
        score: Math.min(100, Math.max(0, Math.round(r.score))),
        reasoning: r.reasoning,
      };
    })
    .filter(Boolean);
}

async function runGeminiMatching({ spottedData, lostPets, reporterId }) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const petsWithPhoto = lostPets.filter((p) => p.photo);

  // Dividir en lotes de BATCH_SIZE
  const batches = [];
  for (let i = 0; i < petsWithPhoto.length; i += BATCH_SIZE) {
    batches.push(petsWithPhoto.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `[match-pet][bg] ${petsWithPhoto.length} mascotas → ${batches.length} lote(s) de hasta ${BATCH_SIZE}`
  );

  const spottedPart = await urlToGenerativePart(spottedData.photo);
  const allMatches = [];

  for (let i = 0; i < batches.length; i++) {
    if (i > 0) {
      console.log(`[match-pet][bg] Esperando ${DELAY_BETWEEN_BATCHES / 1000}s entre lotes...`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }

    try {
      const batchMatches = await analyzeBatch(model, spottedPart, batches[i], i);
      allMatches.push(...batchMatches);
      console.log(`[match-pet][lote ${i + 1}] ${batchMatches.length} coincidencia(s) encontrada(s)`);
    } catch (err) {
      console.error(`[match-pet][lote ${i + 1}] Error:`, err.message);
    }
  }

  // Guardar coincidencias y notificar a dueños
  for (const match of allMatches) {
    await dataService.updateSpottedReportMatch(spottedData.id, {
      matchOwnerId: match.ownerId,
      matchPetName: match.petName,
      matchPetId: match.petId,
      score: match.score,
      reasoning: match.reasoning,
    });

    await dataService.saveNotification({
      ownerId: match.ownerId,
      ownerPetId: match.petId,
      reporterId,
      spottedId: spottedData.id,
      message: `🎯 ${match.score}% de coincidencia con ${match.petName}: ${match.reasoning}`,
    });

    console.log(`[match-pet][bg] ✅ Match notificado: ${match.petName} (${match.score}%)`);
  }

  await dataService.markSpottedReportAnalyzed(spottedData.id);
  console.log(
    `[match-pet][bg] ✔ Análisis completo. ${allMatches.length} coincidencia(s) en ${batches.length} lote(s).`
  );
}

export async function POST(request) {
  try {
    const { spottedData, lostPets, reporterId } = await request.json();

    if (!spottedData || !lostPets) {
      return Response.json({ error: "Datos incompletos" }, { status: 400 });
    }

    after(async () => {
      await runGeminiMatching({ spottedData, lostPets, reporterId });
    });

    return Response.json({ status: "analyzing", reportId: spottedData.id });
  } catch (error) {
    console.error("[match-pet] Error:", error);
    return Response.json({ error: "Error al iniciar el análisis." }, { status: 500 });
  }
}
