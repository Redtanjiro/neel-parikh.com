export type HeroLayerKey = "wall" | "lamp";

export type SceneRefs = {
  heroStage: HTMLDivElement | null;
  heroLayers: Partial<Record<HeroLayerKey, HTMLDivElement | null>>;
  heroNameLeft: HTMLSpanElement | null;
  heroNameRight: HTMLSpanElement | null;
  heroGradient: HTMLDivElement | null;
  cone: HTMLDivElement | null;
  lines: (HTMLDivElement | null)[];
  burst: HTMLDivElement | null;
  workSection: HTMLElement | null;
};

export function createSceneRefs(): SceneRefs {
  return {
    heroStage: null,
    heroLayers: {},
    heroNameLeft: null,
    heroNameRight: null,
    heroGradient: null,
    cone: null,
    lines: [null, null, null, null],
    burst: null,
    workSection: null,
  };
}
