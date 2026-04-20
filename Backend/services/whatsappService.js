const axios = require("axios");
const { withRetry, log } = require("./utils");

/**
 * Send WhatsApp Message (Retry aware)
 */
async function sendWhatsAppMessage(recipientPhone, messageText, messageId) {
  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;
  try {
    await withRetry(() => 
      axios.post(url, {
        messaging_product: "whatsapp",
        to: recipientPhone,
        text: { body: messageText },
      }, {
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
      }), { maxRetries: 3, initialDelay: 1000 }
    );
    log("info", "whatsapp_sent", { recipientPhone, messageId });
  } catch (error) {
    log("error", "whatsapp_send_failed", { recipientPhone, error: error.message });
  }
}

module.exports = {
  sendWhatsAppMessage
};
