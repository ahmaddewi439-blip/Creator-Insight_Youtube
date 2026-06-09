// pages/roblox-shorts.tsx
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface ShortScene {
  hook: string;
  scenes: {
    vo: string;
    caption: string;
    prompt: string;
  }[];
  cta: string;
  hashtags: string[];
}

export default function RobloxShorts() {
  const [shorts, setShorts] = useState<ShortScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"id" | "en">("id");

  const languageLabel = lang === "id" ? "Bahasa Indonesia" : "English";

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/roblox/shorts")
      .then((res) => {
        setShorts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [lang]);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value as "id" | "en");
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Roblox Shorts Generator</h1>

      <div className="mb-6">
        <label className="mr-2">Pilih bahasa:</label>
        <select value={lang} onChange={handleLangChange}>
          <option value="id">Bahasa Indonesia</option>
          <option value="en">English</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shorts.map((short, idx) => (
            <div
              key={idx}
              className="border p-4 rounded-lg shadow-md hover:shadow-xl transition"
            >
              <h2 className="text-xl font-bold mb-2">{short.hook}</h2>
              {short.scenes.map((scene, sidx) => (
                <div key={sidx} className="mb-2">
                  <p>
                    <span className="font-semibold">VO:</span> {scene.vo}
                  </p>
                  <p>
                    <span className="font-semibold">Caption:</span> {scene.caption}
                  </p>
                  <p>
                    <span className="font-semibold">Prompt Gemini:</span> {scene.prompt}
                  </p>
                </div>
              ))}
              <p className="mt-2 font-semibold">CTA:</p>
              <p>{short.cta}</p>
              <p className="mt-2 font-semibold">Hashtags:</p>
              <p>{short.hashtags.join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
