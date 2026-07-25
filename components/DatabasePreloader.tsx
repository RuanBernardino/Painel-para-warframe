"use client";
import { useEffect } from "react";
import { getDropsCache, saveDropsCache } from "@/lib/db";

export default function DatabasePreloader() {
  useEffect(() => {
    async function preload() {
      try {
        const cachedItems = await getDropsCache("wf_all_items");
        if (!cachedItems) {
          const res = await fetch("https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json");
          if (res.ok) {
            const data = await res.json();
            await saveDropsCache("wf_all_items", data);
          }
        }
      } catch (e) {
        console.error("Erro no preload automático do banco:", e);
      }
    }
    preload();
  }, []);

  return null;
}