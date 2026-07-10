import React, { useCallback, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Collapse,
    Container,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CollectionsRounded,
    ContentCopyRounded,
    DownloadRounded,
    HomeRounded,
    ImageSearchRounded,
    OpenInNewRounded,
    PhotoLibraryRounded,
    RestartAltRounded,
    SearchRounded,
    VisibilityRounded,
} from "@mui/icons-material";

const ARCHIVE_SEARCH_BATCH_SIZE = 72;
const MAX_METADATA_LOOKUPS = 28;
const MIN_IMAGE_BYTES = 2 * 1024;
const IMAGE_SITE_PRODUCTION_ORIGIN = "https://imagemasterlab.com";
const SCRAPEWEBSITE_ARCHIVE_PROXY_ENDPOINT =
    "https://scrapewebsite.pages.dev/api/archiveproxy";

const IMAGE_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".tif",
    ".tiff",
    ".jp2",
];

const BROWSER_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];

const IMAGE_FORMAT_TERMS = [
    "jpeg",
    "jpg",
    "png",
    "webp",
    "gif",
    "bitmap",
    "tiff",
    "jp2",
    "image",
];

const BLOCKED_IMAGE_FILE_TERMS = [
    "_files.xml",
    "_meta.xml",
    "_reviews.xml",
    "_djvu",
    "_abbyy",
    "_scandata",
    "_text",
    "_jp2.zip",
    "_images.zip",
    ".torrent",
    "metadata",
    "license",
    "checksum",
    "sqlite",
];

const THUMBNAIL_TERMS = [
    "__ia_thumb",
    "_thumb",
    "thumbs",
    "thumbnail",
    "tile",
    "preview",
    "small",
];

const IMAGE_COLLECTIONS = [
    {
        id: "image",
        label: "All Images",
        description: "Archive.org's top-level image mediatype.",
    },
    {
        id: "opensource_image",
        label: "Community Images",
        description: "Public uploads, scans, posters, artwork, and photo sets.",
    },
    {
        id: "flickrcommons",
        label: "Flickr Commons",
        description: "Historic public photo collections imported from Flickr Commons.",
    },
    {
        id: "brooklynmuseum",
        label: "Brooklyn Museum",
        description: "Museum collection imagery and object photography.",
    },
    {
        id: "metropolitanmuseumofart-galleryimages",
        label: "Met Museum",
        description: "Gallery and collection images from The Met uploads.",
    },
    {
        id: "coverartarchive",
        label: "Cover Art",
        description: "Album and release artwork from public music metadata collections.",
    },
    {
        id: "maps_usgs",
        label: "Maps",
        description: "USGS and historic map scans with high-resolution imagery.",
    },
    {
        id: "nasa",
        label: "NASA",
        description: "Space, science, mission, and public domain NASA imagery.",
    },
];

const DEFAULT_COLLECTIONS = ["image", "opensource_image", "flickrcommons"];

const SEARCH_FIELDS =
    "identifier,title,creator,collection,date,downloads,description,subject,item_size";

const pageSx = {
    minHeight: "100vh",
    color: "#f4f8ff",
    background:
        "radial-gradient(circle at 18% 8%, rgba(82,215,255,0.18), transparent 32%), radial-gradient(circle at 88% 0%, rgba(124,92,255,0.16), transparent 30%), #07090f",
};

const cardSx = {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 2,
    background: "rgba(14,17,24,0.82)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
    backdropFilter: "blur(18px)",
};

const softCardSx = {
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 2,
    background: "rgba(255,255,255,0.045)",
};

const primaryButtonSx = {
    borderRadius: 999,
    px: 2.5,
    fontWeight: 900,
    color: "#06111d",
    background: "linear-gradient(135deg, #52d7ff, #9a84ff)",
    "&:hover": {
        background: "linear-gradient(135deg, #86e4ff, #b4a4ff)",
    },
};

function getString(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(", ");
    return value ? String(value) : "";
}

