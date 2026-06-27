import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
    BrokenImageRounded,
    CompressRounded,
    CropRounded,
    DownloadRounded,
    FilterVintageRounded,
    ImageRounded,
    PhotoSizeSelectLargeRounded,
    RestartAltRounded,
    TextFieldsRounded,
    TuneRounded,
    UploadFileRounded,
    WaterDropRounded,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Slider,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import Seo from "./seo";


const TOOL_PRESETS = {
    "crop-image": {
        slug: "crop-image",
        title: "Crop Image Online",
        h1: "Crop Image Online",
        shortTitle: "Crop Image",
        icon: <CropRounded />,
        tool: "crop",
        exportType: "image/png",
        extension: "png",
        description:
            "Crop images online with ImageMaster Lab. Upload a photo, choose a crop area, preview the result, and export the cropped image.",
        keywords:
            "crop image online, online image cropper, crop photo, crop PNG, crop JPEG, browser image cropper",
        intro:
            "Upload an image, adjust the crop box using the sliders, then export only the selected area.",
    },
    "resize-image": {
        slug: "resize-image",
        title: "Resize Image Online",
        h1: "Resize Image Online",
        shortTitle: "Resize Image",
        icon: <PhotoSizeSelectLargeRounded />,
        tool: "resize",
        exportType: "image/png",
        extension: "png",
        description:
            "Resize images online with ImageMaster Lab. Upload a photo, enter new dimensions, preview the resize, and export.",
        keywords:
            "resize image online, image resizer, resize photo, online photo resize, browser image resize tool",
        intro:
            "Upload an image, enter a new width and height, then export the resized version.",
    },
    "compress-image": {
        slug: "compress-image",
        title: "Compress Image Online",
        h1: "Compress Image Online",
        shortTitle: "Compress Image",
        icon: <CompressRounded />,
        tool: "compress",
        exportType: "image/jpeg",
        extension: "jpg",
        description:
            "Compress images online with ImageMaster Lab. Upload a photo, adjust export quality, and download a smaller JPEG or WebP file.",
        keywords:
            "compress image online, image compressor, reduce image size, compress JPEG, compress WebP",
        intro:
            "Upload an image, choose JPEG or WebP compression, lower the quality if needed, then export.",
    },
    "background-remover": {
        slug: "background-remover",
        title: "Background Remover",
        h1: "Background Remover",
        shortTitle: "Background Remover",
        icon: <BrokenImageRounded />,
        tool: "background",
        exportType: "image/png",
        extension: "png",
        description:
            "Remove simple image backgrounds online with ImageMaster Lab. Upload an image, remove a matching background color, and export a transparent PNG.",
        keywords:
            "background remover, remove image background, transparent background, online background remover, transparent PNG",
        intro:
            "Upload an image, sample the corner background color, adjust tolerance, and export a transparent PNG.",
    },
    "photo-filters": {
        slug: "photo-filters",
        title: "Photo Filters Online",
        h1: "Photo Filters Online",
        shortTitle: "Photo Filters",
        icon: <FilterVintageRounded />,
        tool: "filters",
        exportType: "image/png",
        extension: "png",
        description:
            "Apply photo filters online with ImageMaster Lab. Adjust brightness, contrast, saturation, grayscale, sepia, blur, and export.",
        keywords:
            "photo filters online, image filters, online photo effects, brightness contrast editor, grayscale image",
        intro:
            "Upload an image, adjust filter sliders, preview the result, then export the edited image.",
    },
    "convert-to-png": {
        slug: "convert-to-png",
        title: "Convert Image to PNG",
        h1: "Convert Image to PNG",
        shortTitle: "Convert to PNG",
        icon: <ImageRounded />,
        tool: "convert",
        exportType: "image/png",
        extension: "png",
        description:
            "Convert images to PNG in your browser with ImageMaster Lab. Upload a photo or design and export it as a PNG file.",
        keywords:
            "convert image to PNG, JPEG to PNG, WebP to PNG, online PNG converter",
        intro:
            "Upload an image and export it as a PNG file.",
    },
    "convert-to-jpg": {
        slug: "convert-to-jpg",
        title: "Convert Image to JPG",
        h1: "Convert Image to JPG",
        shortTitle: "Convert to JPG",
        icon: <ImageRounded />,
        tool: "convert",
        exportType: "image/jpeg",
        extension: "jpg",
        description:
            "Convert images to JPG in your browser with ImageMaster Lab. Upload a PNG, WebP, or photo and export it as a JPG.",
        keywords:
            "convert image to JPG, PNG to JPG, WebP to JPG, online JPG converter",
        intro:
            "Upload an image and export it as a JPG file.",
    },
    "convert-to-webp": {
        slug: "convert-to-webp",
        title: "Convert Image to WebP",
        h1: "Convert Image to WebP",
        shortTitle: "Convert to WebP",
        icon: <ImageRounded />,
        tool: "convert",
        exportType: "image/webp",
        extension: "webp",
        description:
            "Convert images to WebP in your browser with ImageMaster Lab. Upload a PNG or JPG and export a WebP file.",
        keywords:
            "convert image to WebP, PNG to WebP, JPG to WebP, online WebP converter",
        intro:
            "Upload an image and export it as a WebP file.",
    },
    "add-text-to-image": {
        slug: "add-text-to-image",
        title: "Add Text to Image Online",
        h1: "Add Text to Image Online",
        shortTitle: "Add Text",
        icon: <TextFieldsRounded />,
        tool: "text",
        exportType: "image/png",
        extension: "png",
        description:
            "Add text to images online with ImageMaster Lab. Upload a photo, type custom text, adjust size, color, and placement, then export.",
        keywords:
            "add text to image, online text image editor, photo text editor, meme text editor",
        intro:
            "Upload an image, add text, adjust position and style, then export the final image.",
    },
    "watermark-image": {
        slug: "watermark-image",
        title: "Add Watermark to Image",
        h1: "Add Watermark to Image",
        shortTitle: "Watermark Image",
        icon: <WaterDropRounded />,
        tool: "watermark",
        exportType: "image/png",
        extension: "png",
        description:
            "Add a watermark to images online with ImageMaster Lab. Upload a photo, add a text watermark, control opacity, and export.",
        keywords:
            "add watermark to image, watermark photo online, text watermark, image watermark tool",
        intro:
            "Upload an image, add a text watermark, adjust opacity and placement, then export.",
    },
    "meme-maker": {
        slug: "meme-maker",
        title: "Meme Maker Online",
        h1: "Meme Maker Online",
        shortTitle: "Meme Maker",
        icon: <TextFieldsRounded />,
        tool: "meme",
        exportType: "image/png",
        extension: "png",
        description:
            "Make memes online with ImageMaster Lab. Upload an image, add top and bottom meme text, preview, and export.",
        keywords:
            "meme maker, online meme maker, meme text editor, add meme text to image",
        intro:
            "Upload an image, add top and bottom meme text, then export your meme.",
    },
};

