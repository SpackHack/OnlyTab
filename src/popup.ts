import { getDomains, getStats, setDomains } from "./storage";

async function add() {
  const input = document.getElementById("input") as HTMLInputElement;
  let url = input?.value?.trim();

  if (!url) {
    animateShake(input);
    return;
  }

  // Remove protocol if present
  url = url.replace(/^https?:\/\//, '');
  // Remove path if present
  url = url.split('/')[0];
  // Remove port if present
  url = url.split(':')[0];

  let domains = await getDomains();

  // Check if domain already exists
  if (domains.includes(url)) {
    animateShake(input);
    return;
  }

  domains.push(url);

  await setDomains(domains);

  addRow(url, 0);
  input.value = '';
  updateStatsSummary();
}

function animateShake(element: HTMLElement) {
  element.classList.add('shake');
  setTimeout(() => {
    element.classList.remove('shake');
  }, 500);
}

function addRow(name: string, value: number) {
  const domainList = document.getElementById("domainList");

  const domainItem = document.createElement("div");
  domainItem.className = "domain-item";
  domainItem.id = `domain_${name}`;

  const domainInfo = document.createElement("div");
  domainInfo.className = "domain-info";

  const domainName = document.createElement("div");
  domainName.className = "domain-name";
  domainName.textContent = name;

  const domainCount = document.createElement("div");
  domainCount.className = "domain-count";
  domainCount.id = `${name}_count`;
  domainCount.textContent = `${value} tabs closed`;

  domainInfo.appendChild(domainName);
  domainInfo.appendChild(domainCount);

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.title = "Remove";
  removeBtn.addEventListener("click", () => remove(name));

  domainItem.appendChild(domainInfo);
  domainItem.appendChild(removeBtn);

  domainList?.appendChild(domainItem);
}

function removeRow(domain: string) {
  const domainItem = document.getElementById(`domain_${domain}`);
  if (domainItem) {
    domainItem.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => {
      domainItem?.remove();
    }, 300);
  }
}

async function remove(domain: string) {
  let domains = await getDomains();

  await setDomains(domains.filter((entry) => entry !== domain));

  removeRow(domain);
  updateStatsSummary();
}

async function loadStats() {
  let domains = await getDomains();

  let stats = await getStats();

  if (domains.length === 0) {
    const domainList = document.getElementById("domainList");
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <i class="fas fa-inbox"></i>
      <p>No domains added yet</p>
      <p style="font-size: 0.75rem; margin-top: 8px;">Add a domain to start tracking</p>
    `;
    domainList?.appendChild(emptyState);
  } else {
    domains.forEach((domain) => {
      let hits = stats.domains.get(domain) ?? 0;

      addRow(domain, hits);
    });
  }

  updateStatsSummary();

  return true;
}

function updateStatsSummary() {
  const statsSummary = document.getElementById("statsSummary");
  const domainList = document.getElementById("domainList");
  
  if (!statsSummary || !domainList) return;

  const domains = domainList.querySelectorAll('.domain-item');
  
  if (domains.length === 0) {
    statsSummary.style.display = 'none';
    return;
  }

  const totalTabs = Array.from(domains).reduce((sum, domain) => {
    const countText = domain.querySelector('.domain-count')?.textContent || '0 tabs closed';
    const count = parseInt(countText) || 0;
    return sum + count;
  }, 0);

  statsSummary.style.display = 'block';
  statsSummary.innerHTML = `
    <i class="fas fa-chart-bar"></i> 
    ${domains.length} domain(s) | ${totalTabs} total tabs closed
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("add");
  btn?.addEventListener("click", add);

  const input = document.getElementById("input") as HTMLInputElement;
  input?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      add();
    }
  });
});

// Add shake animation for error feedback
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
  }
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(20px);
    }
  }
  .shake {
    animation: shake 0.5s ease-in-out;
  }
`;
document.head.appendChild(style);

loadStats()
  .then()
  .catch((e) => console.error(e));
