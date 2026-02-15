const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const aiRoutes = require("./routes/aiRoutes");

//limpar cache
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});


app.use(cors());
app.use(express.json());

// routes
app.use("/auth", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/patients", require("./routes/patientRoutes"));
app.use("/visits", require("./routes/visitRoutes"));
app.use("/triages", require("./routes/triageRoutes"));
app.use("/queue", require("./routes/queueRoutes"));
app.use("/ai", aiRoutes);
app.use("/doctors", require("./routes/doctorRoutes"));

app.get("/health", (req, res) => res.json({ ok: true }));


app.get("/", (req, res) => res.send("API rodando"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