const DEFAULT_SLUG = "crop-image";

const clamp = (value, min, max) => {
    return Math.max(min, Math.min(max, value));
};

const fileToImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const image = new Image();

            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = reader.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const makeCanvas = (width, height) => {
    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));

    return canvas;
};

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
};

const hexToRgb = (hex) => {
    const clean = String(hex || "#ffffff").replace("#", "");

    return {
        r: parseInt(clean.slice(0, 2), 16) || 255,
        g: parseInt(clean.slice(2, 4), 16) || 255,
        b: parseInt(clean.slice(4, 6), 16) || 255,
    };
};

const rgbDistance = (a, b) => {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;

    return Math.sqrt(dr * dr + dg * dg + db * db);
};

const buildFilterString = (filters) => {
    return [
        `brightness(${filters.brightness}%)`,
        `contrast(${filters.contrast}%)`,
        `saturate(${filters.saturation}%)`,
        `grayscale(${filters.grayscale}%)`,
        `sepia(${filters.sepia}%)`,
        `blur(${filters.blur}px)`,
    ].join(" ");
};

function getCurrentSlug(pathname) {
    const clean = pathname.replace(/^\/+/, "").replace(/\/+$/, "");

    if (!clean || clean === "additional-pages") {
        return null;
    }

    return TOOL_PRESETS[clean] ? clean : DEFAULT_SLUG;
}

export function AdditionalToolPage() {
    const location = useLocation();
    const slug = getCurrentSlug(location.pathname);
    const preset = slug ? TOOL_PRESETS[slug] : null;

    if (!preset) {
        return <AdditionalToolsIndex />;
    }

    return <StreamlinedToolEditor preset={preset} />;
}

