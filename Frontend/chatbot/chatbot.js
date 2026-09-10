// Frontend/chatbot/chatbot.js
(function () {
  "use strict";

  var API_URL = "/api/chat";

  function escapeText(str) {
    if (typeof window.escapeHTML === "function") return window.escapeHTML(str);
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch (e) {
      return null;
    }
  }

  var role = (getUser() && getUser().role) || null;
  var history = [];

  var SUGGESTIONS = {
    student: ["Search jobs for developers", "How do I apply for a job?", "What is my application status?"],
    recruiter: ["How do I post a job?", "When will my job be approved?", "How do I see my applicants?"],
    admin: ["How many pending jobs?", "Show recent applications", "How do I approve a job?"],
    guest: ["What jobs are available?", "How do I apply for a job?", "How can I post a job?"]
  };

  var suggestions = SUGGESTIONS[role] || SUGGESTIONS.guest;

  var CSS = [
    "#hc-btn{position:fixed;bottom:20px;right:20px;z-index:99999;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;background:#4f46e5;color:#fff;font-size:26px;box-shadow:0 4px 14px rgba(79,70,229,.45);display:flex;align-items:center;justify-content:center}",
    "#hc-btn:hover{background:#4338ca}",
    "#hc-panel{position:fixed;bottom:90px;right:20px;z-index:99999;width:370px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;font-family:Segoe UI,Arial,sans-serif}",
    "#hc-panel.open{display:flex}",
    "#hc-head{background:#4f46e5;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}",
    "#hc-head h4{margin:0;font-size:15px}",
    "#hc-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1}",
    "#hc-body{flex:1;overflow-y:auto;padding:14px;background:#f3f4f6;display:flex;flex-direction:column;gap:8px}",
    ".hc-msg{max-width:80%;padding:8px 12px;border-radius:12px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}",
    ".hc-msg.user{align-self:flex-end;background:#4f46e5;color:#fff;border-bottom-right-radius:2px}",
    ".hc-msg.bot{align-self:flex-start;background:#fff;color:#111;border-bottom-left-radius:2px;box-shadow:0 1px 2px rgba(0,0,0,.1)}",
    ".hc-msg.error{background:#fee2e2;color:#b91c1c}",
    ".hc-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 6px;background:#f3f4f6}",
    ".hc-chip{border:1px solid #c7d2fe;background:#eef2ff;color:#3730a3;border-radius:20px;padding:4px 10px;font-size:12px;cursor:pointer}",
    ".hc-chip:hover{background:#e0e7ff}",
    "#hc-input-row{display:flex;border-top:1px solid #e5e7eb;background:#fff;padding:8px}",
    "#hc-input{flex:1;border:1px solid #d1d5db;border-radius:20px;padding:8px 12px;font-size:13.5px;outline:none}",
    "#hc-send{border:none;background:#4f46e5;color:#fff;border-radius:20px;padding:8px 16px;margin-left:8px;cursor:pointer;font-size:13.5px}",
    "#hc-typing{font-size:12px;color:#6b7280;padding:0 14px 6px;display:none}"
  ].join("");

  var style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "id") node.id = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  var btn = el("button", { id: "hc-btn" }, "ðŸ’¬");
  var head = el("div", { id: "hc-head" },
    '<h4>HireWaY Assistant</h4><button id="hc-close">&times;</button>');
  var body = el("div", { id: "hc-body" });
  var chips = el("div", { id: "hc-chips", class: "hc-chips" });
  var typing = el("div", { id: "hc-typing" }, "typing...");
  var inputRow = el("div", { id: "hc-input-row" });
  var input = el("input", { id: "hc-input", placeholder: "Ask me anything...", type: "text" });
  var send = el("button", { id: "hc-send" }, "Send");
  inputRow.appendChild(input);
  inputRow.appendChild(send);

  var panel = el("div", { id: "hc-panel" });
  panel.appendChild(head);
  panel.appendChild(body);
  panel.appendChild(chips);
  panel.appendChild(typing);
  panel.appendChild(inputRow);

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  function appendMessage(roleText, text, extraClass) {
    var msg = el("div", { class: "hc-msg " + (roleText === "user" ? "user" : "bot") + (extraClass ? " " + extraClass : "") }, "");
    msg.textContent = text;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }

  function renderChips() {
    chips.innerHTML = "";
    suggestions.forEach(function (q) {
      var chip = el("button", { class: "hc-chip" }, escapeText(q));
      chip.addEventListener("click", function () {
        input.value = q;
        sendMessage();
      });
      chips.appendChild(chip);
    });
  }

  renderChips();

  function openPanel() {
    panel.classList.add("open");
    if (body.childNodes.length === 0) {
      appendMessage("bot", "Hi! I'm the HireWaY assistant. Ask me about open jobs, applying, or posting jobs.");
    }
    input.focus();
  }

  btn.addEventListener("click", function () {
    if (panel.classList.contains("open")) {
      panel.classList.remove("open");
    } else {
      openPanel();
    }
  });
  head.querySelector("#hc-close").addEventListener("click", function () {
    panel.classList.remove("open");
  });

  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    appendMessage("user", text);
    history.push({ role: "user", content: text });
    typing.style.display = "block";

    var options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-8) })
    };
    if (typeof localStorage !== "undefined") {
      var token = localStorage.getItem("token");
      if (token) options.headers["Authorization"] = "Bearer " + token;
    }

    fetch(API_URL, options)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        typing.style.display = "none";
        if (data.reply) {
          appendMessage("bot", data.reply);
          history.push({ role: "assistant", content: data.reply });
        } else if (data.error) {
          appendMessage("bot", data.error, "error");
        } else {
          appendMessage("bot", "Sorry, I couldn't generate a response. Please try again.", "error");
        }
      })
      .catch(function (err) {
        typing.style.display = "none";
        console.error("Chat error:", err);
        appendMessage("bot", "I'm having trouble reaching the server. Please try again in a moment.", "error");
      });
  }

  send.addEventListener("click", sendMessage);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessage();
  });
})();