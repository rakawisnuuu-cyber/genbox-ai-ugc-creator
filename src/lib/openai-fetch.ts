export async function openAiFetch(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  imageBase64?: { mimeType: string; data: string },
) {
  const messages: any[] = [{ role: "system", content: systemPrompt }];
  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:${imageBase64.mimeType};base64,${imageBase64.data}`,
          },
        },
        { type: "text", text: userMessage },
      ],
    });
  } else {
    messages.push({ role: "user", content: userMessage });
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "gpt-4o", messages, max_tokens: 4000 }),
  });
  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}
