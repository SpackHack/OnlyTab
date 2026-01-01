import browser from "webextension-polyfill";

browser.storage.local.get("stats").then(({ stats }: any) => {
  let a = stats as Map<string, number>;

  const body = document.body;

  a.forEach((value, key) => {
    const title = document.createElement("h2");
    title.textContent = `${key}: ${value} tabs closed`;
    body.appendChild(title);
  });
});
