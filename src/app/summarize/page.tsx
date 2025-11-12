"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";


type SummarizePayload =
  | { source: "youtube"; link: string }
  | { source: "text"; text: string };

// ✅ Wrap page with Suspense
export default function SummarizePageWrapper() {
  return (
    <Suspense>
      <SummarizePage />
    </Suspense>
  );
}

function SummarizePage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ now allowed inside Suspense
  const prefilledLink = (searchParams?.get("link") ?? "") as string;

  const [source, setSource] = useState<"youtube" | "text" | "upload">("youtube");
  const [link, setLink] = useState(prefilledLink);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (prefilledLink) {
      setSource("youtube");
      setLink(prefilledLink);
    }
  }, [prefilledLink]);

  if (!isLoaded)
    return (
      <div className="text-center mt-20 text-slate-500">Loading...</div>
    );
  if (!isSignedIn) return <RedirectToSignIn />;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);
  }

  async function handleSummarize() {
    setError(null);
    setSummary(null);

    try {
      setLoading(true);
      let response: Response | undefined = undefined;

      if (source === "youtube" || source === "text") {
        const payload: SummarizePayload =
          source === "youtube"
            ? { source: "youtube", link }
            : { source: "text", text };

        response = await fetch(`${BACKEND_URL}/summarize/api/agent/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (source === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);

        response = await fetch(`${BACKEND_URL}/summarize/api/agent/upload`, {
          method: "POST",
          body: formData,
        });
      }

      if (!response) throw new Error("No response from server");
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Summarization failed");
      }

      const data = await response.json();
      setSummary(data.output);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(format: "txt" | "pdf") {
    if (!summary) return;
    const response = await fetch(
      `${BACKEND_URL}/summarize/api/agent/download/txt${format}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summary }),
      }
    );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary.${format}`;
    a.click();
  }

  async function handleTTS() {
    if (!summary) return;
    const response = await fetch(`${BACKEND_URL}/summarize/api/agent/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: summary }),
    });
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setIsPlaying(true);
    audio.play();

    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
  }

  function handleStopTTS() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 py-16 px-6">
      {/* your JSX … unchanged */}
    </div>
  );
}

function OptionButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full border transition font-medium flex items-center ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
