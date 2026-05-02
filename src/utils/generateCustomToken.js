// src/utils/generateCustomToken.js
import { SignJWT, importPKCS8, decodeJwt } from "jose";

const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD3HKyTi2crVsNb
MNtiWdwTrSezZyIDUWgIzAqgEQB/0NrDiz7p4riYz0finsD4K3i+Vw9ysageAdg5
ojt5SJeBVLaEGkrXciICkMb2cedOhx4G/akKpdVgHaVgtHkFnv8ze51SIQ+RGU1f
uOHrIubkL+lJ/v9JeFPfrVO0m6EKh/yfIsYLr9p4PbmUBtgxzFQ0X+EAx02iFAUP
KpuKGbXWs9S1Pyfj2rt64mcE1TXJ9jz72npzbdQ8OAjU6P/otOtuMDMP9ZheH88M
jlYVzM+2tSOfEoELW+FgNzTVvTOgfND5cab5JavFgDRGDEyzf0k9t4RyuD2dqRc3
rx8uvze9AgMBAAECggEAJbbWXvFidlKYX7lR7k2FIWqmucKGhiedP2R2xa26nAdR
8BC3MiaEYmwWTk/I50dpNvGeHbTgEe5ZpBguyAiseNRnQ7uoiv+0EZyrhQ7mzM0h
59K8gy/CpFf59susgc9dpyuZW+DIWa6ZKMAUmNi7kP1/9ydoKnwnHub69MBg4HSK
cdCW/Tws79UBAjyibMQ0XYXjhV4ndccFxqEG4Na4S2Jl35NvK7f8OVclakYEwGJT
FZR/rx1qYrau3q0r82x1OiMK3gQ4JanKmik5ZcJmWfph3XS42unx+Z/r17tSSBYX
kshKrktfYmCJ+vpW2emkuZet7R7Azj5ypIvPDsqbQQKBgQD+n0kY1eagmfHUOZWP
7glm3dRbIJ1ZlZkpOXYX5X7xhqMM0pkSt1dGhGS2u/50Nlmc/ix84ldv6TFKtOy+
WyFkrOa6xfyAFXx1kkw7Tym2xAr6b6oxUOYve0oWvmqWZ8VEsuSnIWvwhgqdRxUt
+uPj372BiDpgHWIJ3NluU4F+wQKBgQD4cvwwZdqtSrIssOpWwo1PaMzMyMkTvhkW
XWx0FcrmWbWr57VjXeTC4fEutzqCUqu+3c5pYSwo52uEktAYqe49xurPOYUmFQDW
p2EAcj7KcNGx+KphpA6d73K4ZrmCUWZDUOaUhhkDpCYnxPRFR18wOjeuI+N4SepQ
eC+oiSSz/QKBgBiM5TBm13Dexwlub/RLwE5RzzrmHyXXHchyyOcu8pl5INmIqMe8
M8cR1uAjqjosT2GqxEFaVZHtyxnn7ffAs6yQW0Lg+iKjb7eqXn1Nebksl95jy+Yr
ZbZoTdF5lK9h3Axur0tKFq0/T2CwzOL9EOIU3aHSr8Y6rwxCZhiUJqVBAoGBAKeT
hx5t1O2FsGAMhEM4vm+NVHXcCCRU2D8JjJlQCacNY0gr5WC8eAwqsa68z64PbOA0
Y4EYldyRGyg0jj/UfmkUvlQ/i9t/1yzxgK/4XvnU1tufyexJ58IHO+28++s2VC+b
ZatQN5cJJOM2KTyBQ2cYHW5LrqX31R+psRuQRT1RAoGAGlo8EfCi9SNQqmjgVvvb
VgORZfjVH7u18+ruo+YMTELE+5atoqrNSlftB8rs5Pu1HusBY2W5nql25NmJ9+eZ
VM0bkf6008LnLIYbt08oMX1yDQQ1wXtbHW27w3FDFhWktCPl7I3Hz9QSg89hIAql
vBkGYsKKOJpq4euRL/COv7s=
-----END PRIVATE KEY-----`;

const SERVICE_ACCOUNT_EMAIL =
  "firebase-adminsdk-fbsvc@sizaenew.iam.gserviceaccount.com";

export const generateCustomToken = async (uid) => {
  try {
    console.log("🚀 Iniciando generación de Custom Token");
    console.log("📌 UID recibido:", uid);
    console.log("📌 Tipo UID:", typeof uid);

    // =========================
    // VALIDAR UID
    // =========================
    if (!uid) {
      console.error("❌ UID vacío");
      return null;
    }

    const finalUid = String(uid);

    console.log("✅ UID convertido:", finalUid);

    // =========================
    // IMPORTAR PRIVATE KEY
    // =========================
    console.log("🔑 Importando Private Key...");

    const privateKey = await importPKCS8(
      PRIVATE_KEY_PEM,
      "RS256"
    );

    console.log("✅ Private Key importada correctamente");

    // =========================
    // TIMESTAMPS
    // =========================
    const now = Math.floor(Date.now() / 1000);

    console.log("🕒 Timestamp actual:", now);
    console.log("🕒 Expiración:", now + 3600);

    // =========================
    // PAYLOAD
    // =========================
    const payload = {
      iss: SERVICE_ACCOUNT_EMAIL,
      sub: SERVICE_ACCOUNT_EMAIL,
      aud:
        "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
      iat: now,
      exp: now + 3600,
      uid: finalUid,
    };

    console.log("📦 Payload generado:");
    console.log(JSON.stringify(payload, null, 2));

    // =========================
    // GENERAR TOKEN
    // =========================
    console.log("✍️ Firmando JWT...");

    const token = await new SignJWT(payload)
      .setProtectedHeader({
        alg: "RS256",
        typ: "JWT",
      })
      .sign(privateKey);

    console.log("✅ Token firmado correctamente");

    // =========================
    // MOSTRAR TOKEN
    // =========================
    console.log("🎟️ TOKEN:");
    console.log(token);

    // =========================
    // DECODIFICAR TOKEN
    // =========================
    console.log("🔍 Decodificando JWT...");

    const decoded = decodeJwt(token);

    console.log("✅ JWT decodificado:");
    console.log(JSON.stringify(decoded, null, 2));

    // =========================
    // VALIDAR CAMPOS
    // =========================
    console.log("🧪 Validando claims...");

    console.log("ISS:", decoded.iss);
    console.log("SUB:", decoded.sub);
    console.log("AUD:", decoded.aud);
    console.log("UID:", decoded.uid);
    console.log("IAT:", decoded.iat);
    console.log("EXP:", decoded.exp);

    console.log("🎉 Custom Token generado correctamente");

    return token;
  } catch (error) {
    console.error("❌ ERROR GENERANDO TOKEN");
    console.error(error);

    if (error?.message) {
      console.error("📌 Mensaje:", error.message);
    }

    if (error?.stack) {
      console.error("📌 Stack:", error.stack);
    }

    return null;
  }
};