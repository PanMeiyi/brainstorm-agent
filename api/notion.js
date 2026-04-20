export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const notionKey = process.env.NOTION_API_KEY;
  if (!notionKey) {
    return res.status(500).json({
      error: "Missing NOTION_API_KEY in environment variables.",
    });
  }

  const { endpoint, method = "POST", body } = req.body || {};
  if (!endpoint || typeof endpoint !== "string") {
    return res.status(400).json({
      error: "Invalid request. `endpoint` is required.",
    });
  }

  try {
    const upperMethod = String(method || "POST").toUpperCase();
    const options = {
      method: upperMethod,
      headers: {
        Authorization: `Bearer ${notionKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
    };
    if (upperMethod !== "GET" && upperMethod !== "HEAD" && body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const upstream = await fetch(`https://api.notion.com${endpoint}`, options);

    const text = await upstream.text();

    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        lower === "content-length" ||
        lower === "content-encoding" ||
        lower === "transfer-encoding" ||
        lower === "connection"
      ) {
        return;
      }
      res.setHeader(key, value);
    });

    res.status(upstream.status).send(text);
  } catch (error) {
    res.status(500).json({
      error: "Proxy request failed.",
      message: error.message || String(error),
    });
  }
}
