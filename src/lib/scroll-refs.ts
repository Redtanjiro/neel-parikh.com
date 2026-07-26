export type HeroLayerKey =
  | "wall"
  | "lamp"
  | "kettle"
  | "fridge"
  | "table"
  | "chair"
  | "curtainsLeft"
  | "curtainsRight"
  | "window"
  | "figure";

export type SceneRefs = {
  heroStage: HTMLDivElement | null;
  heroLayers: Partial<Record<HeroLayerKey, HTMLDivElement | null>>;
  cone: HTMLDivElement | null;
  lines: (HTMLDivElement | null)[];
  burst: HTMLDivElement | null;
  workSection: HTMLElement | null;
};

export function createSceneRefs(): SceneRefs {
  return {
    heroStage: null,
    heroLayers: {},
    cone: null,
    lines: [null, null, null, null],
    burst: null,
    workSection: null,
  };
}
