fetch("/api/youtube/analyze", {
  method: "POST",
  body: JSON.stringify({
    niche: selectedNiche
  })
});