"use client";

import { useState } from "react";
import { measurePing, measureDownload, measureUpload, getHistory, saveHistory, clearHistory, getRating, type HistoryEntry } from "@/lib/speedtest";

interface SpeedResult {
  download: number | null;
  upload: number | null;
  ping: number | null;
}

interface TestState {
  status: "idle" | "testing" | "complete" | "error";
  currentStep: number;
  errorMessage: string;
  failedStep: number | null;
}

export default function Home() {
  const [results, setResults] = useState<SpeedResult>({
    download: null,
    upload: null,
    ping: null,
  });
  const [testState, setTestState] = useState<TestState>({
    status: "idle",
    currentStep: 0,
    errorMessage: "",
    failedStep: null,
  });
  const [gaugeValue, setGaugeValue] = useState(0);
  const [graphData, setGraphData] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory());

  const handleStartTest = async () => {
    setTestState({ status: "testing", currentStep: 1, errorMessage: "", failedStep: null });
    setGaugeValue(0);
    setGraphData([]);

    try {
      // Step 1: Ping
      const pingResult = await measurePing();
      setResults((prev) => ({ ...prev, ping: pingResult.ping }));

      // Step 2: Download
      setTestState({ status: "testing", currentStep: 2, errorMessage: "", failedStep: null });
      const downloadMbps = await measureDownload((liveMbps) => {
        setGaugeValue(liveMbps);
        setGraphData((prev) => [...prev.slice(-50), liveMbps]); // Keep last 50 points
      });
      setResults((prev) => ({ ...prev, download: downloadMbps }));

      // Step 3: Upload
      setTestState({ status: "testing", currentStep: 3, errorMessage: "", failedStep: null });
      const uploadMbps = await measureUpload((liveMbps) => {
        setGaugeValue(liveMbps);
        setGraphData((prev) => [...prev.slice(-50), liveMbps]); // Keep last 50 points
      });
      setResults((prev) => ({ ...prev, upload: uploadMbps }));

      // Test complete - save to history
      const newHistory = saveHistory({
        timestamp: Date.now(),
        download: downloadMbps,
        upload: uploadMbps,
        ping: pingResult.ping,
      });
      setHistory(newHistory);

      setTestState({ status: "complete", currentStep: 3, errorMessage: "", failedStep: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Test failed";
      setTestState({ status: "error", currentStep: testState.currentStep, errorMessage: message, failedStep: testState.currentStep });
    }
  };

  const handleRetry = () => {
    setResults({ download: null, upload: null, ping: null });
    setTestState({ status: "idle", currentStep: 0, errorMessage: "", failedStep: null });
    setGaugeValue(0);
    setGraphData([]);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const getStepText = () => {
    switch (testState.currentStep) {
      case 1:
        return "Step 1/3: Ping measure ho raha hai...";
      case 2:
        return "Step 2/3: Download measure ho raha hai...";
      case 3:
        return "Step 3/3: Upload measure ho raha hai...";
      default:
        return "Test shuru karne ke liye START dabao";
    }
  };

  const getButtonText = () => {
    if (testState.status === "testing") return "Testing...";
    if (testState.status === "complete") return "Dobara Test Karo";
    if (testState.status === "error") return "Retry";
    return "START";
  };

  const isButtonDisabled = testState.status === "testing";

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString("hi-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen gigaspeed-bg flex flex-col">
      {/* Header */}
      <header className="py-12 px-4 text-center">
        <h1 className="gradient-text text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          GigaSpeed
        </h1>
        <p className="mt-3 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Apne internet ki asli speed check karo
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Gauge Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                {/* Background track */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#e0e7ff"
                  strokeWidth="16"
                />
                {/* Progress track */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="565.48"
                  strokeDashoffset={565.48 - (gaugeValue / 1000) * 565.48}
                  className="gauge-progress"
                  style={{
                    transition: "stroke-dashoffset 0.8s ease-out",
                  }}
                />
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#d946ef" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
                  {gaugeValue > 0 ? gaugeValue.toFixed(1) : "—"}
                </span>
                <span className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
                  Mbps
                </span>
              </div>
            </div>

            {/* START Button */}
            <button
              onClick={handleStartTest}
              disabled={isButtonDisabled}
              className="mt-6 sm:mt-8 gradient-btn text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full text-lg sm:text-xl font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus:ring-4 focus:ring-violet-500/30 min-w-[200px] sm:min-w-[240px]"
            >
              {getButtonText()}
            </button>

            {/* Status Line */}
            <p className="mt-6 text-center text-gray-600 dark:text-gray-300 text-lg min-h-[1.5rem]">
              {testState.errorMessage || getStepText()}
            </p>
          </div>

          {/* Live Speed Graph Placeholder */}
          <div className="mb-8 sm:mb-10 w-full max-w-2xl mx-auto">
            <canvas
              ref={(canvas) => {
                if (canvas && graphData.length > 0) {
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    const dpr = window.devicePixelRatio || 1;
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    ctx.scale(dpr, dpr);

                    const width = rect.width;
                    const height = rect.height;
                    ctx.clearRect(0, 0, width, height);

                    // Draw grid
                    ctx.strokeStyle = "#e0e7ff";
                    ctx.lineWidth = 1;
                    for (let i = 0; i <= 5; i++) {
                      const y = (height / 5) * i;
                      ctx.beginPath();
                      ctx.moveTo(0, y);
                      ctx.lineTo(width, y);
                      ctx.stroke();
                    }

                    // Draw data line
                    if (graphData.length > 1) {
                      ctx.strokeStyle = "#8b5cf6";
                      ctx.lineWidth = 3;
                      ctx.lineCap = "round";
                      ctx.lineJoin = "round";
                      ctx.beginPath();
                      graphData.forEach((value, index) => {
                        const x = (width / (graphData.length - 1)) * index;
                        const y = height - (value / 1000) * height * 0.9 - height * 0.05;
                        if (index === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                      });
                      ctx.stroke();
                    }
                  }
                }
              }}
              className="speed-graph w-full h-32 sm:h-40"
              style={{ width: "100%", height: "100%" }}
              aria-label="Live speed graph"
            />
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              Live speed graph
            </p>
          </div>

          {/* Result Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Download Card */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 download-accent shadow-lg shadow-blue-500/10 border border-gray-100 dark:border-gray-800 min-w-0">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-sky-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide truncate">
                  Download
                </span>
              </div>
              {testState.failedStep === 2 && testState.status === "error" ? (
                <div className="text-center text-red-600 dark:text-red-400">
                  <p className="text-base sm:text-lg font-medium mb-2">Error</p>
                  <p className="text-xs sm:text-sm mb-3 break-words">{testState.errorMessage}</p>
                  <button
                    onClick={handleRetry}
                    className="gradient-btn text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {results.download !== null ? results.download.toFixed(1) : "—"}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Mbps</div>
                </>
              )}
            </div>

            {/* Upload Card */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 upload-accent shadow-lg shadow-green-500/10 border border-gray-100 dark:border-gray-800 min-w-0">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide truncate">
                  Upload
                </span>
              </div>
              {testState.failedStep === 3 && testState.status === "error" ? (
                <div className="text-center text-red-600 dark:text-red-400">
                  <p className="text-base sm:text-lg font-medium mb-2">Error</p>
                  <p className="text-xs sm:text-sm mb-3 break-words">{testState.errorMessage}</p>
                  <button
                    onClick={handleRetry}
                    className="gradient-btn text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {results.upload !== null ? results.upload.toFixed(1) : "—"}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Mbps</div>
                </>
              )}
            </div>

            {/* Ping Card */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 ping-accent shadow-lg shadow-amber-500/10 border border-gray-100 dark:border-gray-800 min-w-0">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide truncate">
                  Ping
                </span>
              </div>
              {testState.failedStep === 1 && testState.status === "error" ? (
                <div className="text-center text-red-600 dark:text-red-400">
                  <p className="text-base sm:text-lg font-medium mb-2">Error</p>
                  <p className="text-xs sm:text-sm mb-3 break-words">{testState.errorMessage}</p>
                  <button
                    onClick={handleRetry}
                    className="gradient-btn text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {results.ping !== null ? results.ping.toFixed(0) : "—"}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">ms</div>
                </>
              )}
            </div>
          </div>

          {/* Result Summary */}
          {testState.status === "complete" && results.download !== null && results.upload !== null && results.ping !== null && (
            <div className="mt-6 sm:mt-8 w-full max-w-4xl">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-800">
                <div className="text-center mb-4">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Test Result Summary
                  </p>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words">
                    Download {results.download.toFixed(1)} Mbps • Upload {results.upload.toFixed(1)} Mbps • Ping {results.ping.toFixed(0)} ms
                  </p>
                  <p className="mt-3 text-lg sm:text-xl font-bold text-violet-600 dark:text-violet-400">
                    {getRating(results.download)}
                  </p>
                </div>
              </div>

              {/* History List */}
              {history.length > 0 && (
                <div className="mt-4 sm:mt-6 w-full max-w-4xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Pichle Tests</h3>
                    <button
                      onClick={handleClearHistory}
                      className="text-xs sm:text-sm text-red-600 dark:text-red-400 hover:underline self-start sm:self-auto"
                    >
                      History saaf karo
                    </button>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-100 dark:border-gray-800 space-y-2">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium text-sky-600 dark:text-sky-400">↓ {entry.download.toFixed(1)} Mbps</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">↑ {entry.upload.toFixed(1)} Mbps</span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">{entry.ping.toFixed(0)} ms</span>
                          <span className="text-gray-500 dark:text-gray-400">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-violet-600 dark:text-violet-400">
                          {getRating(entry.download)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Powered by Cloudflare Speed Test API
      </footer>
    </div>
  );
}