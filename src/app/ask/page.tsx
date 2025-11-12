"use client";

import { useState } from "react";
import { Send, AlertCircle,  Bot } from "lucide-react";

export default function AskPage() {
    const [messages, setMessages] = useState<
        { role: "user" | "ai"; content: string }[]
    >([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

    const USER_ID = "demo-user";
    const USER_NAME = "";

    // Simple formatting function (Can be expanded if the AI provides Markdown)
    const formatResponse = (text: string) => {
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: "user" as const, content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/ask/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": USER_ID,
                    "x-user-name": USER_NAME,
                },
                body: JSON.stringify({ message: input }),
            });

            if (!res.ok) {
                const err = await res.json();
                setMessages((prev) => [
                    ...prev,
                    { role: "ai", content: `Error: ${err.detail}` },
                ]);
            } else {
                const data = await res.json();
                const reply = formatResponse(data.reply);
                setMessages((prev) => [...prev, { role: "ai", content: reply }]);
            }
        } catch (error) {
            console.error("Chat request failed:", error);
            setMessages((prev) => [
                ...prev,
                { role: "ai", content: "Network error. Please try again." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 pt-10 pb-20"> {/* Unified Container Style */}
                
                {/* Main Chat Box: Matching AIMentor style */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                    
                    {/* Header */}
                    <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-white">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Bot className="w-6 h-6 text-blue-600" />
                            Ask UAARN
                        </h2>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500 hidden sm:inline">
                                Your AI Study Companion
                            </span>
                        </div>
                    </div>

                    {/* Chat History Area (Scrollable) */}
                    <div className="h-[75vh] max-h-[800px] overflow-y-auto p-6 md:p-8 space-y-4">
                        {messages.length === 0 && (
                            <p className="text-center text-slate-400 mt-10">
                                Start your learning journey — ask anything!
                            </p>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed shadow-sm transition duration-150 ${
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-tr-sm" // Matched ChatBubble user style
                                            : "bg-slate-100 text-slate-800 rounded-tl-sm" // Matched ChatBubble AI style
                                    }`}
                                >
                                    {/* Handle errors and formatting */}
                                    {msg.content.includes("Error:") || msg.content.includes("Network error") ? (
                                        <div className="flex items-center gap-2 text-red-600">
                                            <AlertCircle className="w-4 h-4" />
                                            <span dangerouslySetInnerHTML={{ __html: msg.content }} />
                                        </div>
                                    ) : (
                                        <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 text-slate-500 px-4 py-3 rounded-xl rounded-tl-sm text-sm animate-pulse">
                                    Thinking...
                                </div>
                            </div>
                        )}
                        {/* Scroll Anchor Placeholder */}
                        <div className="pt-2" /> 
                    </div>

                    {/* Input Area (Bottom docked) */}
                    <div className="border-t border-slate-200 p-4 bg-slate-50">
                        <div className="flex items-center gap-3 max-w-4xl mx-auto">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ask anything about your studies..."
                                // Updated Input Styling
                                className="flex-1 px-5 py-3 border border-slate-300 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                // Updated Button Styling
                                className="px-4 py-2 sm:px-4 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition disabled:opacity-50 shadow-md"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}