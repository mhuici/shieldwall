import type { MetadatosEXIF } from "@/lib/types";

/**
 * Extrae metadatos EXIF de una imagen
 * Funciona en el cliente (browser) usando la API de ArrayBuffer
 */
export async function extractEXIF(file: File): Promise<MetadatosEXIF> {
  // Solo procesar imágenes JPEG (tienen EXIF)
  if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
    return {};
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // Verificar que es JPEG (empieza con 0xFFD8)
    if (dataView.getUint16(0) !== 0xffd8) {
      return {};
    }

    const exif = parseEXIF(dataView);
    return exif;
  } catch (error) {
    console.error("Error extrayendo EXIF:", error);
    return {};
  }
}

/**
 * Parser de EXIF básico
 * Extrae: fecha, GPS, dispositivo
 */
function parseEXIF(dataView: DataView): MetadatosEXIF {
  const result: MetadatosEXIF = {};
  const raw: Record<string, unknown> = {};

  let offset = 2;
  const length = dataView.byteLength;

  while (offset < length) {
    // Buscar marcador APP1 (0xFFE1) que contiene EXIF
    if (dataView.getUint8(offset) === 0xff) {
      const marker = dataView.getUint8(offset + 1);

      if (marker === 0xe1) {
        // APP1 - EXIF
        const exifLength = dataView.getUint16(offset + 2);
        const exifStart = offset + 4;

        // Verificar "Exif\0\0"
        const exifHeader = String.fromCharCode(
          dataView.getUint8(exifStart),
          dataView.getUint8(exifStart + 1),
          dataView.getUint8(exifStart + 2),
          dataView.getUint8(exifStart + 3)
        );

        if (exifHeader === "Exif") {
          const tiffStart = exifStart + 6;
          const littleEndian = dataView.getUint16(tiffStart) === 0x4949;

          // Leer IFD0
          const ifd0Offset =
            tiffStart + dataView.getUint32(tiffStart + 4, littleEndian);
          const tags = readIFD(dataView, ifd0Offset, tiffStart, littleEndian);

          // Extraer datos relevantes
          if (tags[0x010f]) {
            result.dispositivo = tags[0x010f] as string;
            raw["Make"] = tags[0x010f];
          }
          if (tags[0x0110]) {
            result.dispositivo = `${result.dispositivo || ""} ${tags[0x0110]}`.trim();
            raw["Model"] = tags[0x0110];
          }
          if (tags[0x0131]) {
            result.software = tags[0x0131] as string;
            raw["Software"] = tags[0x0131];
          }
          if (tags[0x0112]) {
            result.orientacion = tags[0x0112] as number;
            raw["Orientation"] = tags[0x0112];
          }

          // Buscar SubIFD (EXIF IFD) para fecha
          if (tags[0x8769]) {
            const exifIFDOffset = tiffStart + (tags[0x8769] as number);
            const exifTags = readIFD(
              dataView,
              exifIFDOffset,
              tiffStart,
              littleEndian
            );

            // DateTimeOriginal (0x9003)
            if (exifTags[0x9003]) {
              const dateStr = exifTags[0x9003] as string;
              result.fechaCaptura = parseExifDate(dateStr);
              raw["DateTimeOriginal"] = dateStr;
            }
            // DateTimeDigitized (0x9004)
            if (!result.fechaCaptura && exifTags[0x9004]) {
              const dateStr = exifTags[0x9004] as string;
              result.fechaCaptura = parseExifDate(dateStr);
              raw["DateTimeDigitized"] = dateStr;
            }
          }

          // Buscar GPS IFD
          if (tags[0x8825]) {
            const gpsIFDOffset = tiffStart + (tags[0x8825] as number);
            const gpsTags = readIFD(
              dataView,
              gpsIFDOffset,
              tiffStart,
              littleEndian
            );

            // GPS Latitude (0x0002) + Ref (0x0001)
            if (gpsTags[0x0002] && gpsTags[0x0001]) {
              const lat = gpsTags[0x0002] as number[];
              const latRef = gpsTags[0x0001] as string;
              result.latitud = convertDMSToDD(lat, latRef);
              raw["GPSLatitude"] = lat;
              raw["GPSLatitudeRef"] = latRef;
            }

            // GPS Longitude (0x0004) + Ref (0x0003)
            if (gpsTags[0x0004] && gpsTags[0x0003]) {
              const lon = gpsTags[0x0004] as number[];
              const lonRef = gpsTags[0x0003] as string;
              result.longitud = convertDMSToDD(lon, lonRef);
              raw["GPSLongitude"] = lon;
              raw["GPSLongitudeRef"] = lonRef;
            }

            // GPS Altitude (0x0006)
            if (gpsTags[0x0006]) {
              result.altitud = gpsTags[0x0006] as number;
              raw["GPSAltitude"] = gpsTags[0x0006];
            }
          }
        }

        break;
      }

      // Saltar al siguiente marcador
      const segmentLength = dataView.getUint16(offset + 2);
      offset += 2 + segmentLength;
    } else {
      offset++;
    }
  }

  if (Object.keys(raw).length > 0) {
    result.raw = raw;
  }

  return result;
}

