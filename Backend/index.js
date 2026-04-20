require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing required Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend server is running", timestamp: new Date() });
});

// API Routes (Import routes as they are created)
// TODO: Uncomment these as you create route files
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/followups", require("./routes/followups"));
app.use("/api/webhook", require("./routes/webhook"));

// Dashboard (Internal Visibility)
const dashboardAdapter = require("./config/dashboard");
app.use("/admin/queues", dashboardAdapter.getRouter());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Something went wrong!", message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for frontend development`);
  
  // Start the background worker
  try {
    require("./workers/messageWorker");
    console.log(`🚀 Message Worker initialized with BullMQ`);
  } catch (err) {
    console.error(`❌ Failed to start Message Worker: ${err.message}`);
  }
});
