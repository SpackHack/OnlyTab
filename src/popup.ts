import { getDomains, getStats, setDomains } from "./storage";

async function add() {
  const input = document.getElementById("input") as HTMLInputElement;
  let url = input?.value!;

  let domains = await getDomains();

  domains.push(url);

  await setDomains(domains);

  addRow(url, 0);
}

function addRow(name: string, value: number) {
  const body = document.body;

  const title = document.createElement("p");
  title.id = name + "_name";
  title.textContent = `${name}: ${value} tabs closed`;
  body.appendChild(title);
  const button = document.createElement("button");
  button.textContent = "Remove";
  button.id = name + "_button";
  button.addEventListener("click", () => remove(name));
  body.appendChild(button);
}

function removeRow(domain: string) {
  document.getElementById(domain + "_name")?.remove();
  document.getElementById(domain + "_button")?.remove();
}

async function remove(domain: string) {
  let domains = await getDomains();

  await setDomains(domains.filter((entry) => entry !== domain));

  removeRow(domain);
}

async function loadStats() {
  let domains = await getDomains();

  let stats = await getStats();

  domains.forEach((domain) => {
    let hits = stats.domains.get(domain) ?? 0;

    addRow(domain, hits);
  });

  return true;
}

loadStats()
  .then()
  .catch((e) => console.error(e));

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("add");
  btn?.addEventListener("click", add);
});
