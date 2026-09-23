/* Simple persistent image uploads for Bundle World. */
(() => {
  const input = document.getElementById("bundleFiles");
  const drop = document.getElementById("bundleDrop");
  const list = document.getElementById("bundleImageList");
  const status = document.getElementById("bundleUploadMessage");
  if (!input || !drop || !list) return;
  let images = [];
  let pending = 0;
  function render() {
    list.replaceChildren();
    images.forEach((url, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = url;
      image.alt = "Bundle preview " + (index + 1);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => { images.splice(index, 1); render(); });
      figure.append(image, remove);
      list.append(figure);
    });
  }
  async function resize(file) {
    if (file.size <= 900000) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    for (const quality of [0.83, 0.7, 0.55]) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= 900000) return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    }
    throw new Error(file.name + " is too large after resizing.");
  }
  async function add(files) {
    for (const file of files) {
      pending++;
      status.textContent = "Uploading " + file.name + "…";
      try {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use PNG, JPG or WebP images.");
        const form = new FormData();
        form.append("image", await resize(file));
        const response = await fetch("/api/admin/bundle-images", {
          method: "POST",
          headers: { Authorization: "Bearer " + (sessionStorage.getItem("saiShopAdminToken") || "") },
          body: form
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Image upload failed.");
        images.push(result.url);
        render();
        status.textContent = "Image uploaded.";
      } catch (error) { status.textContent = error.message; }
      finally { pending--; }
    }
    input.value = "";
  }
  input.addEventListener("change", () => add(Array.from(input.files)));
  drop.addEventListener("dragover", event => { event.preventDefault(); drop.classList.add("is-over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("is-over"));
  drop.addEventListener("drop", event => {
    event.preventDefault();
    drop.classList.remove("is-over");
    add(Array.from(event.dataTransfer.files));
  });
  window.bundleImages = {
    get: () => images.slice(),
    set: urls => { images = Array.isArray(urls) ? urls.slice() : []; render(); status.textContent = ""; },
    busy: () => pending > 0
  };
})();
