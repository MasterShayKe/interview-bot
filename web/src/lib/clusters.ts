import type { Cluster } from "./api.js";

export const CLUSTER_LABEL: Record<Cluster, string> = {
  ai: "AI Agents",
  trading: "Trading",
  community: "Community",
  web: "Web",
};

export const CLUSTER_DOT: Record<Cluster, string> = {
  ai: "bg-cluster-ai",
  trading: "bg-cluster-trading",
  community: "bg-cluster-community",
  web: "bg-cluster-web",
};

export const CLUSTER_TEXT: Record<Cluster, string> = {
  ai: "text-cluster-ai",
  trading: "text-cluster-trading",
  community: "text-cluster-community",
  web: "text-cluster-web",
};

export const CLUSTER_STRIPE: Record<Cluster, string> = {
  ai: "bg-cluster-ai",
  trading: "bg-cluster-trading",
  community: "bg-cluster-community",
  web: "bg-cluster-web",
};
