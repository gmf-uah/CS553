const API_BASE_URL = "http://localhost:3000";

async function loadItems() {
  setStatus("Loading items...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/items`);

    if (!response.ok) {
      throw new Error(`GET /api/items failed with status ${response.status}`);
    }

    const data = await response.json();
    renderItems(data.items);
    setStatus("Items loaded.");
  } catch (error) {
    setStatus(error.message);
  }
}

async function addItem(name) {
  setStatus("Adding item...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message ?? `POST /api/items failed with status ${response.status}`);
    }

    setStatus(`Added item: ${data.item.name}`);
    await loadItems();
  } catch (error) {
    setStatus(error.message);
  }
}

// loadButton.addEventListener("click", loadItems);

// form.addEventListener("submit", async (event) => {
//   event.preventDefault();

//   const name = itemNameInput.value.trim();
//   if (!name) {
//     setStatus("Item name is required.");
//     return;
//   }

//   itemNameInput.value = "";
//   await addItem(name);
// });