function AdditionalToolsIndex() {
    const tools = Object.values(TOOL_PRESETS);

    return (
        <Box
            component="main"
            sx={{
                minHeight: "100vh",
                color: "common.white",
                background:
                    "radial-gradient(circle at top left, rgba(82,215,255,0.16), transparent 34%), radial-gradient(circle at top right, rgba(124,92,255,0.14), transparent 30%), #07090f",
            }}
        >
            <Seo
                title="Image Tools"
                path="/additional-pages"
                description="Choose a focused ImageMaster Lab tool for cropping, resizing, compressing, removing backgrounds, applying photo filters, converting images, adding text, watermarking, and making memes."
                keywords="online image tools, crop image, resize image, compress image, photo filters, background remover"
            />

            <Container maxWidth="xl" sx={{ py: { xs: 6, md: 9 } }}>
                <Stack spacing={3} sx={{ maxWidth: 920, mb: 4 }}>
                    <Chip
                        label="SEO Image Tools"
                        sx={{
                            width: "fit-content",
                            color: "#dff8ff",
                            border: "1px solid rgba(82,215,255,0.35)",
                            backgroundColor: "rgba(82,215,255,0.1)",
                            fontWeight: 950,
                        }}
                    />

                    <Typography
                        component="h1"
                        sx={{
                            fontSize: { xs: "2.5rem", md: "4.5rem" },
                            lineHeight: 0.98,
                            letterSpacing: "-0.065em",
                            fontWeight: 950,
                        }}
                    >
                        Focused image tools for fast edits and searchable URLs.
                    </Typography>

                    <Typography sx={{ color: "#b9c5d6", fontSize: 18, lineHeight: 1.7 }}>
                        Pick a tool, upload an image, make one focused edit, and export. Each link
                        can also be visited directly for SEO pages like crop-image, resize-image,
                        compress-image, background-remover, and photo-filters.
                    </Typography>
                </Stack>

                <Grid container spacing={2}>
                    {tools.map((tool) => (
                        <Grid item xs={12} sm={6} lg={3} key={tool.slug}>
                            <Card
                                component={RouterLink}
                                to={`/${tool.slug}`}
                                sx={{
                                    height: "100%",
                                    textDecoration: "none",
                                    color: "common.white",
                                    borderRadius: 4,
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background:
                                        "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
                                    transition: "transform 180ms ease, border-color 180ms ease",
                                    "&:hover": {
                                        transform: "translateY(-4px)",
                                        borderColor: "rgba(82,215,255,0.45)",
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            mb: 2,
                                            borderRadius: 2.25,
                                            display: "grid",
                                            placeItems: "center",
                                            color: "#52d7ff",
                                            backgroundColor: "rgba(82,215,255,0.12)",
                                            border: "1px solid rgba(82,215,255,0.2)",
                                        }}
                                    >
                                        {tool.icon}
                                    </Box>

                                    <Typography
                                        component="h2"
                                        sx={{ fontSize: 20, fontWeight: 950, mb: 1 }}
                                    >
                                        {tool.shortTitle}
                                    </Typography>

                                    <Typography sx={{ color: "#b9c5d6", fontSize: 14.5, lineHeight: 1.65 }}>
                                        {tool.intro}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            mt: 2,
                                            color: "#52d7ff",
                                            fontSize: 13,
                                            fontWeight: 950,
                                        }}
                                    >
                                        /{tool.slug}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}

function StreamlinedToolEditor({ preset }) {
    const fileInputRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const baseCanvasRef = useRef(null);

    const [fileName, setFileName] = useState("");
    const [hasImage, setHasImage] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(true);
    const [status, setStatus] = useState("Select an image to begin.");

    const [crop, setCrop] = useState({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
    });

    const [resize, setResize] = useState({
        width: 1200,
        height: 800,
        lockRatio: true,
    });

    const [quality, setQuality] = useState(0.78);
    const [compressFormat, setCompressFormat] = useState("image/jpeg");

    const [background, setBackground] = useState({
        color: "#ffffff",
        tolerance: 42,
    });

    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
    });

    const [text, setText] = useState({
        value: "Your text",
        bottomValue: "Bottom text",
        x: 50,
        y: 50,
        size: 64,
        color: "#ffffff",
        strokeColor: "#000000",
        opacity: 1,
    });

    const outputFormat = useMemo(() => {
        if (preset.tool === "compress") return compressFormat;
        return preset.exportType;
    }, [compressFormat, preset]);

    const outputExtension = useMemo(() => {
        if (outputFormat === "image/jpeg") return "jpg";
        if (outputFormat === "image/webp") return "webp";
        return "png";
    }, [outputFormat]);

    const outputQuality = useMemo(() => {
        if (outputFormat === "image/png") return undefined;
        if (preset.tool === "compress") return quality;
        return 0.92;
    }, [outputFormat, preset.tool, quality]);

    const buildOutputCanvas = useCallback(() => {
        const source = baseCanvasRef.current;

        if (!source) return null;

        let sx = 0;
        let sy = 0;
        let sw = source.width;
        let sh = source.height;

        if (preset.tool === "crop") {
            sx = Math.round((crop.x / 100) * source.width);
            sy = Math.round((crop.y / 100) * source.height);
            sw = Math.round((crop.width / 100) * source.width);
            sh = Math.round((crop.height / 100) * source.height);

            sx = clamp(sx, 0, source.width - 1);
            sy = clamp(sy, 0, source.height - 1);
            sw = clamp(sw, 1, source.width - sx);
            sh = clamp(sh, 1, source.height - sy);
        }

        let outWidth = sw;
        let outHeight = sh;

        if (preset.tool === "resize") {
            outWidth = Math.max(1, Number(resize.width) || sw);
            outHeight = Math.max(1, Number(resize.height) || sh);
        }

        const output = makeCanvas(outWidth, outHeight);
        const ctx = output.getContext("2d", { willReadFrequently: true });

        ctx.clearRect(0, 0, output.width, output.height);

        if (outputFormat === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, output.width, output.height);
        }

        if (preset.tool === "filters") {
            ctx.filter = buildFilterString(filters);
        }

        ctx.drawImage(source, sx, sy, sw, sh, 0, 0, output.width, output.height);
        ctx.filter = "none";

        if (preset.tool === "background") {
            const imageData = ctx.getImageData(0, 0, output.width, output.height);
            const pixels = imageData.data;
            const target = hexToRgb(background.color);

            for (let i = 0; i < pixels.length; i += 4) {
                const current = {
                    r: pixels[i],
                    g: pixels[i + 1],
                    b: pixels[i + 2],
                };

                if (rgbDistance(current, target) <= background.tolerance) {
                    pixels[i + 3] = 0;
                }
            }

            ctx.putImageData(imageData, 0, 0);
        }

        if (preset.tool === "text" || preset.tool === "watermark") {
            const x = (text.x / 100) * output.width;
            const y = (text.y / 100) * output.height;

            ctx.save();
            ctx.globalAlpha = preset.tool === "watermark" ? text.opacity : 1;
            ctx.font = `900 ${text.size}px Arial, sans-serif`;
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.lineJoin = "round";
            ctx.strokeStyle = text.strokeColor;
            ctx.lineWidth = Math.max(3, text.size * 0.08);
            ctx.fillStyle = text.color;
            ctx.strokeText(text.value, x, y);
            ctx.fillText(text.value, x, y);
            ctx.restore();
        }

        if (preset.tool === "meme") {
            ctx.save();
            ctx.font = `900 ${text.size}px Impact, Arial Black, sans-serif`;
            ctx.textAlign = "center";
            ctx.lineJoin = "round";
            ctx.strokeStyle = text.strokeColor;
            ctx.lineWidth = Math.max(4, text.size * 0.1);
            ctx.fillStyle = text.color;

            const topY = Math.max(text.size, output.height * 0.11);
            const bottomY = output.height - Math.max(text.size * 0.45, output.height * 0.08);

            ctx.strokeText(text.value.toUpperCase(), output.width / 2, topY);
            ctx.fillText(text.value.toUpperCase(), output.width / 2, topY);

            ctx.strokeText(text.bottomValue.toUpperCase(), output.width / 2, bottomY);
            ctx.fillText(text.bottomValue.toUpperCase(), output.width / 2, bottomY);
            ctx.restore();
        }

        return output;
    }, [
        background,
        crop,
        filters,
        outputFormat,
        preset.tool,
        resize,
        text,
    ]);

    const redrawPreview = useCallback(() => {
        const preview = previewCanvasRef.current;
        const output = buildOutputCanvas();

        if (!preview || !output) return;

        preview.width = output.width;
        preview.height = output.height;

        const ctx = preview.getContext("2d");

        ctx.clearRect(0, 0, preview.width, preview.height);
        ctx.drawImage(output, 0, 0);

        setStatus(`${preset.shortTitle} preview ready: ${output.width} × ${output.height}px`);
    }, [buildOutputCanvas, preset.shortTitle]);

    useEffect(() => {
        if (hasImage) {
            redrawPreview();
        }
    }, [hasImage, redrawPreview]);

    const handleSelectClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        try {
            const image = await fileToImage(file);
            const base = makeCanvas(image.width, image.height);
            const ctx = base.getContext("2d");

            ctx.drawImage(image, 0, 0);

            baseCanvasRef.current = base;

            setFileName(file.name || "image");
            setHasImage(true);
            setDialogOpen(false);
            setStatus(`Loaded ${file.name}`);

            setCrop({
                x: 0,
                y: 0,
                width: 100,
                height: 100,
            });

            setResize({
                width: image.width,
                height: image.height,
                lockRatio: true,
            });

            const corner = ctx.getImageData(0, 0, 1, 1).data;

            setBackground({
                color: `#${[corner[0], corner[1], corner[2]]
                    .map((value) => value.toString(16).padStart(2, "0"))
                    .join("")}`,
                tolerance: 42,
            });

            setTimeout(() => redrawPreview(), 0);
        } catch (error) {
            console.error(error);
            setStatus("Could not load that image.");
        } finally {
            event.target.value = "";
        }
    };

    const handleExport = () => {
        const output = buildOutputCanvas();

        if (!output) {
            setStatus("Upload an image before exporting.");
            return;
        }

        output.toBlob(
            (blob) => {
                if (!blob) {
                    setStatus("Could not export image.");
                    return;
                }

                const baseName = fileName.replace(/\.[^/.]+$/, "") || "imagemaster-export";
                const filename = `${baseName}-${preset.slug}.${outputExtension}`;

                downloadBlob(blob, filename);
                setStatus(`Exported ${filename}`);
            },
            outputFormat,
            outputQuality
        );
    };

    const handleReset = () => {
        setCrop({
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        });

        const source = baseCanvasRef.current;

        if (source) {
            setResize({
                width: source.width,
                height: source.height,
                lockRatio: true,
            });
        }

        setQuality(0.78);
        setFilters({
            brightness: 100,
            contrast: 100,
            saturation: 100,
            grayscale: 0,
            sepia: 0,
            blur: 0,
        });
        setText({
            value: "Your text",
            bottomValue: "Bottom text",
            x: 50,
            y: 50,
            size: 64,
            color: "#ffffff",
            strokeColor: "#000000",
            opacity: 1,
        });
        setStatus("Tool settings reset.");
    };

    return (
        <Box
            component="main"
            sx={{
                minHeight: "100vh",
                color: "common.white",
                background:
                    "radial-gradient(circle at top left, rgba(82,215,255,0.13), transparent 32%), radial-gradient(circle at top right, rgba(124,92,255,0.12), transparent 30%), radial-gradient(circle at bottom, rgba(255,51,120,0.08), transparent 40%), #07090f",
            }}
        >
            <Seo
                title={preset.title}
                path={`/${preset.slug}`}
                description={preset.description}
                keywords={preset.keywords}
                image="/favicon.svg"
            />

            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleFileChange}
            />

            <UploadDialog
                open={dialogOpen && !hasImage}
                preset={preset}
                onSelect={handleSelectClick}
            />

            <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    sx={{ mb: 2.5 }}
                >
                    <Box>
                        <Button
                            component={RouterLink}
                            to="/additional-pages"
                            sx={{
                                color: "#52d7ff",
                                fontWeight: 950,
                                px: 0,
                                mb: 1,
                                textTransform: "none",
                                "&:hover": {
                                    backgroundColor: "transparent",
                                },
                            }}
                        >
                            All image tools
                        </Button>

                        <Stack direction="row" spacing={1.3} alignItems="center">
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2.25,
                                    display: "grid",
                                    placeItems: "center",
                                    color: "#06101a",
                                    background: "linear-gradient(135deg, #52d7ff, #7c5cff)",
                                }}
                            >
                                {preset.icon}
                            </Box>

                            <Box>
                                <Typography
                                    component="h1"
                                    sx={{
                                        fontSize: { xs: "2rem", md: "3.1rem" },
                                        lineHeight: 1,
                                        letterSpacing: "-0.055em",
                                        fontWeight: 950,
                                    }}
                                >
                                    {preset.h1}
                                </Typography>

                                <Typography sx={{ mt: 0.8, color: "#aeb7c8", lineHeight: 1.55 }}>
                                    {preset.intro}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                            variant="outlined"
                            startIcon={<UploadFileRounded />}
                            onClick={handleSelectClick}
                            sx={outlineButtonSx}
                        >
                            Select Image
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<DownloadRounded />}
                            onClick={handleExport}
                            disabled={!hasImage}
                            sx={primaryButtonSx}
                        >
                            Export Image
                        </Button>
                    </Stack>
                </Stack>

                <Grid container spacing={2.5}>
                    <Grid item xs={12} md={3.4}>
                        <ToolControls
                            preset={preset}
                            hasImage={hasImage}
                            crop={crop}
                            setCrop={setCrop}
                            resize={resize}
                            setResize={setResize}
                            quality={quality}
                            setQuality={setQuality}
                            compressFormat={compressFormat}
                            setCompressFormat={setCompressFormat}
                            background={background}
                            setBackground={setBackground}
                            filters={filters}
                            setFilters={setFilters}
                            text={text}
                            setText={setText}
                            onReset={handleReset}
                        />
                    </Grid>

                    <Grid item xs={12} md={8.6}>
                        <Paper
                            elevation={0}
                            sx={{
                                minHeight: { xs: 440, md: "calc(100vh - 190px)" },
                                p: { xs: 1.5, md: 2 },
                                borderRadius: 4,
                                border: "1px solid rgba(255,255,255,0.1)",
                                backgroundColor: "rgba(255,255,255,0.045)",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                sx={{ mb: 1.5 }}
                            >
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip
                                        icon={<TuneRounded />}
                                        label={preset.shortTitle}
                                        sx={chipSx}
                                    />
                                    {hasImage && <Chip label={fileName} sx={chipSx} />}
                                </Stack>

                                <Typography sx={{ color: "#aeb7c8", fontSize: 13.5 }}>
                                    {status}
                                </Typography>
                            </Stack>

                            <Box
                                sx={{
                                    flex: 1,
                                    minHeight: 0,
                                    borderRadius: 3,
                                    overflow: "auto",
                                    display: "grid",
                                    placeItems: "center",
                                    background:
                                        "linear-gradient(45deg, rgba(255,255,255,0.045) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.045) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.045) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.045) 75%)",
                                    backgroundSize: "26px 26px",
                                    backgroundPosition: "0 0, 0 13px, 13px -13px, -13px 0",
                                }}
                            >
                                {hasImage ? (
                                    <canvas
                                        ref={previewCanvasRef}
                                        style={{
                                            maxWidth: "100%",
                                            maxHeight: "calc(100vh - 260px)",
                                            width: "auto",
                                            height: "auto",
                                            display: "block",
                                            borderRadius: 12,
                                            boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
                                        }}
                                    />
                                ) : (
                                    <Stack spacing={2} alignItems="center" sx={{ textAlign: "center", p: 4 }}>
                                        <ImageRounded sx={{ fontSize: 68, color: "#52d7ff" }} />
                                        <Typography sx={{ fontSize: 24, fontWeight: 950 }}>
                                            Select an image to start
                                        </Typography>
                                        <Typography sx={{ color: "#aeb7c8", maxWidth: 520 }}>
                                            This streamlined tool will only show the controls needed for{" "}
                                            {preset.shortTitle.toLowerCase()}.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<UploadFileRounded />}
                                            onClick={handleSelectClick}
                                            sx={primaryButtonSx}
                                        >
                                            Select Image
                                        </Button>
                                    </Stack>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

function UploadDialog({ open, preset, onSelect }) {
    return (
        <Dialog
            open={open}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    color: "common.white",
                    background:
                        "radial-gradient(circle at top left, rgba(82,215,255,0.18), transparent 34%), #10141f",
                    border: "1px solid rgba(255,255,255,0.12)",
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 950, pb: 1 }}>
                Select an image for {preset.shortTitle}
            </DialogTitle>

            <DialogContent>
                <Typography sx={{ color: "#b9c5d6", lineHeight: 1.65, mb: 2.5 }}>
                    Choose a PNG, JPEG, or WebP file. After selecting it, ImageMaster Lab will open a
                    focused editor for this specific tool.
                </Typography>

                <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    startIcon={<UploadFileRounded />}
                    onClick={onSelect}
                    sx={primaryButtonSx}
                >
                    Select Image
                </Button>
            </DialogContent>
        </Dialog>
    );
}

function ToolControls({
                          preset,
                          hasImage,
                          crop,
                          setCrop,
                          resize,
                          setResize,
                          quality,
                          setQuality,
                          compressFormat,
                          setCompressFormat,
                          background,
                          setBackground,
                          filters,
                          setFilters,
                          text,
                          setText,
                          onReset,
                      }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 4,
                color: "common.white",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.055)",
                position: { md: "sticky" },
                top: 18,
            }}
        >
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 2,
                            color: "#52d7ff",
                            backgroundColor: "rgba(82,215,255,0.1)",
                        }}
                    >
                        {preset.icon}
                    </Box>

                    <Box>
                        <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                            {preset.shortTitle}
                        </Typography>
                        <Typography sx={{ color: "#aeb7c8", fontSize: 12.5 }}>
                            Streamlined controls
                        </Typography>
                    </Box>
                </Stack>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                {!hasImage && (
                    <Typography sx={{ color: "#aeb7c8", lineHeight: 1.6 }}>
                        Select an image first. The tool controls will apply to the preview and export.
                    </Typography>
                )}

                {preset.tool === "crop" && (
                    <CropControls crop={crop} setCrop={setCrop} />
                )}

                {preset.tool === "resize" && (
                    <ResizeControls resize={resize} setResize={setResize} />
                )}

                {preset.tool === "compress" && (
                    <CompressControls
                        quality={quality}
                        setQuality={setQuality}
                        compressFormat={compressFormat}
                        setCompressFormat={setCompressFormat}
                    />
                )}

                {preset.tool === "background" && (
                    <BackgroundControls background={background} setBackground={setBackground} />
                )}

                {preset.tool === "filters" && (
                    <FilterControls filters={filters} setFilters={setFilters} />
                )}

                {(preset.tool === "text" || preset.tool === "watermark" || preset.tool === "meme") && (
                    <TextControls tool={preset.tool} text={text} setText={setText} />
                )}

                {preset.tool === "convert" && (
                    <Stack spacing={1.2}>
                        <Typography sx={{ color: "#dff8ff", fontWeight: 900 }}>
                            Converter
                        </Typography>
                        <Typography sx={{ color: "#aeb7c8", lineHeight: 1.6 }}>
                            No extra settings are needed. Select an image and export it as{" "}
                            {preset.extension.toUpperCase()}.
                        </Typography>
                    </Stack>
                )}

                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                <Button
                    variant="outlined"
                    startIcon={<RestartAltRounded />}
                    onClick={onReset}
                    sx={outlineButtonSx}
                >
                    Reset Settings
                </Button>
            </Stack>
        </Paper>
    );
}

