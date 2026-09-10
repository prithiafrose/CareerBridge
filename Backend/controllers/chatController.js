// Backend/controllers/chatController.js
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const Job = require("../models/Job");

const MAX_HISTORY = 8;
const rateMap = new Map();

function getRole(req) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return decoded.role || null;
  } catch (err) {
    return null;
  }
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (rateMap.get(ip) || []).filter(t => now - t < 60000);
  if (recent.length >= 30) return true;
  recent.push(now);
  rateMap.set(ip, recent);
  return false;
}

async function findActiveJobs(query) {
  const where = { status: "active" };
  if (query) {
    where[Op.or] = [
      { title: { [Op.like]: `%${query}%` } },
      { company: { [Op.like]: `%${query}%` } },
      { description: { [Op.like]: `%${query}%` } },
      { location: { [Op.like]: `%${query}%` } }
    ];
  }
  const rows = await Job.findAll({
    where,
    limit: 5,
    order: [["id", "DESC"]]
  });
  return rows.map(j => ({
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    type: j.type,
    salary: j.salary
  }));
}

function wantsJobSearch(text) {
  return /job|vacanc|position|open.?role|hire|employ|salar|work|post/i.test(text);
}

function fallbackReply(text, jobs, role) {
  const lower = text.toLowerCase();

  if (/(^|[\s,.!?])h(i|ello|ey)|assalam|salam|good (morning|afternoon|evening)/i.test(lower)) {
    return `Hello! I'm the HireWaY assistant. I can help you with job searches, applying to jobs, and how the portal works. What would you like to know?`;
  }

  if (/how.*(apply|submit)|apply.*job|candidate|submit.*cv|apply\??$/.test(lower)) {
    return `To apply for a job:\n1. Open the job from the homepage or Student Job Listings.\n2. Click "View Details", then "Apply Now".\n3. Fill in your cover letter and upload your CV/resume.\nYour application goes straight to the recruiter, and you'll get a notification when its status changes.\n\nCheck your applications under "Applied Jobs" in the student menu.`;
  }

  if (/post.*job|add.*job|creat.*job|adverti|recruiter.*job/.test(lower)) {
    return `As a recruiter you can post a job from the "Add Job" page. After submitting, the job is marked "pending" until an admin approves it. Once approved it becomes active and is visible to students, and you'll get a notification.`;
  }

  if (/pending|approv|review|reject/.test(lower)) {
    if (role === "admin") {
      const Job = require("../models/Job");
      return Job.count({ where: { status: "pending" } })
        .then(count => `You currently have ${count} job(s) pending approval. You can approve or reject them from the Job Listings page.`)
        .catch(() => "I couldn't check the pending jobs right now.");
    }
    return "Jobs posted by recruiters start as pending. An admin reviews and approves them before they go live. You'll get a notification when your job is approved.";
  }

  if (/notif|bell|alert/.test(lower)) {
    return "Open the bell in the top bar to see your notifications. Students get alerts about application status; recruiters get alerts about new applications and job approvals; admins see pending jobs and new applications.";
  }

  if (/contact|phone|email|support|help/.test(lower)) {
    return "If you need help, check the policies at the footer (Privacy Policy, Terms), or contact us via the footer phone number. You can also ask me about jobs, applying, or posting jobs.";
  }

  if (wantsJobSearch(text) || jobs.length > 0) {
    if (jobs.length === 0) {
      return "I couldn't find any matching jobs right now. You can try different keywords (for example \"developer\" or \"designer\") on the Job Listings page.";
    }
    const lines = jobs.slice(0, 5).map(j =>
      `- ${j.title} at ${j.company} (${j.location || "Location not specified"})${j.salary ? `, salary ${j.salary}` : ""}`
    );
    return `Here are some open positions:\n${lines.join("\n")}\n\nOpen any of these in the Job Listings page to see details and apply.`;
  }

  return `I can help with things like:\n- Searching open jobs (try "show me developer jobs")\n- How to apply for a job\n- How posting and admin approval works\n\nTry one of the suggestions below, or rephrase your question.`;
}

async function callLLM(messages) {
  const key = process.env.OPENAI_API_KEY;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 500
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`OpenAI API error ${res.status}`);
    const data = await res.json();
    return data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : null;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

const chat = async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    let incoming = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
    if (incoming.length === 0) {
      return res.status(400).json({ error: "No messages provided" });
    }

    const role = getRole(req);
    const lastUser = [...incoming].reverse().find(m => m.role === "user");
    const userText = (lastUser && lastUser.content ? String(lastUser.content).slice(0, 500) : "");

    let contextJobs = [];
    if (wantsJobSearch(userText)) {
      try {
        contextJobs = await findActiveJobs(userText);
        if (contextJobs.length === 0) contextJobs = await findActiveJobs("");
      } catch (err) {
        console.error("Job search failed:", err);
      }
    }

    const systemPrompt = [
      `You are the helpful assistant for "HireWaY", a job portal for students, recruiters and admins.
Students browse active jobs and apply; recruiters post jobs that need admin approval before going live; admins approve pending jobs and manage the portal.
The current logged-in role is ${role || "guest"}.
Answer concisely and helpfully, using the live job data below when the question is about jobs. You may answer in simple English or Bengali.`,
      ...(contextJobs.length > 0 ? [`Current open jobs:\n${JSON.stringify(contextJobs)}`] : [])
    ].join("\n\n");

    const history = incoming.slice(-MAX_HISTORY).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 1000)
    }));

    let reply = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        reply = await callLLM([{ role: "system", content: systemPrompt }, ...history]);
      } catch (err) {
        console.error("LLM call failed, using fallback:", err.message);
      }
    }

    if (!reply) {
      reply = await fallbackReply(userText, contextJobs, role);
    }

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { chat };