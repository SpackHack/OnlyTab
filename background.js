async function check_new_tab(tab) {

    if (!tab.title.includes("youtube")) {
        console.log("New tab is not youtube");
        return;
    }

    let tabs = await browser.tabs.query({});

    tabs.forEach(element => {

        if (element.id == tab.id) {
            return;
        }

        if (element.url.includes("youtube")) {
            console.log("Close new tab because a YouTube tab is already open");
            browser.tabs.remove(tab.id).then();

            browser.notifications.create({
                type: "basic",
                iconUrl: browser.runtime.getURL("icons/icon-48.png"),
                title: "OnlyTab",
                message: "Close new tab because a YouTube tab is already open"
            });
        }
    });
}

browser.tabs.onCreated.addListener(check_new_tab)
