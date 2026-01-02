import browser from "webextension-polyfill";
import { getDomains, getStats, setDomains, setStats, Stats } from "./storage";

let domains: string[];

async function init() {
  domains = await getDomains();

  if (domains.length === 0) {
    domains = ["youtube.com"];
    await setDomains(domains);
  }

  return true;
}

async function checkDomains(
  tabId: number,
  changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
  tab: browser.Tabs.Tab,
) {
  let currentDomain: string = "";

  for (const domain of domains) {
    if (changeInfo.url!.includes(domain)) {
      currentDomain = domain;
      break;
    }
  }

  if (currentDomain === "") {
    console.error("should not happen");
    return false;
  }

  let tabs = await browser.tabs.query({ url: createFilter([currentDomain]) });

  if (tabs.length > 1) {
    await browser.tabs.remove(tabId);

    let closedTabs = await updateStats(currentDomain);

    let notification: browser.Notifications.CreateNotificationOptions = {
      type: "basic",
      title: "OnlyTab did close a Tab",
      message: `Domain: ${currentDomain} for the ${closedTabs} time`,
    };

    browser.notifications.create(notification);
  }

  return true;
}

function createFilter(domains: string[]): string[] {
  let filter: string[] = [];

  domains.forEach((domain) => {
    filter.push(`*://*.${domain}/*`);
  });

  return filter;
}

async function updateStats(domain: string): Promise<number> {
  let stats: Stats = await getStats();

  if (stats === undefined) {
    stats = { domains: new Map() };
  }

  let count: number = stats.domains.get(domain) ?? 0;

  count += 1;

  stats.domains.set(domain, count);

  await setStats(stats);

  return count;
}

function storageUpdate(
  changes: Record<string, browser.Storage.StorageChange>,
  areaName: string,
) {
  if (areaName !== "local") {
    return;
  }

  if (changes["domains"] !== undefined) {
    // update var and tab on update listener
    domains = changes["domains"].newValue as string[];

    let urlFilter = createFilter(domains);

    browser.tabs.onUpdated.removeListener(checkDomains);
    browser.tabs.onUpdated.addListener(checkDomains, {
      urls: urlFilter,
      properties: ["url"],
    });
  }
}

init().then(() => {
  let urlFilter = createFilter(domains);

  browser.storage.onChanged.addListener(storageUpdate);

  browser.tabs.onUpdated.addListener(checkDomains, {
    urls: urlFilter,
    properties: ["url"],
  });
});
