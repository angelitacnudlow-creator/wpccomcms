"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

export type HostingSpecs = {
  diskGb: number | null;
  bandwidthGb: number | null;
  mailboxes: number | null;
  databases: number | null;
  hostedDomains: number | null;
  featureBullets: string[];
};

export const emptyHostingSpecs: HostingSpecs = {
  diskGb: null,
  bandwidthGb: null,
  mailboxes: null,
  databases: null,
  hostedDomains: null,
  featureBullets: [],
};

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        value={value ?? ""}
        placeholder="Unlimited"
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </div>
  );
}

export function HostingSpecsEditor({
  value,
  onChange,
}: {
  value: HostingSpecs;
  onChange: (specs: HostingSpecs) => void;
}) {
  const [bulletDraft, setBulletDraft] = useState("");

  function addBullet() {
    const text = bulletDraft.trim();
    if (!text) return;
    onChange({ ...value, featureBullets: [...value.featureBullets, text] });
    setBulletDraft("");
  }

  return (
    <div className="space-y-4 rounded-lg border p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField
          id="disk-gb"
          label="Disk space (GB)"
          value={value.diskGb}
          onChange={(v) => onChange({ ...value, diskGb: v })}
        />
        <NumberField
          id="bandwidth-gb"
          label="Bandwidth (GB)"
          value={value.bandwidthGb}
          onChange={(v) => onChange({ ...value, bandwidthGb: v })}
        />
        <NumberField
          id="mailboxes"
          label="Mailboxes"
          value={value.mailboxes}
          onChange={(v) => onChange({ ...value, mailboxes: v })}
        />
        <NumberField
          id="databases"
          label="Databases"
          value={value.databases}
          onChange={(v) => onChange({ ...value, databases: v })}
        />
        <NumberField
          id="hosted-domains"
          label="Hosted domains"
          value={value.hostedDomains}
          onChange={(v) => onChange({ ...value, hostedDomains: v })}
        />
      </div>
      <p className="text-xs text-muted-foreground">Leave a field blank for &quot;Unlimited&quot;.</p>

      <div className="space-y-2">
        <Label>Feature list</Label>
        <div className="flex flex-wrap gap-2">
          {value.featureBullets.map((bullet, i) => (
            <span
              key={i}
              className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs"
            >
              {bullet}
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    featureBullets: value.featureBullets.filter((_, idx) => idx !== i),
                  })
                }
                aria-label={`Remove ${bullet}`}
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={bulletDraft}
            onChange={(e) => setBulletDraft(e.target.value)}
            placeholder="e.g. Free SSL Certificates"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addBullet();
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addBullet}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
