/**
 * Hook for sequential image generation through planned shots.
 * Tracks per-shot status, elapsed time, and completion counts.
 */

import { useState, useRef, useCallback } from "react";
import { generateImageAndWait, type ImageResult } from "@/lib/kie-image-generation";
import { generateImageAndWait } from "@/lib/kie-image-generation";

export interface ImageProgress {
  currentShot: number;
  totalShots: number;
  completedShots: number[];
  failedShots: number[];
  status: "idle" | "generating" | "completed" | "cancelled";
  totalElapsed: number;
  results: Array<ImageResult | null>;
}

const INITIAL_PROGRESS: ImageProgress = {
  currentShot: -1,
  totalShots: 0,
  completedShots: [],
  failedShots: [],
  status: "idle",
  totalElapsed: 0,
  results: [],
};

export function useImageGeneration() {
  const [progress, setProgress] = useState<ImageProgress>(INITIAL_PROGRESS);
  const cancelRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(
    async (options: {
      shots: ImageShotPlan[];
      imageModel: ImageModel;
      resolution: "1K" | "2K" | "4K";
      aspectRatio: string;
      kieApiKey: string;
      characterImageUrl: string;
      productImageUrl: string;
    }) => {
      const { shots, imageModel, resolution, aspectRatio, kieApiKey, characterImageUrl, productImageUrl } = options;

      cancelRef.current = false;
      const results: Array<ImageResult | null> = new Array(shots.length).fill(null);
      const completed: number[] = [];
      const failed: number[] = [];

      // Build image inputs (max 2)
      const imageInputs: string[] = [];
      if (characterImageUrl) imageInputs.push(characterImageUrl);
      if (productImageUrl && imageInputs.length < 2) imageInputs.push(productImageUrl);

      setProgress({
        currentShot: 0,
        totalShots: shots.length,
        completedShots: [],
        failedShots: [],
        status: "generating",
        totalElapsed: 0,
        results,
      });

      // Start elapsed timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setProgress((p) => ({
          ...p,
          totalElapsed: Math.floor((Date.now() - startTime) / 1000),
        }));
      }, 1000);

      for (let i = 0; i < shots.length; i++) {
        if (cancelRef.current) break;

        setProgress((p) => ({ ...p, currentShot: i }));

        try {
          const result = await generateImageAndWait(
            {
              model: imageModel,
              prompt: shots[i].prompt,
              imageInputs,
              resolution,
              aspectRatio,
              outputFormat: "png",
              apiKey: kieApiKey,
            },
            () => cancelRef.current,
          );

          results[i] = result;
          completed.push(i);
          setProgress((p) => ({
            ...p,
            results: [...results],
            completedShots: [...completed],
          }));
        } catch (err: any) {
          if (cancelRef.current) break;
          console.error(`[useImageGeneration] Shot ${i} failed:`, err);
          failed.push(i);
          setProgress((p) => ({
            ...p,
            failedShots: [...failed],
          }));
        }
      }

      // Cleanup timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setProgress((p) => ({
        ...p,
        currentShot: -1,
        status: cancelRef.current ? "cancelled" : "completed",
        totalElapsed: Math.floor((Date.now() - startTime) / 1000),
      }));
    },
    [],
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const retryShot = useCallback(
    async (options: {
      shotIndex: number;
      shot: ImageShotPlan;
      imageModel: ImageModel;
      resolution: "1K" | "2K" | "4K";
      aspectRatio: string;
      kieApiKey: string;
      characterImageUrl: string;
      productImageUrl: string;
    }) => {
      const { shotIndex, shot, imageModel, resolution, aspectRatio, kieApiKey, characterImageUrl, productImageUrl } =
        options;

      const imageInputs: string[] = [];
      if (characterImageUrl) imageInputs.push(characterImageUrl);
      if (productImageUrl && imageInputs.length < 2) imageInputs.push(productImageUrl);

      setProgress((p) => ({
        ...p,
        currentShot: shotIndex,
        status: "generating",
        failedShots: p.failedShots.filter((i) => i !== shotIndex),
      }));

      try {
        const result = await generateImageAndWait({
          model: imageModel,
          prompt: shot.prompt,
          imageInputs,
          resolution,
          aspectRatio,
          outputFormat: "png",
          apiKey: kieApiKey,
        });

        setProgress((p) => {
          const newResults = [...p.results];
          newResults[shotIndex] = result;
          return {
            ...p,
            currentShot: -1,
            status: "completed",
            results: newResults,
            completedShots: [...p.completedShots.filter((i) => i !== shotIndex), shotIndex],
          };
        });
      } catch (err: any) {
        console.error(`[useImageGeneration] Retry shot ${shotIndex} failed:`, err);
        setProgress((p) => ({
          ...p,
          currentShot: -1,
          status: "completed",
          failedShots: [...p.failedShots, shotIndex],
        }));
      }
    },
    [],
  );

  const reset = useCallback(() => {
    cancelRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setProgress(INITIAL_PROGRESS);
  }, []);

  return { start, cancel, retryShot, reset, progress };
}
