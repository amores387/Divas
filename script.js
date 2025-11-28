const TIKTOK_API = "https://betadash-api-swordslush-production.up.railway.app/api/tiktok?link=";
const FACEBOOK_API = "https://betadash-api-swordslush-production.up.railway.app/fbdl?url=";
const YOUTUBE_API = "https://betadash-api-swordslush-production.up.railway.app/twitch-dl?url=";
const INSTAGRAM_API = "https://betadash-api-swordslush-production.up.railway.app/instadl?url=";

function extractVideoUrl(data, platform) {
    if (!data) return null;

    if (typeof data === "string") {
        if (data.startsWith("http") || data.startsWith("data:")) return data;
    }

    const fields = ["video", "url", "download_url", "media", "result", "link", "play", "download", "src", "file", "video_url"];
    for (let field of fields) {
        if (data[field]) {
            if (typeof data[field] === "string" && (data[field].startsWith("http") || data[field].startsWith("data:"))) return data[field];
        }
    }

    if (data.data) {
        if (typeof data.data === "string" && (data.data.startsWith("http") || data.data.startsWith("data:"))) return data.data;
        if (Array.isArray(data.data)) {
            for (let item of data.data) {
                if (typeof item === "string" && (item.startsWith("http") || item.startsWith("data:"))) return item;
                if (typeof item === "object") {
                    for (let field of fields) {
                        if (item[field] && typeof item[field] === "string" && (item[field].startsWith("http") || item[field].startsWith("data:"))) {
                            return item[field];
                        }
                    }
                }
            }
        }
        if (typeof data.data === "object") {
            for (let field of fields) {
                if (data.data[field] && typeof data.data[field] === "string" && (data.data[field].startsWith("http") || data.data[field].startsWith("data:"))) {
                    return data.data[field];
                }
            }
        }
    }

    if (data.result) {
        if (typeof data.result === "string" && (data.result.startsWith("http") || data.result.startsWith("data:"))) return data.result;
        if (typeof data.result === "object") {
            for (let field of fields) {
                if (data.result[field] && typeof data.result[field] === "string" && (data.result[field].startsWith("http") || data.result[field].startsWith("data:"))) {
                    return data.result[field];
                }
            }
        }
    }

    return null;
}

async function downloadVideo(url) {
    const result = document.getElementById("result");
    const preview = document.getElementById("preview");
    const dl = document.getElementById("downloadLink");

    try {
        let apiUrl = null;
        let platform = null;

        if (url.includes("tiktok")) {
            apiUrl = TIKTOK_API + encodeURIComponent(url);
            platform = "tiktok";
        } else if (url.includes("facebook") || url.includes("fb")) {
            apiUrl = FACEBOOK_API + encodeURIComponent(url);
            platform = "facebook";
        } else if (url.includes("youtube") || url.includes("youtu.be")) {
            apiUrl = YOUTUBE_API + encodeURIComponent(url);
            platform = "youtube";
        } else if (url.includes("instagram") || url.includes("ig")) {
            apiUrl = INSTAGRAM_API + encodeURIComponent(url);
            platform = "instagram";
        } else {
            alert("Only TikTok, Facebook, YouTube, and Instagram supported");
            return;
        }

        console.log("Fetching from proxy:", apiUrl);
        
        const proxyUrl = "/api/proxy?url=" + encodeURIComponent(apiUrl);
        const res = await fetch(proxyUrl);

        console.log("Response status:", res.status);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        let data = await res.json();
        console.log("API Response:", data);

        const videoUrl = extractVideoUrl(data, platform);
        console.log("Extracted URL:", videoUrl);

        if (videoUrl) {
            preview.src = videoUrl;
            preview.style.display = "block";
            dl.href = videoUrl;
            dl.download = `DIVAS_${Date.now()}.mp4`;
            result.classList.remove("hidden");
            setTimeout(() => {
                document.querySelector(".download-card").scrollIntoView({behavior: "smooth"});
            }, 100);
        } else {
            throw new Error("No video URL in response");
        }

    } catch (error) {
        console.error("Error details:", {
            message: error.message,
            stack: error.stack
        });
        alert("Download failed. Try another link.");
    }
}

document.getElementById("downloadBtn").addEventListener("click", async () => {
    const url = document.getElementById("urlInput").value.trim();
    
    if (!url) {
        alert("Paste a link");
        return;
    }

    await downloadVideo(url);
});

document.getElementById("urlInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        document.getElementById("downloadBtn").click();
    }
});