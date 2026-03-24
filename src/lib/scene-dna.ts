import { geminiFetch } from "./gemini-fetch";

export interface SceneDNAResult {
  description: string;
  ok: boolean;
}

const SCENE_ANALYSIS_PROMPT = `Analyze this AI-generated image with EXTREME detail. Your description will be used as a reference to recreate this EXACT scene in a video. Every detail matters.

Describe the following elements with maximum precision:

1. SUBJECT/CHARACTER:
- Ethnicity, estimated age, gender
- Face shape, skin tone, skin texture (pores, freckles, moles if visible)
- Hairstyle: color, length, texture, how it's styled (messy bun, loose strands, etc.)
- Facial expression: mouth position, eye direction, eyebrow position
- Body pose: posture, hand positions, gestures
- Outfit: exact clothing items, colors, fabric texture, fit (loose/tight), wrinkles, sleeves position
- Accessories: apron, jewelry, watch, hair ties, etc.

2. PRODUCT PLACEMENT:
If the product is HELD in hand:
- Which hand holds it and how (grip style, finger placement)
- Angle of the product relative to camera
- Brand/logo visibility and position
- Product color, material, size relative to the person

If the product is WORN (clothing, shoes, accessories, bag):
- How it fits the body (loose, snug, draped, structured)
- Which body part it covers or attaches to
- How it interacts with other clothing items
- Visible details: stitching, zippers, buckles, straps, label placement
- How fabric falls, wrinkles, or moves

If the product is PLACED nearby (on table, shelf, counter):
- Exact position relative to the subject
- Orientation and angle
- What surface it sits on

3. ENVIRONMENT/BACKGROUND:
- Setting type (kitchen, bedroom, bathroom, living room, outdoor)
- Key furniture and objects visible
- Wall color/material, countertop material
- Props: food items, utensils, plants, decorations
- Depth of field: what's in focus vs blurred

4. LIGHTING:
- Light source direction (left, right, above, window)
- Light quality (soft, harsh, warm, cool)
- Shadow placement and intensity
- Overall brightness level
- Color temperature (warm golden, cool blue, neutral)

5. CAMERA/FRAMING:
- Shot type (close-up, medium, wide)
- Camera angle (eye-level, slightly above/below)
- Subject position in frame (center, rule of thirds)
- Aspect ratio orientation (portrait/landscape)
- Depth of field strength (shallow bokeh vs deep focus)

6. COLOR PALETTE & MOOD:
- Dominant colors in the scene
- Overall color grading/tone (warm, cool, muted, vibrant)
- Mood/atmosphere conveyed

Output ONLY the description. No commentary, no suggestions, no markdown formatting. Write in continuous detailed prose, paragraph by paragraph following the order above.`;

export async function analyzeSceneForVideo(
  imageBase64: string,
  mimeType: string,
  model: string,
  apiKey: string,
): Promise<SceneDNAResult> {
  try {
    const json = await geminiFetch(model, apiKey, {
      contents: [
        {
          parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: SCENE_ANALYSIS_PROMPT }],
        },
      ],
    });
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!text || text.length < 100) {
      return { description: "", ok: false };
    }
    return { description: text, ok: true };
  } catch (e) {
    console.error("[scene-dna] Analysis failed:", e);
    return { description: "", ok: false };
  }
}
