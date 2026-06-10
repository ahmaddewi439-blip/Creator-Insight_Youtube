import React, { useState } from "react";

const RobloxCreatorFinal = () => {
  const [updateData, setUpdateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("natural-news");
  const [searchKeyword, setSearchKeyword] = useState("Roblox");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Fetch API
  const handleSearchUpdate = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/search-roblox-update?keyword=${encodeURIComponent(
          searchKeyword
        )}&category=${encodeURIComponent(selectedCategory)}`
      );
      const data = await response.json();
      if (!data.success) {
        alert(data.error || "Gagal mengambil data Roblox.");
        return;
      }

      // Tambahkan 5 scenes default untuk setiap result
      const dataWithScenes = data.sources.map((item) => ({
        ...item,
        scenes: [
          "Scene 1: Hook 0-3s",
          "Scene 2: Gameplay Intro",
          "Scene 3: Highlight Feature",
          "Scene 4: Action Scene",
          "Scene 5: Strong CTA Ending",
        ],
      }));

      setUpdateData({ ...data, sources: dataWithScenes });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCaption = (item, index) => {
    const textToCopy = `${item.title}\n${item.summary}\nSource: ${item.source}\nCategory: ${item.category}\nDate: ${item.dateFetched} ${item.timeFetched}\nQuery: ${item.queryUsed}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  };

  const handleGeneratePromptShort = (item) => {
    const prompt = `Create a Roblox Short based on this data:
Title: ${item.title}
Summary: ${item.summary}
Keyword: ${searchKeyword}
Category: ${selectedCategory}
Scenes:
${item.scenes.join("\n")}
- Hook 0-3s
- VO natural
- Gameplay direction
- Caption + Hashtags
- Strong CTA ending`;

    navigator.clipboard.writeText(prompt);
    alert("Prompt Short berhasil disalin ke clipboard!");
  };

  const handleCopyAllScenes = (item) => {
    const allScenesPrompt = `${item.title}\n${item.summary}\nScenes:\n${item.scenes.join(
      "\n"
    )}\nSource: ${item.source}\nCategory: ${item.category}\nDate: ${item.dateFetched} ${item.timeFetched}\nQuery: ${item.queryUsed}`;
    navigator.clipboard.writeText(allScenesPrompt);
    alert("Semua Scenes berhasil disalin ke clipboard!");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Roblox Shorts Creator - Final Version</h2>

      {/* Input keyword */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Keyword:{" "}
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ padding: "5px", width: "200px" }}
          />
        </label>
      </div>

      {/* Dropdown kategori */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Kategori:{" "}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: "5px", width: "180px" }}
          >
            <option value="natural-news">Natural News</option>
            <option value="excited-gaming">Excited Gaming</option>
            <option value="mystery">Mystery</option>
            <option value="fun-facts">Fun Facts</option>
          </select>
        </label>
      </div>

      {/* Tombol Search Update */}
      <button
        onClick={handleSearchUpdate}
        disabled={loading}
        style={{
          padding: "8px 15px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Loading..." : "Search Update"}
      </button>

      {/* Hasil interaktif */}
      {updateData && updateData.sources && updateData.sources.length > 0 && (
        <div style={{ marginTop: "25px" }}>
          <h3>
            {updateData.categoryLabel} - {updateData.totalResults} results
          </h3>
          <div
            style={{
              maxHeight: "500px",
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "15px",
              marginTop: "15px",
            }}
          >
            {updateData.sources.map((item, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "12px",
                  backgroundColor: "#f9f9f9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: "bold",
                    color: "#007bff",
                    marginBottom: "8px",
                    textDecoration: "none",
                  }}
                >
                  {item.title}
                </a>
                <p style={{ fontSize: "14px", lineHeight: "1.4", flexGrow: 1 }}>
                  {item.summary.length > 150
                    ? item.summary.substring(0, 150) + "..."
                    : item.summary}
                </p>

                {/* Metadata lengkap */}
                <div
                  style={{
                    fontSize: "12px",
                    color: "#555",
                    marginBottom: "5px",
                  }}
                >
                  <div>Sumber: {item.source}</div>
                  <div>Kategori: {item.category}</div>
                  <div>Tanggal: {item.dateFetched}</div>
                  <div>Jam: {item.timeFetched}</div>
                  <div>Query: {item.queryUsed}</div>
                </div>

                {/* Tombol interaktif */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => handleCopyCaption(item, index)}
                    style={{
                      padding: "5px 8px",
                      backgroundColor:
                        copiedIndex === index ? "#ffc107" : "#17a2b8",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    {copiedIndex === index ? "Copied!" : "Copy Caption & Notif"}
                  </button>

                  <button
                    onClick={() => handleGeneratePromptShort(item)}
                    style={{
                      padding: "5px 8px",
                      backgroundColor: "#6f42c1",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    Generate Prompt Short
                  </button>

                  <button
                    onClick={() =>
                      setExpandedIndex(expandedIndex === index ? null : index)
                    }
                    style={{
                      padding: "5px 8px",
                      backgroundColor: "#fd7e14",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    {expandedIndex === index ? "Hide Scenes" : "Show Scenes"}
                  </button>

                  <button
                    onClick={() => handleCopyAllScenes(item)}
                    style={{
                      padding: "5px 8px",
                      backgroundColor: "#20c997",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    Copy All Scenes
                  </button>
                </div>

                {/* Preview 5 Scenes collapsible */}
                {expandedIndex === index && (
                  <ul style={{ marginTop: "10px", fontSize: "13px" }}>
                    {item.scenes.map((scene, i) => (
                      <li key={i}>{scene}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {updateData &&
        updateData.sources &&
        updateData.sources.length === 0 && (
          <p style={{ marginTop: "25px", fontStyle: "italic", color: "#666" }}>
            Tidak ada data terbaru untuk kategori ini hari ini.
          </p>
        )}
    </div>
  );
};

export default RobloxCreatorFinal;