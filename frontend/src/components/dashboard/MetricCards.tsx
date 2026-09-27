import React from "react";
import { DocumentItem } from "@/types/api";
import { Files, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface MetricCardsProps {
  documents: DocumentItem[];
  total: number;
}

export function MetricCards({ documents, total }: MetricCardsProps) {
  const completedCount = documents.filter((d) => d.status === "completed").length;
  const processingCount = documents.filter((d) => d.status === "processing" || d.status === "pending" || d.status === "uploaded").length;
  const failedCount = documents.filter((d) => d.status === "failed").length;

  const cards = [
    {
      title: "Total Documents",
      value: total,
      label: "Indexed in system",
      icon: Files,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
    {
      title: "Processed & Ready",
      value: completedCount,
      label: "Text extracted",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Celery Active Queue",
      value: processingCount,
      label: "Running in background",
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Needs Attention",
      value: failedCount,
      label: "Failed or corrupted",
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`glass-panel p-5 rounded-2xl border ${card.borderColor} flex items-center justify-between transition-all hover:scale-[1.01]`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {card.title}
              </p>
              <h4 className="text-2xl font-bold text-white tracking-tight">{card.value}</h4>
              <p className="text-xs text-zinc-500 mt-0.5">{card.label}</p>
            </div>
            <div className={`h-11 w-11 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
