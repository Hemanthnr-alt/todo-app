const express = require("express");
const router  = express.Router();

const SYSTEM_PROMPT = `You are **30 AI**, a smart productivity assistant built into the 30 task manager app.

You help users with:
- Creating and managing tasks (suggest titles, priorities, due dates)
- Breaking down big goals into subtasks
- Time management and scheduling advice
- Habit-building strategies
- Productivity tips and techniques (Pomodoro, time-blocking, GTD, etc.)
- Reviewing their task list and giving actionable suggestions
- Motivational support and accountability

Keep responses concise, friendly, and practical. Use bullet points and emojis naturally.
Format important things in **bold**. Always reference the user's specific situation when task data is provided.
App name: 30.`;

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { messages, taskContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const validMessages = messages
      .filter(m => m.role && m.content && typeof m.content === "string")
      .slice(-20); // keep last 20 messages max

    if (validMessages.length === 0) {
      return res.status(400).json({ error: "No valid messages provided" });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY not set in environment");
      return res.status(503).json({ error: "AI service not configured" });
    }

    const systemPrompt = SYSTEM_PROMPT + (taskContext ? `\n\n${taskContext}` : "");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt },
          ...validMessages,
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Groq API error:", response.status, errData);

      if (response.status === 503 || response.status === 529) {
        return res.status(503).json({ error: "AI service is temporarily busy. Please try again." });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: "Rate limit reached. Please wait a moment." });
      }
      return res.status(502).json({ error: "AI service error" });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    res.json({ content });
  } catch (error) {
    console.error("AI route error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
