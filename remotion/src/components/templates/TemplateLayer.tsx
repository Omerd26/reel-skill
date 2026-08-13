/**
 * TemplateLayer — dispatcher for the video-format templates.
 *
 * Each format is one full-video composition (unlike overlays, which are
 * transient scenes). The orchestrator wraps this in the talking-head video
 * track; the template renders on top.
 *
 * Adding a new format = add a case here + extend `AnyTemplate` in types.ts.
 */
import React from "react";
import { BracketBattle } from "./BracketBattle";
import { TierRating } from "./TierRating";
import { DecisionCards } from "./DecisionCards";
import { TwinSplit } from "./TwinSplit";
import { FlagCompare } from "./FlagCompare";
import { FormatShowcase } from "./FormatShowcase";
import { ContentFunnel } from "./ContentFunnel";
import { ConceptCallouts } from "./ConceptCallouts";
import { CountdownTimer } from "./CountdownTimer";
import { BlurReveal } from "./BlurReveal";
import type { AnyTemplate } from "./types";

interface TemplateLayerProps {
  template: AnyTemplate;
  total_duration_sec: number;
}

export const TemplateLayer: React.FC<TemplateLayerProps> = ({
  template,
  total_duration_sec,
}) => {
  switch (template.type) {
    case "bracket_battle":
      return <BracketBattle template={template} total_duration_sec={total_duration_sec} />;
    case "tier_rating":
      return <TierRating template={template} total_duration_sec={total_duration_sec} />;
    case "decision_cards":
      return <DecisionCards template={template} total_duration_sec={total_duration_sec} />;
    case "twin_split":
      return <TwinSplit template={template} total_duration_sec={total_duration_sec} />;
    case "flag_compare":
      return <FlagCompare template={template} total_duration_sec={total_duration_sec} />;
    case "format_showcase":
      return <FormatShowcase template={template} total_duration_sec={total_duration_sec} />;
    case "content_funnel":
      return <ContentFunnel template={template} total_duration_sec={total_duration_sec} />;
    case "concept_callouts":
      return <ConceptCallouts template={template} total_duration_sec={total_duration_sec} />;
    case "countdown_timer":
      return <CountdownTimer template={template} total_duration_sec={total_duration_sec} />;
    case "blur_reveal":
      return <BlurReveal template={template} total_duration_sec={total_duration_sec} />;
    default: {
      const _exhaustive: never = template;
      return null;
    }
  }
};

export type { AnyTemplate } from "./types";
