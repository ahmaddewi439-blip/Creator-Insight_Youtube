// ... (Bagian atas kode tetap sama)
{result && (
  <div className="mt-8 space-y-6">
    <h2 className="text-2xl font-bold text-green-400">Blueprint Produksi Matang:</h2>
    
    {/* Hook Section */}
    <div className="bg-gray-900 p-4 rounded border-l-4 border-red-500">
      <p className="text-xs text-gray-400">{result.hook.time}</p>
      <p className="text-lg font-bold">VO: {result.hook.vo}</p>
      <p className="text-sm italic text-green-300">Prompt: {result.hook.visualPrompt}</p>
    </div>

    {/* Scenes Section */}
    {result.scenes.map((scene, i) => (
      <div key={i} className="bg-gray-900 p-4 rounded border-l-4 border-blue-500">
        <p className="text-xs text-gray-400">{scene.timestamp}</p>
        <p className="text-md">VO: {scene.vo}</p>
        <p className="text-sm italic text-green-300">Visual: {scene.visualPrompt}</p>
      </div>
    ))}
  </div>
)}