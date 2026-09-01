import browser from "webextension-polyfill";
import { getDomains, getStats, setDomains, setStats, Stats } from "./storage";

let domains: string[];

// Funny messages for when a tab is blocked
const funnyMessages: string[] = [
  "Nice try! 😏",
  "Not today! 🚫",
  "One is enough! 🎯",
  "Tab overload prevented! ⚡",
  "Focus mode activated! 🧘",
  "You have been saved from chaos! 🌪️",
  "Your future self thanks you! 🙏",
  "Tab hoarding is bad, mmkay? 🐿️",
  "The internet says NO! 💻",
  "One tab to rule them all! 👑",
  "Your browser is on a diet! 🥗",
  "Multitasking is overrated! ☕",
  "This domain has a one-tab policy! 📜",
  "Your RAM is safe now! 💾",
  "Tab closed by the Tab Police! 👮",
];

async function init() {
  domains = await getDomains();

  if (domains.length === 0) {
    domains = ["youtube.com"];
    await setDomains(domains);
  }

  return true;
}

/**
 * Gets a random funny message
 */
function getRandomFunnyMessage(): string {
  const index = Math.floor(Math.random() * funnyMessages.length);
  return funnyMessages[index];
}

/**
 * Extracts the domain from a URL, handling various formats
 * Returns the domain without protocol, path, port, or www prefix
 */
function extractDomain(url: string): string | null {
  try {
    // Remove protocol
    let urlWithoutProtocol = url.replace(/^https?:\/\//, '');
    
    // Get hostname (before first /, ?, or #)
    const hostname = urlWithoutProtocol.split(/[/?#]/)[0];
    
    if (!hostname) return null;
    
    // Remove port if present
    const domainWithPort = hostname.split(':')[0];
    
    // Remove www. prefix if present
    let domain = domainWithPort.toLowerCase();
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    return domain;
  } catch {
    return null;
  }
}

/**
 * Checks if a URL matches any of the configured domains
 * Uses exact domain matching (not substring matching)
 */
function matchesConfiguredDomain(url: string, configuredDomains: string[]): string | null {
  const urlDomain = extractDomain(url);
  if (!urlDomain) return null;

  // Check for exact match
  for (const domain of configuredDomains) {
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    
    // Exact match
    if (urlDomain === normalizedDomain) {
      return domain;
    }
    
    // Subdomain match (e.g., if configured domain is youtube.com, 
    // it should match video.youtube.com)
    if (urlDomain.endsWith('.' + normalizedDomain)) {
      return domain;
    }
  }
  
  return null;
}

/**
 * Gets the ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

async function checkDomains(
  tabId: number,
  changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
  tab: browser.Tabs.Tab,
) {
  const url = changeInfo.url;
  if (!url) {
    return false;
  }

  const currentDomain = matchesConfiguredDomain(url, domains);

  if (currentDomain === null) {
    return false;
  }

  let tabs = await browser.tabs.query({ url: createFilter([currentDomain]) });

  if (tabs.length > 1) {
    // Find the oldest tab (excluding the current one)
    const otherTabs = tabs.filter(t => t.id !== tabId);
    
    if (otherTabs.length > 0) {
      // Sort by last accessed or created time, get the oldest
      const oldestTab = otherTabs.reduce((oldest, current) => {
        const oldestTime = oldest.lastAccessed || oldest.created || 0;
        const currentTime = current.lastAccessed || current.created || 0;
        return currentTime < oldestTime ? current : oldest;
      });
      
      // Close the oldest tab, keep the newest one
      if (oldestTab.id) {
        await browser.tabs.remove(oldestTab.id);

        const closedTabs = await updateStats(currentDomain);
        const funnyMessage = getRandomFunnyMessage();
        
        // Replace the page content in the new tab with our message
        try {
          const ordinalSuffix = getOrdinalSuffix(closedTabs);
          
          await browser.tabs.executeScript(tabId, {
            code: `(
              function() {
                // Clear the entire page
                document.open();
                document.write('
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>OnlyTab - Duplicate Tab Blocked</title>
                    <style>
                      * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                      }
                      
                      body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        text-align: center;
                        padding: 20px;
                      }
                      
                      .container {
                        max-width: 500px;
                        animation: fadeIn 0.5s ease-out;
                      }
                      
                      @keyframes fadeIn {
                        from {
                          opacity: 0;
                          transform: scale(0.9);
                        }
                        to {
                          opacity: 1;
                          transform: scale(1);
                        }
                      }
                      
                      .icon {
                        font-size: 4rem;
                        margin-bottom: 20px;
                        text-shadow: 0 4px 10px rgba(0,0,0,0.2);
                      }
                      
                      h1 {
                        font-size: 2.5rem;
                        margin-bottom: 15px;
                        text-shadow: 0 2px 5px rgba(0,0,0,0.2);
                      }
                      
                      .message {
                        font-size: 1.2rem;
                        margin-bottom: 20px;
                        opacity: 0.95;
                      }
                      
                      .stats {
                        background: rgba(255, 255, 255, 0.15);
                        padding: 15px 25px;
                        border-radius: 10px;
                        font-size: 1rem;
                        backdrop-filter: blur(5px);
                      }
                      
                      .stats strong {
                        color: #ffd700;
                      }
                      
                      .info {
                        margin-top: 30px;
                        font-size: 0.9rem;
                        opacity: 0.8;
                        max-width: 400px;
                      }
                      
                      .btn {
                        margin-top: 30px;
                        padding: 12px 24px;
                        background: white;
                        color: #667eea;
                        border: none;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                      }
                      
                      .btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                      }
                      
                      .btn:active {
                        transform: translateY(0);
                      }
                    </style>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                  </head>
                  <body>
                    <div class="container">
                      <div class="icon">🚫</div>
                      <h1>OnlyTab</h1>
                      <div class="message">${funnyMessage}</div>
                      <div class="stats">
                        This is the <strong>${closedTabs}${ordinalSuffix}</strong> time you've tried to open multiple tabs for <strong>${currentDomain}</strong>
                      </div>
                      <p class="info">
                        You already have a tab open for this domain. OnlyTab keeps just one tab per domain to help you stay focused.
                      </p>
                      <button class="btn" onclick="history.back()">
                        <i class="fas fa-arrow-left"></i> Go Back
                      </button>
                    </div>
                  </body>
                  </html>
                ');
                document.close();
              }
            )()`,
          });
        } catch (error) {
          console.error('Failed to replace page content:', error);
        }
      }
    }
  }

  return true;
}

function createFilter(domains: string[]): string[] {
  let filter: string[] = [];

  domains.forEach((domain) => {
    // Remove www. if present
    const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
    // Match all subdomains
    filter.push(`*://*.${cleanDomain}/*`);
    filter.push(`*://${cleanDomain}/*`);
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
