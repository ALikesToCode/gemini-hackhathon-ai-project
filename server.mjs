import { createServer } from "node:http";
import next from "next";
import { WebSocketServer } from "ws";
import { GoogleGenAI } from "@google/genai";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url?.startsWith("/ws/coach")) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
      return;
    }
    socket.destroy();
  });

  wss.on("connection", (ws) => {
    const session = {
      packId: "",
      mode: "coach",
      geminiApiKey: "",
      model: "gemini-3-pro",
      history: [],
      useLive: false,
      researchApiKey: "",
      researchQuery: "",
      browserUseApiKey: "",
      useBrowserUse: false,
      liveSession: null,
      liveBuffer: ""
    };

    ws.on("message", async (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === "init") {
          session.packId = payload.packId ?? "";
          session.mode = payload.mode ?? "coach";
          session.geminiApiKey = payload.geminiApiKey ?? "";
          session.model = payload.model ?? "gemini-3-pro";
          session.useLive = Boolean(payload.useLive);
          session.researchApiKey = payload.researchApiKey ?? "";
          session.researchQuery = payload.researchQuery ?? "";
          session.browserUseApiKey = payload.browserUseApiKey ?? "";
          session.useBrowserUse = Boolean(payload.useBrowserUse);

          if (session.useLive && session.geminiApiKey) {
            const ai = new GoogleGenAI({ apiKey: session.geminiApiKey });
            session.liveSession = await ai.live.connect({
              model: session.model,
              config: {
                responseModalities: ["TEXT"],
                temperature: 0.5,
                maxOutputTokens: 800
              },
              callbacks: {
                onmessage: (msg) => {
                  const content = msg?.serverContent?.modelTurn?.parts
                    ?.map((part) => part.text ?? "")
                    .join("");
                  if (content) {
                    session.liveBuffer += content;
                    ws.send(JSON.stringify({ type: "chunk", content }));
                  }
                  if (msg?.serverContent?.turnComplete) {
                    if (session.liveBuffer) {
                      session.history.push({
                        role: "assistant",
                        content: session.liveBuffer
                      });
                      session.liveBuffer = "";
                    }
                    ws.send(JSON.stringify({ type: "done" }));
                  }
                }
              }
            });
          }
          return;
        }

        if (payload.type !== "message" || !session.packId) {
          ws.send(JSON.stringify({ type: "error", message: "Missing pack/session info." }));
          return;
        }

        if (session.useLive && session.liveSession) {
          session.liveBuffer = "";
          session.liveSession.sendClientContent({
            turns: [
              {
                role: "user",
                parts: [{ text: payload.content ?? "" }]
              }
            ],
            turnComplete: true
          });
          session.history.push({ role: "user", content: payload.content ?? "" });
          return;
        }

        const response = await fetch(`http://localhost:${port}/api/coach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packId: session.packId,
            message: payload.content ?? "",
            history: session.history,
            mode: session.mode,
            geminiApiKey: session.geminiApiKey,
            model: session.model,
            researchApiKey: session.researchApiKey || undefined,
            researchQuery: session.researchQuery || undefined,
            browserUseApiKey: session.browserUseApiKey || undefined,
            useBrowserUse: session.useBrowserUse || undefined
          })
        });

        if (!response.ok || !response.body) {
          ws.send(JSON.stringify({ type: "error", message: "Coach request failed." }));
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value || new Uint8Array(), { stream: true });
          assistantText += chunk;
          ws.send(JSON.stringify({ type: "chunk", content: chunk }));
        }

        session.history.push(
          { role: "user", content: payload.content ?? "" },
          { role: "assistant", content: assistantText }
        );

        ws.send(JSON.stringify({ type: "done" }));
      } catch (error) {
        ws.send(JSON.stringify({ type: "error", message: "WebSocket error." }));
      }
    });

    ws.on("close", () => {
      if (session.liveSession) {
        session.liveSession.close();
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
