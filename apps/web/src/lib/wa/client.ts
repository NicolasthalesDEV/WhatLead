export async function sendWhatsText(to: string, body: string) {
  // Stub: em produção, chame WhatsApp Cloud API
  console.log(`(stub) Enviar Whats para ${to}: ${body}`);
  return { id: `msg_${Date.now()}` };
}
