export interface ProductAnalysis {
  product_name: string;
  product_visual: string;
  product_features: string;
  video_setting: string;
  icp: string;
  character_model: string;
}

export async function analyzeProduct(
  imageBase64: string,
  geminiApiKey: string,
  promptModel: string
): Promise<ProductAnalysis> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${promptModel}:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              text: `Analyze this product image with EXTREME detail. Your description will be used by AI to reconstruct this EXACT product without seeing the original photo.

Respond in JSON format only. No explanation outside the JSON.

{
  "product_name": "the product name/brand visible on packaging",
  "product_visual": "DETAILED English description following these rules: describe as if explaining to an artist who has NEVER seen this product. MUST include: (1) overall type and shape (bottle, tube, garment, device, pouch, box, etc), (2) relative size (palm-sized, handheld, wearable, etc), (3) EXACT colors of each part (e.g. matte black body, brushed silver trim, white cap), (4) material and finishing (glossy plastic, frosted glass, cotton fabric, brushed metal, etc), (5) ALL visible text (brand name, variant, size, tagline) with position and font color, (6) visible functional details (pump, zipper, button, screen, dropper, etc), (7) photo angle and product condition (front view, opened, being held, etc). Do NOT describe anything not visible. Do NOT invent details.",
  "product_features": "comma-separated key selling features visible or inferable from packaging",
  "video_setting": "recommended video background/setting for this product type (e.g. bathroom shelf for skincare, kitchen counter for food, desk for tech)",
  "icp": "ideal customer profile in Indonesian context — age range, gender, lifestyle (e.g. wanita 20-30 tahun, skincare enthusiast, aktif di TikTok)",
  "character_model": "recommended character look for UGC (e.g. hijab casual 20-an, clean girl tanpa hijab, cowok muda casual)"
}

Respond with ONLY the JSON object. No markdown, no backticks, no explanation.`,
            },
          ],
        }],
      }),
    }
  );
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";

  // Clean and parse — remove any markdown backticks if present
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned) as ProductAnalysis;
  } catch {
    console.error("Failed to parse product analysis:", cleaned);
    return {
      product_name: "Unknown Product",
      product_visual: cleaned,
      product_features: "",
      video_setting: "indoor neutral background",
      icp: "general consumer",
      character_model: "natural casual look",
    };
  }
}

export async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Analyze a full UGC scene (person + product + setting + lighting)
 * for use as a Start Image that will become the first frame of a video.
 */
export async function analyzeStartImage(
  imageBase64: string,
  geminiApiKey: string,
  promptModel: string
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${promptModel}:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              text: `You are analyzing a UGC-style product photo that will be turned into a video. This image will be the FIRST FRAME of the video — the video must look like this exact image coming to life.

Analyze with EXTREME detail. Describe as if explaining to an artist who must recreate this EXACT scene:

PERSON:
- Exact appearance: age range, gender, ethnicity, skin tone and texture
- Face: shape, features, expression, eye direction, mouth position
- Hair: exact style, color, length, parting, any covering (hijab type/color/draping if applicable)
- Body: posture, shoulder position, hand placement, finger positions
- Clothing: every visible item with exact colors, material, fit, layers, accessories

PRODUCT:
- Type, shape, exact dimensions relative to hand
- Every color of each part (body, cap, label, liquid)
- Material and finish (glossy, matte, frosted, metallic)
- ALL visible text: brand name, variant, size — with position and font style
- How it's being held: which hand, finger positions, grip style, angle, tilt
- Which parts of product face camera, which are hidden

ENVIRONMENT:
- Setting type and specific location details
- Background elements: furniture, walls, decor, objects
- Surface textures and colors
- Depth: what's in focus, what's blurred

LIGHTING:
- Primary light source direction (left, right, above, window)
- Light quality (hard/soft, warm/cool, natural/artificial)
- Color temperature (warm golden, cool white, neutral)
- Shadow placement and intensity
- Any rim light, fill light, or secondary sources

CAMERA:
- Framing (extreme close-up, close-up, medium, full body)
- Angle (eye level, slightly above, below)
- Distance from subject
- Depth of field (bokeh level)
- Orientation (portrait 9:16 or landscape 16:9)

MOOD & STYLE:
- Overall color palette and grading
- Energy level (calm, energetic, cozy, professional)
- UGC authenticity markers (natural imperfections, phone-quality feel, casual vs staged)

Respond in English only. Be extremely specific — every detail matters for video reconstruction. This description will be used to ensure the video's first frame EXACTLY matches this image.`,
            },
          ],
        }],
      }),
    }
  );

  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}