function CropControls({ crop, setCrop }) {
    const update = (key) => (_, value) => {
        setCrop((current) => ({
            ...current,
            [key]: value,
        }));
    };

    return (
        <Stack spacing={1.5}>
            <ControlLabel label="Crop X" value={`${crop.x}%`} />
            <Slider value={crop.x} min={0} max={95} onChange={update("x")} />

            <ControlLabel label="Crop Y" value={`${crop.y}%`} />
            <Slider value={crop.y} min={0} max={95} onChange={update("y")} />

            <ControlLabel label="Crop Width" value={`${crop.width}%`} />
            <Slider value={crop.width} min={5} max={100 - crop.x} onChange={update("width")} />

            <ControlLabel label="Crop Height" value={`${crop.height}%`} />
            <Slider value={crop.height} min={5} max={100 - crop.y} onChange={update("height")} />
        </Stack>
    );
}

function ResizeControls({ resize, setResize }) {
    const handleWidth = (event) => {
        const width = Math.max(1, Number(event.target.value) || 1);

        setResize((current) => {
            if (!current.lockRatio || !current.width || !current.height) {
                return {
                    ...current,
                    width,
                };
            }

            const ratio = current.height / current.width;

            return {
                ...current,
                width,
                height: Math.max(1, Math.round(width * ratio)),
            };
        });
    };

    const handleHeight = (event) => {
        const height = Math.max(1, Number(event.target.value) || 1);

        setResize((current) => {
            if (!current.lockRatio || !current.width || !current.height) {
                return {
                    ...current,
                    height,
                };
            }

            const ratio = current.width / current.height;

            return {
                ...current,
                height,
                width: Math.max(1, Math.round(height * ratio)),
            };
        });
    };

    return (
        <Stack spacing={1.5}>
            <TextField
                label="Width"
                type="number"
                value={resize.width}
                onChange={handleWidth}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
            />

            <TextField
                label="Height"
                type="number"
                value={resize.height}
                onChange={handleHeight}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
            />

            <Button
                variant={resize.lockRatio ? "contained" : "outlined"}
                onClick={() =>
                    setResize((current) => ({
                        ...current,
                        lockRatio: !current.lockRatio,
                    }))
                }
                sx={resize.lockRatio ? primaryButtonSx : outlineButtonSx}
            >
                {resize.lockRatio ? "Aspect Ratio Locked" : "Aspect Ratio Unlocked"}
            </Button>
        </Stack>
    );
}

