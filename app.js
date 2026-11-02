// Sproutly — browser-only plant watering prototype.
(function () {
  "use strict";

  const DAY = 24 * 60 * 60 * 1000;
  const storage = {
    get: function (key, fallback) {
      try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
      } catch (error) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {}
    }
  };

  let plants = storage.get("sproutlyPlants", null);
  if (!plants) {
    plants = SAMPLE_PLANTS.map(function (plant) {
      return Object.assign({}, plant, {
        lastWatered: new Date(Date.now() - plant.lastWatered * DAY).toISOString()
      });
    });
    storage.set("sproutlyPlants", plants);
  }

  document.title = STARTUP.name;
  document.getElementById("today-label").textContent = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  const grid = document.getElementById("plant-grid");
  const searchBox = document.getElementById("search-box");
  const emptyMessage = document.getElementById("empty-message");
  const dialog = document.getElementById("add-dialog");
  const form = document.getElementById("plant-form");
  let currentFilter = "all";

  function showView() {
    const requested = (window.location.hash || "#plants").slice(1);
    const views = document.querySelectorAll("[data-view]");
    const exists = Array.prototype.some.call(views, function (view) { return view.id === requested; });
    const current = exists ? requested : "plants";
    views.forEach(function (view) { view.hidden = view.id !== current; });
    document.querySelectorAll("nav a").forEach(function (link) {
      link.toggleAttribute("aria-current", link.getAttribute("href") === "#" + current);
    });
    window.scrollTo(0, 0);
  }

  function daysSince(date) {
    return Math.floor((Date.now() - new Date(date).getTime()) / DAY);
  }

  function statusFor(plant) {
    const difference = daysSince(plant.lastWatered) - Number(plant.interval);
    return difference >= 0
      ? { due: true, text: difference === 0 ? "Due today" : difference + " day(s) overdue" }
      : { due: false, text: "Next in " + Math.abs(difference) + " day(s)" };
  }

  function makePlantCard(plant) {
    const status = statusFor(plant);
    const card = document.createElement("article");
    card.className = status.due ? "plant-card needs-water" : "plant-card on-track";

    const top = document.createElement("div");
    top.className = "plant-top";
    const statusBadge = document.createElement("span");
    statusBadge.className = status.due ? "status overdue" : "status";
    statusBadge.textContent = status.due ? "Needs water" : "On track";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-button";
    remove.textContent = "Remove";
    remove.addEventListener("click", function () {
      if (window.confirm("Remove " + plant.name + " from your plants?")) {
        plants = plants.filter(function (item) { return item.id !== plant.id; });
        storage.set("sproutlyPlants", plants);
        renderPlants();
      }
    });
    top.append(statusBadge, remove);

    const priority = document.createElement("span");
    priority.className = "priority " + plant.priority;
    priority.textContent = plant.priority.charAt(0).toUpperCase() + plant.priority.slice(1) + " priority";
    const name = document.createElement("h2");
    name.textContent = plant.name;
    const location = document.createElement("p");
    location.className = "location";
    location.textContent = plant.location;
    const schedule = document.createElement("p");
    schedule.className = "schedule";
    schedule.textContent = status.text + " · Every " + plant.interval + " days";

    const actions = document.createElement("div");
    actions.className = "plant-actions";
    const water = document.createElement("button");
    water.type = "button";
    water.className = status.due ? "water-button" : "water-button secondary-action";
    water.textContent = "Mark watered";
    water.addEventListener("click", function () {
      plant.lastWatered = new Date().toISOString();
      storage.set("sproutlyPlants", plants);
      renderPlants();
    });
    actions.append(water);

    card.append(top, priority, name, location, schedule, actions);
    return card;
  }

  function renderPlants() {
    const query = searchBox.value.trim().toLowerCase();
    const priorityRank = { high: 0, medium: 1, low: 2 };
    const matches = plants.filter(function (plant) {
      const status = statusFor(plant);
      const matchesFilter = currentFilter === "all" || (currentFilter === "due" ? status.due : !status.due);
      const text = (plant.name + " " + plant.location + " " + plant.priority).toLowerCase();
      return matchesFilter && text.indexOf(query) !== -1;
    }).sort(function (a, b) {
      const aStatus = statusFor(a).due ? 0 : 1;
      const bStatus = statusFor(b).due ? 0 : 1;
      return aStatus - bStatus || priorityRank[a.priority] - priorityRank[b.priority];
    });

    grid.replaceChildren.apply(grid, matches.map(makePlantCard));
    emptyMessage.hidden = matches.length > 0;
    document.getElementById("total-count").textContent = plants.length;
    document.getElementById("due-count").textContent = plants.filter(function (plant) { return statusFor(plant).due; }).length;
    document.getElementById("healthy-count").textContent = plants.filter(function (plant) { return !statusFor(plant).due; }).length;
  }

  function openDialog() {
    form.reset();
    form.elements.lastWatered.value = new Date().toISOString().slice(0, 10);
    dialog.showModal();
  }

  document.getElementById("open-add").addEventListener("click", openDialog);
  document.getElementById("open-add-header").addEventListener("click", openDialog);
  document.getElementById("close-add").addEventListener("click", function () { dialog.close(); });
  searchBox.addEventListener("input", renderPlants);
  window.addEventListener("hashchange", showView);

  document.querySelectorAll(".filter").forEach(function (button) {
    button.addEventListener("click", function () {
      currentFilter = button.dataset.filter;
      document.querySelectorAll(".filter").forEach(function (item) { item.classList.toggle("active", item === button); });
      renderPlants();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const data = new FormData(form);
    plants.push({
      id: Date.now().toString(),
      name: data.get("name").trim(),
      location: data.get("location").trim(),
      interval: Number(data.get("interval")),
      priority: data.get("priority"),
      lastWatered: new Date(data.get("lastWatered") + "T12:00:00").toISOString()
    });
    storage.set("sproutlyPlants", plants);
    dialog.close();
    renderPlants();
  });

  document.querySelector(".ad-close").addEventListener("click", function (event) { event.currentTarget.parentElement.remove(); });
  document.querySelector(".mock-payment").addEventListener("click", function () { window.alert("This is a mock upgrade. No payment has been taken."); });

  renderPlants();
  showView();
})();
