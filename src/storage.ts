import browser from "webextension-polyfill";

export async function getStats(): Promise<Stats> {
  let { stats } = await browser.storage.local.get("stats");

  if (stats === undefined) {
    return { domains: new Map() };
  }

  return stats as Stats;
}

export async function setStats(config: Stats) {
  return browser.storage.local.set({ stats: config });
}

export interface Stats {
  domains: Map<string, number>;
}

export async function getDomains() {
  let { domains } = await browser.storage.local.get("domains");

  if (domains === undefined) {
    return [];
  }

  return domains as string[];
}

export async function setDomains(config: string[]) {
  return browser.storage.local.set({ domains: config });
}
