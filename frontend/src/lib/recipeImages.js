const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

const PLACEHOLDER_PUBLIC_ID =
  "din-dins/dev-user/recipes/urd26pd1caikm4qv5taq";

const IMAGE_TRANSFORMS = {
  card: "f_auto,q_auto,c_fill,g_auto,ar_4:3,w_720",
  detail: "f_auto,q_auto,c_limit,w_1200,h_1200",
};

function normalizeValue(value) {
  return String(value || "").trim();
}

function encodePublicId(publicId) {
  return publicId
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getCloudNameFromUrl(url) {
  const normalizedUrl = normalizeValue(url);
  if (!normalizedUrl) return "";

  try {
    const parsed = new URL(normalizedUrl);
    if (parsed.hostname !== "res.cloudinary.com") return "";

    const [cloudName, assetType, deliveryType] = parsed.pathname
      .split("/")
      .filter(Boolean);

    if (assetType !== "image" || deliveryType !== "upload") return "";

    return cloudName || "";
  } catch {
    return "";
  }
}

function buildCloudinaryUrl(publicId, transform, cloudName) {
  const normalizedPublicId = normalizeValue(publicId);
  const normalizedCloudName = normalizeValue(cloudName);

  if (!normalizedPublicId || !normalizedCloudName) return "";

  const encodedPublicId = encodePublicId(normalizedPublicId);
  const transformSegment = transform ? `${transform}/` : "";

  return `https://res.cloudinary.com/${normalizedCloudName}/image/upload/${transformSegment}${encodedPublicId}`;
}

function applyTransformToCloudinaryUrl(url, transform) {
  const normalizedUrl = normalizeValue(url);
  if (!normalizedUrl || !transform) return normalizedUrl;

  try {
    const parsed = new URL(normalizedUrl);
    const marker = "/image/upload/";
    const index = parsed.pathname.indexOf(marker);

    if (parsed.hostname !== "res.cloudinary.com" || index === -1) {
      return normalizedUrl;
    }

    const prefix = parsed.pathname.slice(0, index + marker.length);
    const suffix = parsed.pathname.slice(index + marker.length);
    parsed.pathname = `${prefix}${transform}/${suffix}`;

    return parsed.toString();
  } catch {
    return normalizedUrl;
  }
}

export function hasRecipeImage(recipe) {
  return Boolean(
    normalizeValue(recipe?.imagePublicId) || normalizeValue(recipe?.imageUrl),
  );
}

export function getRecipeImageUrl(recipe, variant = "detail") {
  const transform = IMAGE_TRANSFORMS[variant] || IMAGE_TRANSFORMS.detail;
  const cloudName =
    getCloudNameFromUrl(recipe?.imageUrl) || CLOUDINARY_CLOUD_NAME;
  const imagePublicId = normalizeValue(recipe?.imagePublicId);
  const imageUrl = normalizeValue(recipe?.imageUrl);

  if (imagePublicId) {
    return buildCloudinaryUrl(imagePublicId, transform, cloudName);
  }

  if (imageUrl) {
    return getCloudNameFromUrl(imageUrl)
      ? applyTransformToCloudinaryUrl(imageUrl, transform)
      : imageUrl;
  }

  return buildCloudinaryUrl(PLACEHOLDER_PUBLIC_ID, transform, cloudName);
}
