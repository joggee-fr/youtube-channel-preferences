import Preferences from '../preferences.js';

function showPreferences() {
  browser.storage.local.get().then((value) => {

    const tbody = document.querySelector("tbody");
    const template = document.querySelector("#channel_preference");

    for (const key in value) {
      const preferences = value[key];
      //new Preferences(value[key]);
      // console.log(value[key]);
      // console.log(key);
      // console.log(preferences);

      const clone = template.content.cloneNode(true);
      let td = clone.querySelectorAll("td");
      td[0].textContent = preferences.name;
      td[1].innerHTML = `<a href="https://www.youtube.com/${key}">${key}</a>`;
      //td[2].querySelector("select").value = preferences.quality;
      td[3].querySelector("input").value = preferences.quality;
      td[3].querySelector("input").addEventListener("input", e => {
        td[3].querySelector("label").textContent = Number(e.target.value).toFixed(2);
      });

      //td[3].querySelector("select").value = preferences.speed;

      tbody.appendChild(clone);
    }
  });
}

document.addEventListener('DOMContentLoaded', showPreferences);
