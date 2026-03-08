

## Adding Videos to Landing Page Hero Carousel

The current hero carousel (`DepthDeckCarousel`) only supports static images. To show videos, we need to extend it.

### What you should do

**Yes, you can attach the videos directly in chat.** However, there are some constraints:

- **Max 10 files per message, max 20MB each** — if your videos exceed this, you'll need to split across messages or compress them first.
- Videos will be saved to `src/assets/` or uploaded to a storage bucket for serving.

**Recommended approach:** Upload the videos to your existing **preset-characters** storage bucket (or a new `showcase-videos` bucket) since serving from a CDN is better for performance than bundling in `src/assets/`.

### Implementation Plan

1. **Create a `showcase-videos` storage bucket** (public) via migration, or reuse an existing bucket.

2. **Extend `DepthDeckCarousel`** to support a `type: "image" | "video"` field on each card. Video cards will render a `<video>` element with `autoPlay`, `muted`, `loop`, `playsInline` attributes instead of `<img>`. The active card's video plays; non-active cards pause.

3. **Update `showcaseCards` array** with the video URLs from the bucket after you upload them.

### Next Step

Go ahead and **attach your videos in the next message** (up to 10 per message, under 20MB each). I'll then:
- Upload them to a public storage bucket
- Update the carousel to support mixed image + video cards

