/**
 * Serviço responsável por envio de e-mails transacionais.
 * Implementação genérica — substituir por integração real (ex: SendGrid, SES, Resend, etc.)
 */

/**
 * Envia um e-mail simples.
 * @param {object} params
 * @param {string} params.to - destinatário
 * @param {string} params.subject - assunto
 * @param {string} params.html - corpo HTML
 * @returns {Promise<object>} resultado
 */
export async function sendEmail({ to, subject, html }) {
  try {
    // ponto de integração com o provedor
    console.log("Simulação de envio de e-mail:", { to, subject });
    // retorno simulado
    return { ok: true, to, subject };
  } catch (e) {
    console.error("Erro ao enviar e-mail:", e);
    return { ok: false, error: String(e) };
  }
}