/**
 * Lee un IFD (Image File Directory) y retorna los tags
 */
function readIFD(
  dataView: DataView,
  ifdOffset: number,
  tiffStart: number,
  littleEndian: boolean
): Record<number, unknown> {
  const tags: Record<number, unknown> = {};

  try {
    const entries = dataView.getUint16(ifdOffset, littleEndian);

    for (let i = 0; i < entries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12;
      const tag = dataView.getUint16(entryOffset, littleEndian);
      const type = dataView.getUint16(entryOffset + 2, littleEndian);
      const count = dataView.getUint32(entryOffset + 4, littleEndian);
      const valueOffset = entryOffset + 8;

      const value = readTagValue(
        dataView,
        type,
        count,
        valueOffset,
        tiffStart,
        littleEndian
      );
      if (value !== undefined) {
        tags[tag] = value;
      }
    }
  } catch {
    // Error leyendo IFD, retornar lo que tengamos
  }

  return tags;
}

/**
 * Lee el valor de un tag EXIF
 */
function readTagValue(
  dataView: DataView,
  type: number,
  count: number,
  valueOffset: number,
  tiffStart: number,
  littleEndian: boolean
): unknown {
  // Tipos EXIF:
  // 1 = BYTE, 2 = ASCII, 3 = SHORT, 4 = LONG, 5 = RATIONAL
  // 7 = UNDEFINED, 9 = SLONG, 10 = SRATIONAL

  try {
    switch (type) {
      case 1: // BYTE
        return dataView.getUint8(valueOffset);

      case 2: // ASCII
        {
          const offset =
            count > 4
              ? tiffStart + dataView.getUint32(valueOffset, littleEndian)
              : valueOffset;
          let str = "";
          for (let i = 0; i < count - 1; i++) {
            str += String.fromCharCode(dataView.getUint8(offset + i));
          }
          return str;
        }

      case 3: // SHORT
        return dataView.getUint16(valueOffset, littleEndian);

      case 4: // LONG
        return dataView.getUint32(valueOffset, littleEndian);

      case 5: // RATIONAL (2 LONGs)
        {
          const offset =
            tiffStart + dataView.getUint32(valueOffset, littleEndian);
          if (count === 1) {
            const num = dataView.getUint32(offset, littleEndian);
            const den = dataView.getUint32(offset + 4, littleEndian);
            return den !== 0 ? num / den : 0;
          } else {
            // Array de rationals (ej: GPS coordinates)
            const rationals: number[] = [];
            for (let i = 0; i < count; i++) {
              const num = dataView.getUint32(offset + i * 8, littleEndian);
              const den = dataView.getUint32(offset + i * 8 + 4, littleEndian);
              rationals.push(den !== 0 ? num / den : 0);
            }
            return rationals;
          }
        }

      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

/**
 * Convierte coordenadas DMS (grados, minutos, segundos) a decimal
 */
function convertDMSToDD(
  dms: number[],
  ref: string
): number {
  if (dms.length < 3) return 0;

  const degrees = dms[0];
  const minutes = dms[1];
  const seconds = dms[2];

  let dd = degrees + minutes / 60 + seconds / 3600;

  if (ref === "S" || ref === "W") {
    dd = -dd;
  }

  return Math.round(dd * 1000000) / 1000000; // 6 decimales
}

/**
 * Parsea fecha EXIF (formato "YYYY:MM:DD HH:MM:SS") a ISO string
 */
function parseExifDate(dateStr: string): string | undefined {
  // Formato EXIF: "2024:01:15 14:30:00"
  const match = dateStr.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }
  return undefined;
}

/**
 * Calcula hash SHA-256 de un archivo
 */
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Formatea tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Detecta tipo de evidencia basado en MIME type
 */
export function detectTipoEvidencia(
  mimeType: string
): "foto" | "video" | "audio" | "documento" | "screenshot" {
  if (mimeType.startsWith("image/")) return "foto";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "documento";
}
