const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const supabase = require("../services/supabaseClient");
const { log } = require("../services/utils");
const { getProfileId, getOrCreateCustomer } = require("../services/profileService");
const { fetchRelevantProducts, detectOrderIntent } = require("../services/orderService");
const { generateAIResponse } = require("../services/aiService");
const { sendWhatsAppMessage } = require("../services/whatsappService");

const worker = new Worker("messages", async (job) => {
  const { messageId, phone, text, phoneNumberId, customerName } = job.data;
  
  log("info", "job_started", { messageId, jobId: job.id });
  
  let profileId, customerId, convoId;
  
  try {
    // 1. Profile & Customer
    profileId = await getProfileId(phoneNumberId);
    if (!profileId) throw new Error("Profile not found");

    customerId = await getOrCreateCustomer(phone, profileId, customerName);
    
    // 2. Save User Message
    const { data: convo, error: convoError } = await supabase
      .from("conversations")
      .insert([{
        profile_id: profileId,
        customer_id: customerId,
        message: text,
        role: "user",
        whatsapp_message_id: messageId
      }])
      .select("id")
      .single();

    if (convoError) throw convoError;
    convoId = convo.id;

    // 3. Greeting Guard (English Only)
    const isGreeting = /^(hi|hello|hey)\b/i.test(text.trim());
    if (isGreeting) {
      const greetingMsg = "Hi! 👋 Welcome to our store. We have sneakers, hoodies, and more! What can I show you?";
      await sendWhatsAppMessage(phone, greetingMsg, messageId);
      
      // Save assistant greeting
      await supabase.from("conversations").insert([{
        profile_id: profileId, customer_id: customerId, message: greetingMsg, role: "assistant"
      }]);
      
      return log("info", "job_completed_greeting", { messageId });
    }

    // 4. Intent Detection
    await detectOrderIntent(text, profileId, customerId, convoId, messageId);

    // 5. Generate Response
    const products = await fetchRelevantProducts(profileId, text);
    const productContext = products.map(p => 
      `${p.name}: ${p.price} GHS (${p.stock_quantity > 0 ? "IN STOCK" : "OUT OF STOCK"})`
    ).join("\n");

    const aiReply = await generateAIResponse(text, profileId, customerId, messageId, productContext);
    
    // Simulating typing delay for UX
    await new Promise(r => setTimeout(r, 1500));
    
    // 6. Finalize: Save assistant reply & send
    await supabase.from("conversations").insert([{
      profile_id: profileId, customer_id: customerId, message: aiReply, role: "assistant"
    }]);
    
    await sendWhatsAppMessage(phone, aiReply, messageId);
    
    log("info", "job_completed", { messageId });

  } catch (error) {
    log("error", "job_failed", { messageId, error: error.message });
    
    // Failure Recovery: Log to follow_ups
    if (profileId && customerId) {
      await supabase.from("follow_ups").insert([{
        profile_id: profileId,
        customer_id: customerId,
        message_preview: text.substring(0, 50),
        status: "pending",
        notes: JSON.stringify({ error: error.message, messageId, jobStatus: 'failed' })
      }]);
    }
    
    throw error; // Re-throw to let BullMQ handle retry
  }
}, {
  connection: redisConnection,
  concurrency: 2,
  lockDuration: 30000,
});

worker.on("failed", (job, err) => {
  log("error", "worker_job_event_failed", { jobId: job.id, error: err.message });
});

worker.on("completed", (job) => {
  log("info", "worker_job_event_completed", { jobId: job.id });
});

module.exports = worker;
