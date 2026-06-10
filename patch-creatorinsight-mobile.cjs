// patch-creatorinsight-mobile.cjs
const fs = require("fs");
const path = require("path");

function backupFile(filePath) {
  const backupPath = `${filePath}.BEFORE_PATCH`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`Backup created: ${backupPath}`);
  }
}

function updateFile(filePath, transformFn) {
  backupFile(filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  const updated = transformFn(content);
  fs.writeFileSync(filePath, updated, "utf-8");
  console.log(`Updated: ${filePath}`);
}

// Patch app/components/CreatorInsightApp.tsx
updateFile(
  path.join("app", "components", "CreatorInsightApp.tsx"),
  (content) => {
    // Pastikan fetch API channel-videos pakai async/await dan setVideos
    return content.replace(
      /const data = await fetchJson\(\/api\/youtube\/channel-videos\?channelId=\$\{envelope\}\);/g,
      `const data = await fetch("/api/youtube/channel-videos").then(res => res.json());`
    );
  }
);

// Patch app/video-optimizer/page.tsx
updateFile(
  path.join("app", "video-optimizer", "page.tsx"),
  (content) => {
    return content.replace(
      /const res = await fetch\("\/api\/youtube\/channel-videos"\);/g,
      `const res = await fetch("/api/youtube/channel-videos").then(r => r.json());`
    );
  }
);

// Patch app/api/youtube/channel-videos/route.ts
updateFile(
  path.join("app", "api", "youtube", "channel-videos", "route.ts"),
  (content) => {
    return content.replace(
      /const accessToken = session\?\.accessToken;/g,
      `const accessToken = (session as any)?.accessToken;`
    ).replace(
      /videos = await fetchChannelVideos\(apiKey\);/g,
      `videos = await fetchChannelVideos(); // fallback pakai API key internal`
    );
  }
);

console.log("Patch Creator Insight Mobile applied successfully!");