function CompressControls({
                              quality,
                              setQuality,
                              compressFormat,
                              setCompressFormat,
                          }) {
    return (
        <Stack spacing={1.5}>
            <FormControl fullWidth sx={selectSx}>
                <InputLabel>Export Format</InputLabel>
                <Select
                    value={compressFormat}
                    label="Export Format"
                    onChange={(event) => setCompressFormat(event.target.value)}
                >
                    <MenuItem value="image/jpeg">JPEG</MenuItem>
                    <MenuItem value="image/webp">WebP</MenuItem>
                </Select>
            </FormControl>

            <ControlLabel label="Quality" value={`${Math.round(quality * 100)}%`} />
            <Slider
                value={quality}
                min={0.1}
                max={1}
                step={0.01}
                onChange={(_, value) => setQuality(value)}
            />
        </Stack>
    );
}

function BackgroundControls({ background, setBackground }) {
    return (
        <Stack spacing={1.5}>
            <TextField
                label="Background Color To Remove"
                type="color"
                value={background.color}
                onChange={(event) =>
                    setBackground((current) => ({
                        ...current,
                        color: event.target.value,
                    }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
            />

            <ControlLabel label="Tolerance" value={background.tolerance} />
            <Slider
                value={background.tolerance}
                min={0}
                max={180}
                onChange={(_, value) =>
                    setBackground((current) => ({
                        ...current,
                        tolerance: value,
                    }))
                }
            />

            <Typography sx={{ color: "#aeb7c8", fontSize: 13, lineHeight: 1.6 }}>
                This removes pixels close to the selected color. It works best on simple solid
                backgrounds.
            </Typography>
        </Stack>
    );
}

function FilterControls({ filters, setFilters }) {
    const update = (key) => (_, value) => {
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
    };

    return (
        <Stack spacing={1.45}>
            <ControlLabel label="Brightness" value={`${filters.brightness}%`} />
            <Slider value={filters.brightness} min={0} max={200} onChange={update("brightness")} />

            <ControlLabel label="Contrast" value={`${filters.contrast}%`} />
            <Slider value={filters.contrast} min={0} max={220} onChange={update("contrast")} />

            <ControlLabel label="Saturation" value={`${filters.saturation}%`} />
            <Slider value={filters.saturation} min={0} max={250} onChange={update("saturation")} />

            <ControlLabel label="Grayscale" value={`${filters.grayscale}%`} />
            <Slider value={filters.grayscale} min={0} max={100} onChange={update("grayscale")} />

            <ControlLabel label="Sepia" value={`${filters.sepia}%`} />
            <Slider value={filters.sepia} min={0} max={100} onChange={update("sepia")} />

            <ControlLabel label="Blur" value={`${filters.blur}px`} />
            <Slider value={filters.blur} min={0} max={12} step={0.25} onChange={update("blur")} />
        </Stack>
    );
}

function TextControls({ tool, text, setText }) {
    const showBottom = tool === "meme";
    const showOpacity = tool === "watermark";

    return (
        <Stack spacing={1.5}>
            <TextField
                label={tool === "watermark" ? "Watermark Text" : "Text"}
                value={text.value}
                onChange={(event) =>
                    setText((current) => ({
                        ...current,
                        value: event.target.value,
                    }))
                }
                fullWidth
                sx={textFieldSx}
            />

            {showBottom && (
                <TextField
                    label="Bottom Text"
                    value={text.bottomValue}
                    onChange={(event) =>
                        setText((current) => ({
                            ...current,
                            bottomValue: event.target.value,
                        }))
                    }
                    fullWidth
                    sx={textFieldSx}
                />
            )}

            {!showBottom && (
                <>
                    <ControlLabel label="X Position" value={`${text.x}%`} />
                    <Slider
                        value={text.x}
                        min={0}
                        max={100}
                        onChange={(_, value) =>
                            setText((current) => ({
                                ...current,
                                x: value,
                            }))
                        }
                    />

                    <ControlLabel label="Y Position" value={`${text.y}%`} />
                    <Slider
                        value={text.y}
                        min={0}
                        max={100}
                        onChange={(_, value) =>
                            setText((current) => ({
                                ...current,
                                y: value,
                            }))
                        }
                    />
                </>
            )}

            <ControlLabel label="Text Size" value={`${text.size}px`} />
            <Slider
                value={text.size}
                min={18}
                max={180}
                onChange={(_, value) =>
                    setText((current) => ({
                        ...current,
                        size: value,
                    }))
                }
            />

            {showOpacity && (
                <>
                    <ControlLabel label="Opacity" value={`${Math.round(text.opacity * 100)}%`} />
                    <Slider
                        value={text.opacity}
                        min={0.05}
                        max={1}
                        step={0.01}
                        onChange={(_, value) =>
                            setText((current) => ({
                                ...current,
                                opacity: value,
                            }))
                        }
                    />
                </>
            )}

            <TextField
                label="Text Color"
                type="color"
                value={text.color}
                onChange={(event) =>
                    setText((current) => ({
                        ...current,
                        color: event.target.value,
                    }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
            />

            <TextField
                label="Stroke Color"
                type="color"
                value={text.strokeColor}
                onChange={(event) =>
                    setText((current) => ({
                        ...current,
                        strokeColor: event.target.value,
                    }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
            />
        </Stack>
    );
}

function ControlLabel({ label, value }) {
    return (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ color: "#dbe7f6", fontWeight: 850, fontSize: 13.5 }}>
                {label}
            </Typography>
            <Typography sx={{ color: "#52d7ff", fontWeight: 950, fontSize: 13 }}>
                {value}
            </Typography>
        </Stack>
    );
}

const primaryButtonSx = {
    borderRadius: 999,
    px: 2.4,
    py: 1.05,
    fontWeight: 950,
    color: "#06101a",
    background: "linear-gradient(135deg, #52d7ff, #7c5cff)",
    boxShadow: "0 16px 40px rgba(82,215,255,0.22)",
    textTransform: "none",
    "&:hover": {
        background: "linear-gradient(135deg, #8ae8ff, #9f8cff)",
    },
};

const outlineButtonSx = {
    borderRadius: 999,
    px: 2.3,
    py: 1.05,
    fontWeight: 950,
    color: "#dff8ff",
    borderColor: "rgba(82,215,255,0.35)",
    textTransform: "none",
    "&:hover": {
        borderColor: "rgba(82,215,255,0.7)",
        backgroundColor: "rgba(82,215,255,0.08)",
    },
};

const chipSx = {
    color: "#dff8ff",
    backgroundColor: "rgba(82,215,255,0.1)",
    border: "1px solid rgba(82,215,255,0.22)",
    fontWeight: 850,
    "& .MuiChip-icon": {
        color: "#52d7ff",
    },
};

const textFieldSx = {
    "& .MuiInputLabel-root": {
        color: "#aeb7c8",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#52d7ff",
    },
    "& .MuiOutlinedInput-root": {
        color: "common.white",
        borderRadius: 2,
        backgroundColor: "rgba(0,0,0,0.22)",
        "& fieldset": {
            borderColor: "rgba(255,255,255,0.13)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(82,215,255,0.38)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#52d7ff",
        },
    },
};

const selectSx = {
    "& .MuiInputLabel-root": {
        color: "#aeb7c8",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#52d7ff",
    },
    "& .MuiOutlinedInput-root": {
        color: "common.white",
        borderRadius: 2,
        backgroundColor: "rgba(0,0,0,0.22)",
        "& fieldset": {
            borderColor: "rgba(255,255,255,0.13)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(82,215,255,0.38)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#52d7ff",
        },
    },
    "& .MuiSvgIcon-root": {
        color: "#52d7ff",
    },
};