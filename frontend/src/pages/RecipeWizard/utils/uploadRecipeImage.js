export async function uploadRecipeImage(api, file) {
  const res = await api.uploads.uploadRecipeImage(file);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload image");
  }

  return res.json(); // { url, publicId, width, height }
}
