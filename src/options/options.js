function showPreferences() {
  browser.storage.local.get().then((value) => {

    const tbody = document.querySelector("tbody");
    const template = document.querySelector("#channel_preference");

    for (const key in value) {
      const preferences = value[key];
      const clone = template.content.cloneNode(true);
      let td = clone.querySelectorAll("td");
      td[0].innerHTML = `<a href="https://www.youtube.com/${key}">${key}</a>`;
      td[1].textContent = preferences.name;
      td[2].textContent = preferences.quality;
      td[3].textContent = preferences.speed;
      tbody.appendChild(clone);
    }
  });
}

document.addEventListener('DOMContentLoaded', showPreferences);
