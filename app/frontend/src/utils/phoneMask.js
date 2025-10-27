// Formato: (12) 34567-8910 — somente dígitos aceitos, tamanho fixo 11
export function formatPhoneBR(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11);
  const d = digits.padEnd(11, "_").split("");
  const hasArea = digits.length >= 2;
  const hasMid = digits.length >= 7;
  const hasEnd = digits.length >= 11;

  let out = "";
  if (digits.length === 0) return "";

  out += "(" + d[0] + d[1] + ")";
  out += " " + d[2] + d[3] + d[4] + d[5] + d[6];
  out += "-" + d[7] + d[8] + d[9] + d[10];

  // remove placeholders visuais
  out = out.replaceAll("_", "");
  // impede sufixos fora do padrão até completar 11 dígitos
  if (!hasEnd) {
    // corta após o último dígito inserido
    const map = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // posições lógicas
  }
  return out.trim();
}

export function handleMaskedInput(e, setter) {
  const raw = e.target.value || "";
  const digits = raw.replace(/\D/g, "");
  const limited = digits.slice(0, 11);
  setter(formatPhoneBR(limited));
}

export function getPhoneDigits(masked) {
  return (masked || "").replace(/\D/g, "");
}