function getFileNameExtension(name) {
    const clean = String(name || "").split("?")[0].split("#")[0].toLowerCase();
    const dot = clean.lastIndexOf(".");
    return dot >= 0 ? clean.slice(dot) : "";
}

function formatCount(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "0";
    return new Intl.NumberFormat("en", { notation: "compact" }).format(number);
}

function formatBytes(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unit = 0;

    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
    }

    return `${size >= 10 || unit === 0 ? Math.round(size) : size.toFixed(1)} ${units[unit]}`;
}

function sanitizeSolrPhrase(value) {
    return String(value || "")
        .replace(/[\\"]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function quoteSolr(value) {
    return `"${sanitizeSolrPhrase(value)}"`;
}

function tokenizeQuery(value) {
    return sanitizeSolrPhrase(value)
        .split(/\s+/)
        .map((part) => part.trim())
        .filter((part) => part.length > 1)
        .slice(0, 8);
}

function buildArchiveSearchQuery(searchTerm, collectionIds) {
    const collections = (collectionIds || []).length ? collectionIds : DEFAULT_COLLECTIONS;
    const collectionQuery = collections.map((id) => `collection:${quoteSolr(id)}`).join(" OR ");
    const trimmed = sanitizeSolrPhrase(searchTerm);

    if (!trimmed) {
        return `mediatype:image AND (${collectionQuery})`;
    }

    const exact = quoteSolr(trimmed);
    const tokens = tokenizeQuery(trimmed);
    const tokenQuery = tokens.length
        ? tokens
            .map((token) => {
                const safe = quoteSolr(token);
                return `(title:${safe} OR creator:${safe} OR subject:${safe} OR description:${safe} OR identifier:${safe})`;
            })
            .join(" AND ")
        : "";

    return [
        "mediatype:image",
        `(${collectionQuery})`,
        `((title:${exact} OR creator:${exact} OR subject:${exact} OR description:${exact} OR identifier:${exact})${
            tokenQuery ? ` OR (${tokenQuery})` : ""
        })`,
    ].join(" AND ");
}

function buildArchiveAdvancedSearchUrl(searchTerm, collectionIds, page) {
    const params = new URLSearchParams({
        q: buildArchiveSearchQuery(searchTerm, collectionIds),
        fl: SEARCH_FIELDS,
        rows: String(ARCHIVE_SEARCH_BATCH_SIZE),
        page: String(page),
        output: "json",
        sort: "downloads desc",
    });

    return `https://archive.org/advancedsearch.php?${params.toString()}`;
}

function buildArchiveMetadataUrl(identifier) {
    return `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
}

function buildArchiveProxyUrlCandidates(targetUrl) {
    return [buildExternalArchiveProxyUrl(targetUrl)];
}

function buildExternalArchiveProxyUrl(targetUrl) {
    const proxyUrl = new URL(SCRAPEWEBSITE_ARCHIVE_PROXY_ENDPOINT);
    proxyUrl.searchParams.set("url", targetUrl);
    proxyUrl.searchParams.set("site", "imagemasterlab");
    proxyUrl.searchParams.set("site_origin", IMAGE_SITE_PRODUCTION_ORIGIN);
    return proxyUrl.toString();
}

async function fetchArchiveJson(targetUrl, signal) {
    const errors = [];

    for (const candidate of buildArchiveProxyUrlCandidates(targetUrl)) {
        try {
            const response = await fetch(candidate, {
                method: "GET",
                signal,
                headers: { Accept: "application/json" },
                credentials: "omit",
            });

            if (!response.ok) {
                errors.push(`${response.status} ${response.statusText || "ScrapeWebsite Archive proxy error"}`);
                continue;
            }

            const contentType = response.headers.get("Content-Type") || "";
            const text = await response.text();

            try {
                return JSON.parse(text);
            } catch {
                errors.push(`Proxy returned ${contentType || "non-JSON"} instead of Archive JSON.`);
            }
        } catch (error) {
            if (error?.name === "AbortError") throw error;
            errors.push(error?.message || "ScrapeWebsite Archive proxy JSON request failed.");
        }
    }

    throw new Error(
        errors.filter(Boolean).join(" | ") ||
        "ScrapeWebsite Archive proxy request failed. Make sure the endpoint allows localhost during development and https://imagemasterlab.com in production."
    );
}

function isAllowedIaHost(hostname) {
    return /^ia\d+\.us\.archive\.org$/i.test(String(hostname || ""));
}

function encodeArchivePathPart(part) {
    return String(part || "")
        .split("/")
        .filter(Boolean)
        .map((piece) => encodeURIComponent(piece))
        .join("/");
}

function normalizeMetadataDir(identifier, dir) {
    const fallback = `/items/${identifier}`;
    const value = String(dir || "").trim();
    if (!value) return fallback;
    if (value.includes("/items/")) return value;
    return fallback;
}

function buildArchiveFileUrl(identifier, fileName, mode = "download") {
    return `https://archive.org/${mode}/${encodeURIComponent(identifier)}/${encodeArchivePathPart(fileName)}`;
}

function buildIaFileUrl(hostname, identifier, fileName, dir) {
    if (!isAllowedIaHost(hostname)) return "";
    const root = normalizeMetadataDir(identifier, dir).replace(/\/+$/, "");
    return `https://${hostname}${root}/${encodeArchivePathPart(fileName)}`;
}

function getArchiveDetailsUrl(identifier) {
    return `https://archive.org/details/${encodeURIComponent(identifier)}`;
}

function getArchiveServiceImageUrl(identifier) {
    return `https://archive.org/services/img/${encodeURIComponent(identifier)}`;
}

function getItemServerHosts(metadata) {
    return [metadata?.server, metadata?.d1, metadata?.d2]
        .map((host) => String(host || "").toLowerCase())
        .filter((host, index, all) => host && all.indexOf(host) === index && isAllowedIaHost(host));
}

function isThumbnailName(name) {
    const lowerName = String(name || "").toLowerCase();
    return THUMBNAIL_TERMS.some((term) => lowerName.includes(term));
}

function isImageFile(file, includeThumbnails) {
    const name = String(file?.name || "");
    const lowerName = name.toLowerCase();
    const extension = getFileNameExtension(name);
    const format = String(file?.format || "").toLowerCase();
    const size = Number(file?.size || 0);

    if (!name) return false;
    if (BLOCKED_IMAGE_FILE_TERMS.some((term) => lowerName.includes(term))) return false;
    if (!includeThumbnails && isThumbnailName(name)) return false;
    if (size > 0 && size < MIN_IMAGE_BYTES) return false;

    return (
        IMAGE_EXTENSIONS.includes(extension) ||
        IMAGE_FORMAT_TERMS.some((term) => format.includes(term))
    );
}

function getImageScore(file, includeThumbnails) {
    const name = String(file?.name || "").toLowerCase();
    const extension = getFileNameExtension(name);
    const format = String(file?.format || "").toLowerCase();
    const size = Number(file?.size || 0);
    let score = size ? Math.min(80, Math.log10(size) * 12) : 0;

    if (BROWSER_IMAGE_EXTENSIONS.includes(extension)) score += 90;
    if (extension === ".jpg" || extension === ".jpeg") score += 45;
    if (extension === ".png") score += 38;
    if (extension === ".webp") score += 35;
    if (extension === ".jp2" || extension === ".tif" || extension === ".tiff") score += 10;
    if (format.includes("jpeg")) score += 36;
    if (format.includes("png")) score += 30;
    if (format.includes("item image")) score += 25;
    if (name.includes("cover")) score += 20;
    if (name.includes("poster")) score += 18;
    if (name.includes("front")) score += 14;
    if (isThumbnailName(name)) score += includeThumbnails ? 8 : -120;
    if (name.includes("_itemimage")) score += 28;

    return score;
}

function getImageSourceTargets(identifier, file, metadata) {
    const fileName = file?.name || "";
    const urls = [
        buildArchiveFileUrl(identifier, fileName, "download"),
        buildArchiveFileUrl(identifier, fileName, "serve"),
        ...getItemServerHosts(metadata).map((host) =>
            buildIaFileUrl(host, identifier, fileName, metadata?.dir)
        ),
    ].filter(Boolean);

    return urls.filter((url, index, all) => all.indexOf(url) === index);
}

function getImageCandidates(identifier, file, metadata) {
    const directTargets = getImageSourceTargets(identifier, file, metadata);
    const serviceImage = getArchiveServiceImageUrl(identifier);
    const allTargets = [...directTargets, serviceImage].filter(Boolean);

    return allTargets
        .map((targetUrl) => buildExternalArchiveProxyUrl(targetUrl))
        .filter((url, index, all) => all.indexOf(url) === index);
}

function getBestImageFile(files = [], includeThumbnails = false) {
    return files
        .filter((file) => isImageFile(file, includeThumbnails))
        .sort((a, b) => getImageScore(b, includeThumbnails) - getImageScore(a, includeThumbnails))[0];
}

function normalizeArchiveDoc(doc, metadata, includeThumbnails) {
    const identifier = doc?.identifier || metadata?.metadata?.identifier || "";
    const files = Array.isArray(metadata?.files) ? metadata.files : [];
    const bestFile = getBestImageFile(files, includeThumbnails);
    const serviceImage = getArchiveServiceImageUrl(identifier);
    const sourceTargets = bestFile ? getImageSourceTargets(identifier, bestFile, metadata) : [];
    const imageCandidates = bestFile
        ? getImageCandidates(identifier, bestFile, metadata)
        : [buildExternalArchiveProxyUrl(serviceImage)];
    const originalSourceUrl = sourceTargets[0] || serviceImage;

    return {
        id: identifier,
        identifier,
        title: getString(doc?.title || metadata?.metadata?.title || identifier),
        creator: getString(doc?.creator || metadata?.metadata?.creator),
        date: getString(doc?.date || metadata?.metadata?.date),
        description: getString(doc?.description || metadata?.metadata?.description),
        subject: getString(doc?.subject || metadata?.metadata?.subject),
        collection: Array.isArray(doc?.collection) ? doc.collection : [doc?.collection].filter(Boolean),
        downloads: Number(doc?.downloads || metadata?.item_last_updated || 0),
        itemSize: Number(doc?.item_size || metadata?.item_size || 0),
        fileName: bestFile?.name || "",
        fileFormat: bestFile?.format || "",
        fileSize: Number(bestFile?.size || 0),
        imageUrl: imageCandidates[0] || buildExternalArchiveProxyUrl(serviceImage),
        imageCandidates,
        sourceUrl: buildExternalArchiveProxyUrl(originalSourceUrl),
        originalSourceUrl,
        detailsUrl: getArchiveDetailsUrl(identifier),
        allImageCount: files.filter((file) => isImageFile(file, true)).length,
    };
}

function getReadableError(error) {
    if (error?.name === "AbortError") return "";
    return error?.message || "Archive image search failed.";
}

async function copyText(value) {
    if (!value) return;

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
}

function ArchiveImage({ item, alt, sx, onClick }) {
    const [candidateIndex, setCandidateIndex] = useState(0);
    const candidates = item?.imageCandidates?.length ? item.imageCandidates : [item?.imageUrl].filter(Boolean);
    const src = candidates[Math.min(candidateIndex, candidates.length - 1)] || "";

    return (
        <Box
            component="img"
            src={src}
            alt={alt || item?.title || "Archive image"}
            loading="lazy"
            onClick={onClick}
            onError={() => {
                setCandidateIndex((current) => {
                    if (current >= candidates.length - 1) return current;
                    return current + 1;
                });
            }}
            sx={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                background: "rgba(255,255,255,0.04)",
                cursor: onClick ? "zoom-in" : "default",
                ...sx,
            }}
        />
    );
}

export default function ArchiveImages() {
    const [query, setQuery] = useState("");
    const [collections, setCollections] = useState(DEFAULT_COLLECTIONS);
    const [includeThumbnails, setIncludeThumbnails] = useState(false);
    const [results, setResults] = useState([]);
    const [page, setPage] = useState(1);
    const [totalFound, setTotalFound] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [showCollections, setShowCollections] = useState(true);
    const abortRef = useRef(null);

    const canLoadMore = results.length > 0 && results.length < totalFound && !loading && !loadingMore;

    const selectedCollectionLabels = useMemo(() => {
        return IMAGE_COLLECTIONS.filter((collection) => collections.includes(collection.id)).map(
            (collection) => collection.label
        );
    }, [collections]);

    const stopCurrentRequest = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    }, []);

    const toggleCollection = useCallback((id) => {
        setCollections((current) => {
            if (current.includes(id)) {
                const next = current.filter((item) => item !== id);
                return next.length ? next : current;
            }
            return [...current, id];
        });
    }, []);

    const loadArchiveImages = useCallback(
        async ({ nextPage = 1, append = false } = {}) => {
            stopCurrentRequest();

            const controller = new AbortController();
            abortRef.current = controller;
            setError("");
            setCopied("");
            setStatus(
                nextPage === 1
                    ? "Searching Archive image collections..."
                    : `Loading Archive image page ${nextPage}...`
            );

            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
                setResults([]);
                setTotalFound(0);
            }

            try {
                const searchUrl = buildArchiveAdvancedSearchUrl(query, collections, nextPage);
                const searchJson = await fetchArchiveJson(searchUrl, controller.signal);
                const docs = Array.isArray(searchJson?.response?.docs) ? searchJson.response.docs : [];
                const total = Number(searchJson?.response?.numFound || 0);
                const lookupDocs = docs.slice(0, MAX_METADATA_LOOKUPS);

                setTotalFound(total);
                setStatus(`Found ${formatCount(total)} matching Archive image items. Reading image files...`);

                const settled = await Promise.allSettled(
                    lookupDocs.map(async (doc) => {
                        const metadata = await fetchArchiveJson(
                            buildArchiveMetadataUrl(doc.identifier),
                            controller.signal
                        );
                        return normalizeArchiveDoc(doc, metadata, includeThumbnails);
                    })
                );

                const nextResults = settled
                    .filter((entry) => entry.status === "fulfilled" && entry.value?.identifier)
                    .map((entry) => entry.value);

                setResults((current) => {
                    const merged = append ? [...current, ...nextResults] : nextResults;
                    const seen = new Set();
                    return merged.filter((item) => {
                        if (seen.has(item.identifier)) return false;
                        seen.add(item.identifier);
                        return true;
                    });
                });

                setPage(nextPage);
                setStatus(
                    nextResults.length
                        ? `Loaded ${nextResults.length} image-ready items from this page.`
                        : "Archive returned items, but no browser-ready image files were found on this page."
                );
            } catch (requestError) {
                const message = getReadableError(requestError);
                if (message) {
                    setError(message);
                    setStatus("");
                }
            } finally {
                if (abortRef.current === controller) {
                    abortRef.current = null;
                }
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [collections, includeThumbnails, query, stopCurrentRequest]
    );

    const handleSubmit = useCallback(
        (event) => {
            event.preventDefault();
            loadArchiveImages({ nextPage: 1, append: false });
        },
        [loadArchiveImages]
    );

    const handleReset = useCallback(() => {
        stopCurrentRequest();
        setQuery("");
        setCollections(DEFAULT_COLLECTIONS);
        setIncludeThumbnails(false);
        setResults([]);
        setPage(1);
        setTotalFound(0);
        setStatus("");
        setError("");
        setCopied("");
        setSelectedImage(null);
    }, [stopCurrentRequest]);

    const handleCopy = useCallback(async (value, label) => {
        await copyText(value);
        setCopied(label);
        window.setTimeout(() => setCopied(""), 1800);
    }, []);

    const handleDownload = useCallback((item) => {
        const url = item?.sourceUrl || item?.imageUrl;
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
    }, []);

    return (
        <Box sx={pageSx}>
            <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
                <Stack spacing={3}>
                    <Paper sx={{ ...cardSx, overflow: "hidden" }}>
                        <Box sx={{ p: { xs: 2, md: 3 } }}>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={2}
                                alignItems={{ xs: "stretch", md: "center" }}
                                justifyContent="space-between"
                            >
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                        <Chip
                                            icon={<PhotoLibraryRounded />}
                                            label="Archive Image Finder"
                                            sx={{
                                                width: "fit-content",
                                                color: "#07111f",
                                                fontWeight: 900,
                                                background: "linear-gradient(135deg, #52d7ff, #9a84ff)",
                                            }}
                                        />
                                        <Chip
                                            label={`${selectedCollectionLabels.length} collections`}
                                            variant="outlined"
                                            sx={{ color: "#dfeaff", borderColor: "rgba(255,255,255,0.18)" }}
                                        />
                                    </Stack>

                                    <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: 0 }}>
                                        Find public images from Internet Archive
                                    </Typography>

                                    <Typography sx={{ color: alpha("#f4f8ff", 0.74), maxWidth: 860 }}>
                                        Search Archive.org image collections, read item metadata through the
                                        ScrapeWebsite archive proxy, pick the best image file, and open or copy
                                        the proxied image source.
                                    </Typography>
                                </Stack>

                                <Button
                                    component={RouterLink}
                                    to="/"
                                    startIcon={<HomeRounded />}
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 999,
                                        color: "#dff7ff",
                                        borderColor: "rgba(255,255,255,0.18)",
                                        width: { xs: "100%", md: "auto" },
                                    }}
                                >
                                    Home
                                </Button>
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                        <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, md: 3 } }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={7}>
                                    <TextField
                                        fullWidth
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search photos, posters, scans, artwork, maps, NASA, album covers..."
                                        label="Archive image search"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                                        <Button
                                            type="submit"
                                            startIcon={loading ? <CircularProgress size={18} /> : <SearchRounded />}
                                            disabled={loading || loadingMore}
                                            sx={{ ...primaryButtonSx, flex: 1 }}
                                        >
                                            Search Images
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleReset}
                                            startIcon={<RestartAltRounded />}
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 999,
                                                color: "#dff7ff",
                                                borderColor: "rgba(255,255,255,0.18)",
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>

                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={1.25}
                                alignItems={{ xs: "stretch", md: "center" }}
                                justifyContent="space-between"
                                sx={{ mt: 2 }}
                            >
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={includeThumbnails}
                                                onChange={(event) => setIncludeThumbnails(event.target.checked)}
                                            />
                                        }
                                        label="Include thumbnails and previews"
                                    />
                                </Stack>

                                <Button
                                    type="button"
                                    onClick={() => setShowCollections((value) => !value)}
                                    startIcon={<CollectionsRounded />}
                                    variant="text"
                                    sx={{ color: "#9ee8ff", justifyContent: { xs: "flex-start", md: "center" } }}
                                >
                                    {showCollections ? "Hide collections" : "Choose collections"}
                                </Button>
                            </Stack>

                            <Collapse in={showCollections}>
                                <Grid container spacing={1.25} sx={{ mt: 1 }}>
                                    {IMAGE_COLLECTIONS.map((collection) => {
                                        const selected = collections.includes(collection.id);
                                        return (
                                            <Grid item xs={12} sm={6} md={3} key={collection.id}>
                                                <Paper
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => toggleCollection(collection.id)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter" || event.key === " ") {
                                                            event.preventDefault();
                                                            toggleCollection(collection.id);
                                                        }
                                                    }}
                                                    sx={{
                                                        ...softCardSx,
                                                        p: 1.5,
                                                        minHeight: 116,
                                                        cursor: "pointer",
                                                        borderColor: selected ? "rgba(82,215,255,0.6)" : "rgba(255,255,255,0.09)",
                                                        background: selected
                                                            ? "linear-gradient(135deg, rgba(82,215,255,0.16), rgba(124,92,255,0.12))"
                                                            : softCardSx.background,
                                                    }}
                                                >
                                                    <Stack spacing={0.75}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Checkbox checked={selected} sx={{ p: 0 }} />
                                                            <Typography sx={{ fontWeight: 900 }}>{collection.label}</Typography>
                                                        </Stack>
                                                        <Typography variant="body2" sx={{ color: alpha("#f4f8ff", 0.68) }}>
                                                            {collection.description}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Collapse>
                        </Box>

                        {(loading || loadingMore) && <LinearProgress />}
                    </Paper>

                    {error && (
                        <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {status && (
                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                            {status}
                        </Alert>
                    )}

                    {copied && (
                        <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>
                            Copied {copied}.
                        </Alert>
                    )}

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                        <Chip
                            icon={<ImageSearchRounded />}
                            label={`${results.length} loaded${totalFound ? ` of ${formatCount(totalFound)} found` : ""}`}
                            sx={{ width: "fit-content", fontWeight: 800 }}
                        />
                        <Typography variant="body2" sx={{ color: alpha("#f4f8ff", 0.64) }}>
                            Images come from Archive metadata files when available, then fall back to the Archive
                            services image endpoint. Every request is routed through ScrapeWebsite.
                        </Typography>
                    </Stack>

                    {!results.length && !loading ? (
                        <Paper sx={{ ...cardSx, p: { xs: 2, md: 4 }, textAlign: "center" }}>
                            <Stack spacing={1.5} alignItems="center">
                                <PhotoLibraryRounded sx={{ fontSize: 54, color: "#52d7ff" }} />
                                <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                    Search for Archive images
                                </Typography>
                                <Typography sx={{ color: alpha("#f4f8ff", 0.7), maxWidth: 680 }}>
                                    Try searches like "NASA moon", "vintage poster", "public domain art",
                                    "album cover", "map scan", or leave the box blank to browse popular image items.
                                </Typography>
                            </Stack>
                        </Paper>
                    ) : (
                        <Grid container spacing={2}>
                            {results.map((item) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={item.identifier}>
                                    <Card sx={{ ...cardSx, height: "100%", overflow: "hidden" }}>
                                        <Box
                                            sx={{
                                                height: 230,
                                                position: "relative",
                                                background:
                                                    "linear-gradient(135deg, rgba(82,215,255,0.1), rgba(124,92,255,0.1))",
                                            }}
                                        >
                                            <ArchiveImage
                                                item={item}
                                                alt={item.title}
                                                onClick={() => setSelectedImage(item)}
                                            />

                                            <Stack
                                                direction="row"
                                                spacing={0.75}
                                                sx={{
                                                    position: "absolute",
                                                    top: 10,
                                                    right: 10,
                                                }}
                                            >
                                                <Tooltip title="View full image">
                                                    <IconButton
                                                        onClick={() => setSelectedImage(item)}
                                                        sx={{
                                                            color: "#f4f8ff",
                                                            background: "rgba(0,0,0,0.5)",
                                                            "&:hover": { background: "rgba(0,0,0,0.7)" },
                                                        }}
                                                    >
                                                        <VisibilityRounded />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Box>

                                        <CardContent>
                                            <Stack spacing={1.25}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 950,
                                                        lineHeight: 1.15,
                                                        minHeight: 48,
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {item.title}
                                                </Typography>

                                                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                                                    {item.creator && <Chip size="small" label={item.creator} />}
                                                    {item.date && <Chip size="small" label={item.date} />}
                                                    {item.fileFormat && <Chip size="small" label={item.fileFormat} />}
                                                </Stack>

                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: alpha("#f4f8ff", 0.68),
                                                        minHeight: 40,
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {item.description || item.subject || "Archive image item"}
                                                </Typography>

                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    <Chip size="small" label={`${item.allImageCount} image files`} />
                                                    {item.fileSize > 0 && <Chip size="small" label={formatBytes(item.fileSize)} />}
                                                    {item.itemSize > 0 && <Chip size="small" label={`item ${formatBytes(item.itemSize)}`} />}
                                                </Stack>

                                                <Stack direction="row" spacing={1}>
                                                    <Tooltip title="Open Archive details">
                                                        <IconButton
                                                            component="a"
                                                            href={item.detailsUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            sx={{ color: "#9ee8ff" }}
                                                        >
                                                            <OpenInNewRounded />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Copy original image URL">
                                                        <IconButton
                                                            onClick={() => handleCopy(item.sourceUrl || item.imageUrl, "image URL")}
                                                            sx={{ color: "#dfeaff" }}
                                                        >
                                                            <ContentCopyRounded />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Open through archive proxy">
                                                        <IconButton onClick={() => handleDownload(item)} sx={{ color: "#dfeaff" }}>
                                                            <DownloadRounded />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {results.length > 0 && (
                        <Paper sx={{ ...cardSx, p: 2 }}>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1.25}
                                alignItems={{ xs: "stretch", sm: "center" }}
                                justifyContent="space-between"
                            >
                                <Typography sx={{ color: alpha("#f4f8ff", 0.72) }}>
                                    Page {page} loaded. Metadata lookups are capped per page so the UI stays responsive.
                                </Typography>

                                <Button
                                    onClick={() => loadArchiveImages({ nextPage: page + 1, append: true })}
                                    disabled={!canLoadMore}
                                    startIcon={loadingMore ? <CircularProgress size={18} /> : <ImageSearchRounded />}
                                    sx={primaryButtonSx}
                                >
                                    Load More Images
                                </Button>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Container>

            <Dialog
                open={Boolean(selectedImage)}
                onClose={() => setSelectedImage(null)}
                fullWidth
                maxWidth="lg"
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        background: "#090d15",
                        color: "#f4f8ff",
                        border: "1px solid rgba(255,255,255,0.12)",
                    },
                }}
            >
                {selectedImage && (
                    <>
                        <DialogTitle>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={1}
                                justifyContent="space-between"
                                alignItems={{ xs: "stretch", md: "center" }}
                            >
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                        {selectedImage.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: alpha("#f4f8ff", 0.66) }}>
                                        {selectedImage.fileName || selectedImage.identifier}
                                    </Typography>
                                </Box>

                                <Stack direction="row" spacing={1}>
                                    <Button
                                        href={selectedImage.detailsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        startIcon={<OpenInNewRounded />}
                                        variant="outlined"
                                        sx={{ borderRadius: 999, color: "#dff7ff", borderColor: "rgba(255,255,255,0.18)" }}
                                    >
                                        Details
                                    </Button>
                                    <Button
                                        onClick={() => handleCopy(selectedImage.sourceUrl || selectedImage.imageUrl, "image URL")}
                                        startIcon={<ContentCopyRounded />}
                                        sx={primaryButtonSx}
                                    >
                                        Copy URL
                                    </Button>
                                </Stack>
                            </Stack>
                        </DialogTitle>

                        <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                            <Stack spacing={2}>
                                <Box
                                    sx={{
                                        width: "100%",
                                        minHeight: { xs: 320, md: 620 },
                                        maxHeight: "78vh",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "auto",
                                        background:
                                            "linear-gradient(135deg, rgba(82,215,255,0.08), rgba(124,92,255,0.08))",
                                        borderRadius: 2,
                                    }}
                                >
                                    <ArchiveImage
                                        item={selectedImage}
                                        alt={selectedImage.title}
                                        sx={{
                                            width: "auto",
                                            height: "auto",
                                            maxWidth: "100%",
                                            maxHeight: "78vh",
                                            objectFit: "contain",
                                            cursor: "default",
                                        }}
                                    />
                                </Box>

                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {selectedImage.fileFormat && <Chip label={selectedImage.fileFormat} />}
                                    {selectedImage.fileSize > 0 && <Chip label={formatBytes(selectedImage.fileSize)} />}
                                    <Chip label={`${selectedImage.allImageCount} discovered images`} />
                                    {selectedImage.creator && <Chip label={selectedImage.creator} />}
                                    {selectedImage.date && <Chip label={selectedImage.date} />}
                                </Stack>
                            </Stack>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
}