import browser from "webextension-polyfill";

let domains: string[];

async function init() {
  let { urls } = await browser.storage.local.get("urls");

  console.log(urls);

  if (urls === undefined) {
    domains = ["youtube.com"];
    await browser.storage.local.set({ urls: domains });
  } else {
    domains = urls as string[];
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

type a = {
  domains: [];
};

async function updateStats(domain: string): Promise<number> {
  let { stats } = await browser.storage.local.get("stats");

  let statsMap;

  if (stats === undefined) {
    statsMap = new Map();
  } else {
    statsMap = stats as Map<string, number>;
  }

  let count: number = statsMap.get(domain) ?? 0;

  count += 1;

  statsMap.set(domain, count);

  await browser.storage.local.set({ stats: statsMap });

  return count;
}

init().then(() => {
  let urlFilter = createFilter(domains);

  browser.tabs.onUpdated.addListener(checkDomains, {
    urls: urlFilter,
    properties: ["url"],
  });
});
