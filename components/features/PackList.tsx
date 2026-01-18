import React from "react";
import { PackSummary } from "../../lib/types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface PackListProps {
  packs: PackSummary[];
  isLoading?: boolean;
  onOpen: (packId: string) => void;
  onDelete: (packId: string) => void;
  onRefresh: () => void;
}

export const PackList: React.FC<PackListProps> = ({
  packs,
  isLoading,
  onOpen,
  onDelete,
  onRefresh
}) => {
  const handleShare = (packId: string) => {
    if (typeof window === "undefined") return;
    window.open(`/pack/${packId}`, "_blank");
  };

  return (
    <Card variant="flat" className="w-full max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Saved Packs</h3>
          <p className="text-sm text-slate-400">
            Resume previous exam packs or share them with classmates.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {packs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
          {isLoading ? "Loading saved packs..." : "No saved packs yet. Generate one to see it here."}
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3"
            >
              <div className="min-w-[220px]">
                <div className="text-base font-semibold text-slate-100">
                  {pack.title}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(pack.createdAt).toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-slate-500 line-clamp-1">
                  {pack.input}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpen(pack.id)}
                >
                  Open
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(pack.id)}
                >
                  Share
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(pack.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
