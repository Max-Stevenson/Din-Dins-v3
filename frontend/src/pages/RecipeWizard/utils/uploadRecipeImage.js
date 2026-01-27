export async function uploadRecipeImage(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/v1/uploads/recipe-image", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload image");
  }

  return res.json(); // { url, publicId, width, height }
}
