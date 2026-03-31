/**
 * /api/whatsapp/webhook
 *
 * Alias for /api/webhooks/whatsapp — registered with Meta as the webhook URL.
 * GET  → webhook verification (hub.mode, hub.verify_token, hub.challenge)
 * POST → incoming messages and status updates
 */
export { GET, POST } from '../../webhooks/whatsapp/route';
