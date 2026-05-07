"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  jobId: string;
}

export default function ChatSidebar({ jobId }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && !historyLoaded) {
      loadHistory();
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vagas/${jobId}/chat`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(
        data.map((m: any) => ({ id: m.id, role: m.role, content: m.content }))
      );
      setHistoryLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch(`/api/vagas/${jobId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) =>
          prev.map((m: any) =>
            m.id === assistantId ? { ...m, content: "Erro ao obter resposta." } : m
          )
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setMessages((prev) =>
          prev.map((m: any) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: "Erro de conexão." } : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 bg-[#4A5452] text-white rounded-full px-4 py-3 text-sm font-semibold shadow-lg hover:bg-[#3a4442] transition flex items-center gap-2"
        aria-label="Abrir assistente de RH"
      >
        <span>{open ? "✕" : "💬"}</span>
        <span className="hidden sm:inline">{open ? "Fechar" : "Assistente"}</span>
      </button>

      {open && (
        <div
          className="fixed z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{
            bottom: "80px",
            right: "16px",
            left: "16px",
            maxWidth: "420px",
            marginLeft: "auto",
            maxHeight: "70vh",
            minHeight: "360px",
          }}
        >
          <div className="bg-[#4A5452] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">Assistente de RH</p>
              <p className="text-[#C4FF57] text-xs">Powered by Claude</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="text-center py-4">
                <div className="inline-block w-5 h-5 border-2 border-[#4A5452] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="text-center py-6 px-2">
                <p className="text-2xl mb-2">🤖</p>
                <p className="text-sm text-gray-600 font-medium">Olá! Sou seu assistente de RH.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Tenho acesso ao contexto completo desta vaga. Pode perguntar sobre candidatos, DISC, estratégia de entrevista e mais.
                </p>
              </div>
            )}

            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#4A5452] text-white rounded-br-sm"
                      : "bg-[#F5F7F0] text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content || (
                    <span className="flex gap-1 items-center text-gray-400">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-200 p-3 flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pergunte sobre os candidatos..."
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4A5452] disabled:opacity-50"
              style={{ maxHeight: "96px", overflowY: "auto" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className="bg-[#C4FF57] text-[#4A5452] rounded-xl px-3 py-2.5 font-bold text-sm hover:bg-[#b3ee46] transition disabled:opacity-40 flex-shrink-0"
              style={{ minHeight: "44px" }}
            >
              {streaming ? (
                <span className="inline-block w-4 h-4 border-2 border-[#4A5452] border-t-transparent rounded-full animate-spin" />
              ) : (
                "→"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
