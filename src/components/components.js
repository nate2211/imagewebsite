import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    AddRounded,
    AutoFixHighRounded,
    BrushRounded,
    DeleteRounded,
    DownloadRounded,
    FileDownloadRounded,
    GridOnRounded,
    ImageSearchRounded,
    LayersRounded,
    PaletteRounded,
    RedoRounded,
    RocketLaunchRounded,
    SaveRounded,
    SelectAllRounded,
    TextFieldsRounded,
    TuneRounded,
    UndoRounded,
    UploadFileRounded,
    VisibilityOffRounded,
    VisibilityRounded,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Chip,
    Container,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Slider,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

const uid = () => `item_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const clamp = (value, min = 0, max = 255) => {
    return Math.max(min, Math.min(max, value));
};

const makeCanvas = (width, height) => {
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    return canvas;
};

const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
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
    const clean = String(hex || "#000000").replace("#", "");

    if (clean.length === 3) {
        return {
            r: parseInt(clean[0] + clean[0], 16),
            g: parseInt(clean[1] + clean[1], 16),
            b: parseInt(clean[2] + clean[2], 16),
        };
    }

    return {
        r: parseInt(clean.slice(0, 2), 16) || 0,
        g: parseInt(clean.slice(2, 4), 16) || 0,
        b: parseInt(clean.slice(4, 6), 16) || 0,
    };
};

const rgba = (hex, alpha = 1) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const colorDistance = (r1, g1, b1, a1, r2, g2, b2, a2) => {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    const da = (a1 - a2) * 0.25;

    return Math.sqrt(dr * dr + dg * dg + db * db + da * da);
};

const createLayerMeta = (name, type = "paint") => ({
    id: uid(),
    name,
    type,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "source-over",
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
});

const createTextBoxMeta = (patch = {}) => ({
    id: uid(),
    name: "Text Box",
    text: "Type here",
    x: 180,
    y: 130,
    width: 380,
    height: 140,
    rotation: 0,
    fontSize: 54,
    fontFamily: "Arial",
    fontWeight: "800",
    color: "#ffffff",
    align: "left",
    lineHeight: 1.18,
    backgroundColor: "#000000",
    backgroundOpacity: 0,
    borderColor: "#52d7ff",
    borderOpacity: 0.85,
    borderWidth: 2,
    padding: 14,
    visible: true,
    locked: false,
    ...patch,
});

const BRUSH_SHAPES = [
    { value: "softRound", label: "Soft Round" },
    { value: "round", label: "Hard Round" },
    { value: "square", label: "Square" },
    { value: "diamond", label: "Diamond" },
    { value: "star", label: "Star" },
    { value: "horizontalLine", label: "Horizontal Line" },
    { value: "verticalLine", label: "Vertical Line" },
    { value: "slash", label: "Slash" },
    { value: "calligraphy", label: "Calligraphy" },
    { value: "spray", label: "Spray" },
];

const BLEND_MODES = [
    { value: "source-over", label: "Normal" },
    { value: "multiply", label: "Multiply" },
    { value: "screen", label: "Screen" },
    { value: "overlay", label: "Overlay" },
    { value: "darken", label: "Darken" },
    { value: "lighten", label: "Lighten" },
    { value: "color-dodge", label: "Color Dodge" },
    { value: "color-burn", label: "Color Burn" },
    { value: "hard-light", label: "Hard Light" },
    { value: "soft-light", label: "Soft Light" },
    { value: "difference", label: "Difference" },
];

const FONT_FAMILIES = [
    "Arial",
    "Inter",
    "Impact",
    "Georgia",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Trebuchet MS",
];

function drawStarPath(ctx, cx, cy, outerRadius, innerRadius, points = 5) {
    ctx.beginPath();

    for (let i = 0; i < points * 2; i += 1) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = -Math.PI / 2 + (i * Math.PI) / points;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.closePath();
}

function stampBrush(ctx, x, y, options) {
    const size = Math.max(1, options.size);
    const radius = size / 2;
    const alpha = clamp(options.opacity * options.flow, 0, 1);
    const hardness = clamp(options.hardness, 0.01, 1);
    const shape = options.shape || "softRound";

    ctx.save();

    if (shape === "softRound") {
        if (hardness >= 0.98) {
            ctx.fillStyle = rgba(options.color, alpha);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

            gradient.addColorStop(0, rgba(options.color, alpha));
            gradient.addColorStop(hardness, rgba(options.color, alpha));
            gradient.addColorStop(1, rgba(options.color, 0));

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        return;
    }

    if (shape === "spray") {
        const dots = Math.max(14, Math.floor(size * 1.3));

        ctx.fillStyle = rgba(options.color, alpha * 0.28);

        for (let i = 0; i < dots; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.sqrt(Math.random()) * radius;
            const dotRadius = Math.max(1, size * (0.018 + Math.random() * 0.018));
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;

            ctx.beginPath();
            ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        return;
    }

    ctx.translate(x, y);
    ctx.fillStyle = rgba(options.color, alpha);

    if (shape === "round") {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    if (shape === "square") {
        ctx.fillRect(-radius, -radius, size, size);
    }

    if (shape === "diamond") {
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius, 0);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius, 0);
        ctx.closePath();
        ctx.fill();
    }

    if (shape === "star") {
        drawStarPath(ctx, 0, 0, radius, radius * 0.45, 5);
        ctx.fill();
    }

    if (shape === "horizontalLine") {
        ctx.fillRect(-radius, -Math.max(1, size * 0.08), size, Math.max(2, size * 0.16));
    }

    if (shape === "verticalLine") {
        ctx.fillRect(-Math.max(1, size * 0.08), -radius, Math.max(2, size * 0.16), size);
    }

    if (shape === "slash") {
        ctx.rotate(-Math.PI / 4);
        ctx.fillRect(-radius, -Math.max(1, size * 0.08), size, Math.max(2, size * 0.16));
    }

    if (shape === "calligraphy") {
        ctx.rotate(-Math.PI / 5);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, Math.max(1, radius * 0.28), 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawBrushLine(ctx, from, to, options) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const spacing = Math.max(1, options.size * options.spacing);

    if (distance <= 0.01) {
        stampBrush(ctx, to.x, to.y, options);
        return;
    }

    const steps = Math.max(1, Math.ceil(distance / spacing));

    for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = from.x + dx * t;
        const y = from.y + dy * t;

        stampBrush(ctx, x, y, options);
    }
}

function applyMaskToCanvas(canvas, mask) {
    if (!mask) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
        const pixelIndex = i / 4;
        const selected = mask.data[pixelIndex] / 255;

        pixels[i + 3] = pixels[i + 3] * selected;
    }

    ctx.putImageData(imageData, 0, 0);
}

function blendPixel(data, index, r, g, b, opacity) {
    const srcA = data[index + 3] / 255;
    const fillA = clamp(opacity, 0, 1);
    const outA = fillA + srcA * (1 - fillA);

    if (outA <= 0) {
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
        data[index + 3] = 0;
        return;
    }

    data[index] = clamp((r * fillA + data[index] * srcA * (1 - fillA)) / outA);
    data[index + 1] = clamp((g * fillA + data[index + 1] * srcA * (1 - fillA)) / outA);
    data[index + 2] = clamp((b * fillA + data[index + 2] * srcA * (1 - fillA)) / outA);
    data[index + 3] = clamp(outA * 255);
}

function floodFillMaskFromImageData(imageData, startX, startY, tolerance, selectionMask = null) {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;

    if (startX < 0 || startY < 0 || startX >= width || startY >= height) {
        return {
            width,
            height,
            data: new Uint8ClampedArray(width * height),
            count: 0,
        };
    }

    const startPixel = startY * width + startX;

    if (selectionMask && selectionMask.data[startPixel] <= 0) {
        return {
            width,
            height,
            data: new Uint8ClampedArray(width * height),
            count: 0,
        };
    }

    const startIndex = startPixel * 4;
    const targetR = pixels[startIndex];
    const targetG = pixels[startIndex + 1];
    const targetB = pixels[startIndex + 2];
    const targetA = pixels[startIndex + 3];

    const total = width * height;
    const visited = new Uint8Array(total);
    const mask = new Uint8ClampedArray(total);
    const stack = new Int32Array(total);

    let stackLength = 0;
    let count = 0;

    const push = (pixelIndex) => {
        if (pixelIndex < 0 || pixelIndex >= total) return;
        if (visited[pixelIndex]) return;

        visited[pixelIndex] = 1;
        stack[stackLength] = pixelIndex;
        stackLength += 1;
    };

    push(startPixel);

    while (stackLength > 0) {
        stackLength -= 1;

        const pixelIndex = stack[stackLength];

        if (selectionMask && selectionMask.data[pixelIndex] <= 0) continue;

        const px = pixelIndex % width;
        const py = Math.floor(pixelIndex / width);
        const rgbaIndex = pixelIndex * 4;

        const r = pixels[rgbaIndex];
        const g = pixels[rgbaIndex + 1];
        const b = pixels[rgbaIndex + 2];
        const a = pixels[rgbaIndex + 3];

        const distance = colorDistance(r, g, b, a, targetR, targetG, targetB, targetA);

        if (distance > tolerance) continue;

        mask[pixelIndex] = 255;
        count += 1;

        if (px > 0) push(pixelIndex - 1);
        if (px < width - 1) push(pixelIndex + 1);
        if (py > 0) push(pixelIndex - width);
        if (py < height - 1) push(pixelIndex + width);
    }

    return {
        width,
        height,
        data: mask,
        count,
    };
}

function boxBlurImageData(imageData, radius) {
    const width = imageData.width;
    const height = imageData.height;
    const source = imageData.data;
    const output = new Uint8ClampedArray(source.length);
    const r = Math.max(1, Math.floor(radius));

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            let red = 0;
            let green = 0;
            let blue = 0;
            let alpha = 0;
            let count = 0;

            for (let yy = -r; yy <= r; yy += 1) {
                for (let xx = -r; xx <= r; xx += 1) {
                    const nx = x + xx;
                    const ny = y + yy;

                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

                    const index = (ny * width + nx) * 4;

                    red += source[index];
                    green += source[index + 1];
                    blue += source[index + 2];
                    alpha += source[index + 3];
                    count += 1;
                }
            }

            const outIndex = (y * width + x) * 4;

            output[outIndex] = red / count;
            output[outIndex + 1] = green / count;
            output[outIndex + 2] = blue / count;
            output[outIndex + 3] = alpha / count;
        }
    }

    return new ImageData(output, width, height);
}

function sharpenImageData(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const source = imageData.data;
    const output = new Uint8ClampedArray(source.length);
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            let red = 0;
            let green = 0;
            let blue = 0;

            for (let ky = -1; ky <= 1; ky += 1) {
                for (let kx = -1; kx <= 1; kx += 1) {
                    const nx = clamp(x + kx, 0, width - 1);
                    const ny = clamp(y + ky, 0, height - 1);
                    const sourceIndex = (ny * width + nx) * 4;
                    const kernelIndex = (ky + 1) * 3 + (kx + 1);
                    const weight = kernel[kernelIndex];

                    red += source[sourceIndex] * weight;
                    green += source[sourceIndex + 1] * weight;
                    blue += source[sourceIndex + 2] * weight;
                }
            }

            const outIndex = (y * width + x) * 4;

            output[outIndex] = clamp(red);
            output[outIndex + 1] = clamp(green);
            output[outIndex + 2] = clamp(blue);
            output[outIndex + 3] = source[outIndex + 3];
        }
    }

    return new ImageData(output, width, height);
}

function wrapTextLines(ctx, text, maxWidth) {
    const paragraphs = String(text || "").split("\n");
    const lines = [];

    for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
            lines.push("");
            continue;
        }

        const words = paragraph.split(/\s+/);
        let line = "";

        for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            const width = ctx.measureText(testLine).width;

            if (width > maxWidth && line) {
                lines.push(line);
                line = word;
            } else {
                line = testLine;
            }
        }

        lines.push(line);
    }

    return lines;
}

function drawTextBoxToContext(ctx, box) {
    if (!box.visible) return;

    const padding = Number(box.padding ?? 12);
    const fontSize = Number(box.fontSize ?? 48);
    const lineHeight = fontSize * Number(box.lineHeight ?? 1.18);
    const innerWidth = Math.max(10, box.width - padding * 2);
    const innerHeight = Math.max(10, box.height - padding * 2);

    ctx.save();

    ctx.translate(box.x, box.y);
    ctx.rotate(((box.rotation || 0) * Math.PI) / 180);

    if ((box.backgroundOpacity || 0) > 0) {
        ctx.fillStyle = rgba(box.backgroundColor || "#000000", box.backgroundOpacity);
        ctx.fillRect(0, 0, box.width, box.height);
    }

    if ((box.borderWidth || 0) > 0 && (box.borderOpacity || 0) > 0) {
        ctx.strokeStyle = rgba(box.borderColor || "#52d7ff", box.borderOpacity);
        ctx.lineWidth = box.borderWidth;
        ctx.strokeRect(0, 0, box.width, box.height);
    }

    ctx.beginPath();
    ctx.rect(padding, padding, innerWidth, innerHeight);
    ctx.clip();

    ctx.fillStyle = box.color || "#ffffff";
    ctx.font = `${box.fontWeight || "700"} ${fontSize}px ${box.fontFamily || "Arial"}`;
    ctx.textBaseline = "top";
    ctx.textAlign = box.align || "left";

    const lines = wrapTextLines(ctx, box.text, innerWidth);
    const textX =
        box.align === "center"
            ? padding + innerWidth / 2
            : box.align === "right"
                ? padding + innerWidth
                : padding;

    for (let i = 0; i < lines.length; i += 1) {
        const y = padding + i * lineHeight;

        if (y > padding + innerHeight) break;

        ctx.fillText(lines[i], textX, y);
    }

    ctx.restore();
}

export function SiteShell({ children }) {
    return (
        <Box
            component="main"
            sx={{
                minHeight: "100vh",
                overflowX: "hidden",
                color: "common.white",
                background:
                    "radial-gradient(circle at top left, rgba(0, 204, 255, 0.18), transparent 34%), radial-gradient(circle at top right, rgba(124, 92, 255, 0.18), transparent 32%), radial-gradient(circle at bottom, rgba(255, 51, 120, 0.1), transparent 40%), #080b12",
            }}
        >
            {children}
        </Box>
    );
}

export function HeroSection() {
    return (
        <Container maxWidth="xl">
            <Grid
                container
                spacing={{ xs: 5, md: 7 }}
                alignItems="center"
                sx={{
                    minHeight: { xs: "auto", md: "92vh" },
                    py: { xs: 8, md: 11 },
                }}
            >
                <Grid item xs={12} lg={6.3}>
                    <Stack spacing={3}>
                        <KickerChip label="Browser-Based Creative Studio" />

                        <Typography
                            component="h1"
                            sx={{
                                maxWidth: 960,
                                fontSize: {
                                    xs: "2.65rem",
                                    sm: "4rem",
                                    md: "5.15rem",
                                },
                                lineHeight: 0.95,
                                letterSpacing: "-0.075em",
                                fontWeight: 950,
                            }}
                        >
                            Edit, paint, type, fill, select, filter, and export images directly in your browser.
                        </Typography>

                        <Typography
                            sx={{
                                maxWidth: 760,
                                color: "#b9c5d6",
                                fontSize: { xs: "1rem", md: "1.25rem" },
                                lineHeight: 1.7,
                            }}
                        >
                            A Photoshop-style canvas editor with layers, shaped brushes, fill bucket,
                            wand selection, lasso tools, movable text boxes, filters, project saves,
                            and PNG, JPEG, or WebP export.
                        </Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                            <Button
                                component={RouterLink}
                                to="/image"
                                size="large"
                                variant="contained"
                                endIcon={<RocketLaunchRounded />}
                                sx={primaryButtonSx}
                            >
                                Open Image Editor
                            </Button>

                            <Button
                                href="#features"
                                size="large"
                                variant="outlined"
                                sx={secondaryButtonSx}
                            >
                                View Features
                            </Button>
                        </Stack>
                    </Stack>
                </Grid>

                <Grid item xs={12} lg={5.7}>
                    <EditorMockup />
                </Grid>
            </Grid>
        </Container>
    );
}

export function FeatureGridSection() {
    const features = [
        {
            icon: <ImageSearchRounded />,
            title: "Image Upload",
            text: "Load PNG, JPEG, or WebP files directly into the workspace as editable raster layers.",
        },
        {
            icon: <LayersRounded />,
            title: "Layer System",
            text: "Create layers, reorder them, hide them, adjust opacity, transform them, and blend them together.",
        },
        {
            icon: <TextFieldsRounded />,
            title: "Movable Text Boxes",
            text: "Place live typeable text boxes, drag them around, resize them, style them, save them, and export them.",
        },
        {
            icon: <PaletteRounded />,
            title: "Fill Bucket",
            text: "Click a connected same-color region and fill it using tolerance-aware flood fill.",
        },
        {
            icon: <SelectAllRounded />,
            title: "Deselect Workflow",
            text: "Clear the active selection to instantly return filters and fills to the whole active layer.",
        },
        {
            icon: <BrushRounded />,
            title: "Shape Brushes",
            text: "Paint with soft round, hard round, square, diamond, star, line, slash, calligraphy, and spray brushes.",
        },
        {
            icon: <TuneRounded />,
            title: "Selection Filters",
            text: "Apply brightness, contrast, grayscale, invert, blur, and sharpen to full layers or selected areas.",
        },
        {
            icon: <FileDownloadRounded />,
            title: "Export & Save",
            text: "Export finished images as PNG, JPEG, or WebP and save editable projects as JSON.",
        },
    ];

    return (
        <Box id="features" sx={{ py: { xs: 7, md: 10 } }}>
            <Container maxWidth="xl">
                <Stack spacing={2.5} sx={{ maxWidth: 900, mb: 4 }}>
                    <KickerChip label="Complex Canvas Features" />

                    <Typography
                        component="h2"
                        sx={{
                            fontSize: { xs: "2.25rem", md: "3.65rem" },
                            lineHeight: 1.02,
                            letterSpacing: "-0.055em",
                            fontWeight: 950,
                        }}
                    >
                        Everything needed for a real web image editor.
                    </Typography>

                    <Typography
                        sx={{
                            maxWidth: 820,
                            color: "#b9c5d6",
                            fontSize: "1.05rem",
                            lineHeight: 1.75,
                        }}
                    >
                        The app uses a true layered canvas system with editable text boxes on top
                        of the canvas. Edits can be stacked, masked, filtered, saved, restored,
                        and exported cleanly.
                    </Typography>
                </Stack>

                <Grid container spacing={2}>
                    {features.map((feature) => (
                        <Grid item xs={12} sm={6} lg={3} key={feature.title}>
                            <FeatureCard {...feature} />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}

export function WorkflowSection() {
    const workflow = [
        {
            number: "01",
            title: "Upload",
            text: "Start with a local PNG, JPEG, or WebP image file.",
        },
        {
            number: "02",
            title: "Paint / Select",
            text: "Use brushes, wand, lasso, rectangle select, fill bucket, and filters.",
        },
        {
            number: "03",
            title: "Add Text",
            text: "Place movable typeable text boxes, drag them, resize them, and style them.",
        },
        {
            number: "04",
            title: "Export",
            text: "Export the visible canvas, including all text boxes, as PNG, JPEG, or WebP.",
        },
    ];

    return (
        <Box sx={{ py: { xs: 7, md: 10 } }}>
            <Container maxWidth="xl">
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 6 },
                        borderRadius: 5,
                        color: "common.white",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background:
                            "radial-gradient(circle at top right, rgba(82,215,255,0.13), transparent 34%), rgba(255,255,255,0.055)",
                        boxShadow: "0 24px 90px rgba(0,0,0,0.35)",
                        backdropFilter: "blur(16px)",
                    }}
                >
                    <Stack spacing={2.5}>
                        <KickerChip label="Workflow" />

                        <Typography
                            component="h2"
                            sx={{
                                fontSize: { xs: "2.15rem", md: "3.4rem" },
                                lineHeight: 1.02,
                                letterSpacing: "-0.055em",
                                fontWeight: 950,
                            }}
                        >
                            Upload. Edit. Type. Move. Export.
                        </Typography>

                        <Grid container spacing={2} sx={{ pt: 1 }}>
                            {workflow.map((step) => (
                                <Grid item xs={12} sm={6} lg={3} key={step.number}>
                                    <WorkflowCard {...step} />
                                </Grid>
                            ))}
                        </Grid>

                        <Box>
                            <Button
                                component={RouterLink}
                                to="/image"
                                size="large"
                                variant="contained"
                                endIcon={<RocketLaunchRounded />}
                                sx={primaryButtonSx}
                            >
                                Launch the Editor
                            </Button>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}

function KickerChip({ label }) {
    return (
        <Chip
            label={label}
            sx={{
                width: "fit-content",
                color: "#dff8ff",
                borderColor: "rgba(82,215,255,0.35)",
                backgroundColor: "rgba(82,215,255,0.1)",
                fontWeight: 900,
                letterSpacing: 1,
                textTransform: "uppercase",
            }}
            variant="outlined"
        />
    );
}

function FeatureCard({ icon, title, text }) {
    return (
        <Paper
            elevation={0}
            sx={{
                height: "100%",
                minHeight: 210,
                p: 2.75,
                borderRadius: 4,
                color: "common.white",
                border: "1px solid rgba(255,255,255,0.11)",
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
        >
            <Box
                sx={{
                    width: 46,
                    height: 46,
                    mb: 2,
                    borderRadius: 2.25,
                    display: "grid",
                    placeItems: "center",
                    color: "#52d7ff",
                    backgroundColor: "rgba(82,215,255,0.12)",
                    border: "1px solid rgba(82,215,255,0.16)",
                    "& svg": {
                        fontSize: 25,
                    },
                }}
            >
                {icon}
            </Box>

            <Typography component="h3" sx={{ fontSize: 20, fontWeight: 950, mb: 1.25 }}>
                {title}
            </Typography>

            <Typography sx={{ color: "#b9c5d6", fontSize: 14.5, lineHeight: 1.7 }}>
                {text}
            </Typography>
        </Paper>
    );
}

function WorkflowCard({ number, title, text }) {
    return (
        <Paper
            elevation={0}
            sx={{
                height: "100%",
                p: 2.5,
                borderRadius: 3,
                color: "common.white",
                backgroundColor: "rgba(0,0,0,0.22)",
                border: "1px solid rgba(255,255,255,0.08)",
            }}
        >
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.2,
                    display: "grid",
                    placeItems: "center",
                    mb: 2,
                    color: "#52d7ff",
                    backgroundColor: "rgba(82,215,255,0.13)",
                    fontWeight: 950,
                }}
            >
                {number}
            </Box>

            <Typography sx={{ fontSize: 18, fontWeight: 950, mb: 1 }}>
                {title}
            </Typography>

            <Typography sx={{ color: "#b9c5d6", fontSize: 14.5, lineHeight: 1.65 }}>
                {text}
            </Typography>
        </Paper>
    );
}

function EditorMockup() {
    const tools = ["Move", "Brush", "Bucket", "Wand", "Deselect", "Text Box", "Shape", "Filter"];

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 5,
                overflow: "hidden",
                color: "common.white",
                border: "1px solid rgba(255,255,255,0.14)",
                backgroundColor: "rgba(10,14,24,0.72)",
                boxShadow: "0 34px 120px rgba(0,0,0,0.45)",
                backdropFilter: "blur(22px)",
            }}
        >
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    height: 48,
                    alignItems: "center",
                    px: 2.25,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "rgba(255,255,255,0.045)",
                }}
            >
                {["#ff5f57", "#ffbd2e", "#28c840"].map((item) => (
                    <Box
                        key={item}
                        sx={{
                            width: 11,
                            height: 11,
                            borderRadius: "50%",
                            backgroundColor: item,
                        }}
                    />
                ))}
            </Stack>

            <Grid container sx={{ minHeight: { xs: 360, md: 455 } }}>
                <Grid item xs={3} sm={2.7}>
                    <Stack
                        spacing={1}
                        sx={{
                            height: "100%",
                            p: 1.5,
                            borderRight: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {tools.map((item) => (
                            <Box
                                key={item}
                                sx={{
                                    p: 1.15,
                                    borderRadius: 2,
                                    color: "#dbe7f6",
                                    fontSize: 12,
                                    fontWeight: 850,
                                    backgroundColor:
                                        item === "Text Box"
                                            ? "rgba(82,215,255,0.14)"
                                            : "rgba(255,255,255,0.06)",
                                    border:
                                        item === "Text Box"
                                            ? "1px solid rgba(82,215,255,0.28)"
                                            : "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                {item}
                            </Box>
                        ))}
                    </Stack>
                </Grid>

                <Grid item xs={6} sm={6.2}>
                    <Box
                        sx={{
                            height: "100%",
                            p: 2.5,
                            display: "grid",
                            placeItems: "center",
                            background:
                                "linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%)",
                            backgroundSize: "26px 26px",
                        }}
                    >
                        <Box
                            sx={{
                                width: "100%",
                                maxWidth: 390,
                                aspectRatio: "1 / 1",
                                borderRadius: 4,
                                position: "relative",
                                overflow: "hidden",
                                background:
                                    "radial-gradient(circle at 35% 30%, #52d7ff, transparent 22%), radial-gradient(circle at 65% 62%, #ff3378, transparent 30%), linear-gradient(135deg, #172031, #0d111d)",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                            }}
                        >
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: "14%",
                                    top: "28%",
                                    width: "72%",
                                    height: "30%",
                                    border: "2px solid rgba(82,215,255,0.85)",
                                    backgroundColor: "rgba(0,0,0,0.28)",
                                    borderRadius: 2,
                                    p: 1.5,
                                    color: "#ffffff",
                                    fontSize: 22,
                                    fontWeight: 950,
                                    lineHeight: 1.1,
                                }}
                            >
                                Typeable
                                <br />
                                Text Box
                            </Box>

                            <Box
                                sx={{
                                    position: "absolute",
                                    right: 22,
                                    top: 22,
                                    px: 1.25,
                                    py: 0.65,
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 950,
                                    color: "#06101a",
                                    backgroundColor: "#52d7ff",
                                }}
                            >
                                Move + Type
                            </Box>
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={3} sm={3.1}>
                    <Stack
                        spacing={1.2}
                        sx={{
                            height: "100%",
                            p: 1.5,
                            borderLeft: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {["Image Layer", "Paint Layer", "Text Box", "Shape Layer"].map(
                            (layer, index) => (
                                <Box
                                    key={layer}
                                    sx={{
                                        borderRadius: 2,
                                        p: 1.25,
                                        fontSize: 12,
                                        fontWeight: 900,
                                        color: index === 2 ? "#e8faff" : "#c8d3e2",
                                        border:
                                            index === 2
                                                ? "1px solid rgba(82,215,255,0.55)"
                                                : "1px solid rgba(255,255,255,0.1)",
                                        backgroundColor:
                                            index === 2
                                                ? "rgba(82,215,255,0.13)"
                                                : "rgba(255,255,255,0.05)",
                                    }}
                                >
                                    {layer}
                                </Box>
                            )
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Paper>
    );
}

export function CanvasImageEditor() {
    const displayCanvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const projectInputRef = useRef(null);

    const layerCanvasesRef = useRef(new Map());
    const historyRef = useRef([]);
    const redoRef = useRef([]);
    const strokeRef = useRef(null);
    const dragRef = useRef(null);

    const [doc, setDoc] = useState({
        width: 1280,
        height: 720,
        background: "transparent",
    });

    const [layers, setLayers] = useState([]);
    const [activeLayerId, setActiveLayerId] = useState(null);

    const [textBoxes, setTextBoxes] = useState([]);
    const [activeTextBoxId, setActiveTextBoxId] = useState(null);

    const [tool, setTool] = useState("brush");
    const [color, setColor] = useState("#ff3355");
    const [brushShape, setBrushShape] = useState("softRound");
    const [brushSize, setBrushSize] = useState(36);
    const [brushHardness, setBrushHardness] = useState(0.65);
    const [brushOpacity, setBrushOpacity] = useState(0.85);
    const [brushFlow, setBrushFlow] = useState(0.55);
    const [brushSpacing, setBrushSpacing] = useState(0.18);

    const [wandTolerance, setWandTolerance] = useState(42);
    const [filterName, setFilterName] = useState("brightness");
    const [filterStrength, setFilterStrength] = useState(25);

    const [textValue, setTextValue] = useState("Text");
    const [fontSize, setFontSize] = useState(72);
    const [shapeType, setShapeType] = useState("rect");

    const [selectionMask, setSelectionMask] = useState(null);
    const [showMask, setShowMask] = useState(true);
    const [zoom, setZoom] = useState(0.75);
    const [status, setStatus] = useState("Ready");

    const docRef = useRef(doc);
    const layersRef = useRef(layers);
    const textBoxesRef = useRef(textBoxes);
    const activeLayerIdRef = useRef(activeLayerId);
    const activeTextBoxIdRef = useRef(activeTextBoxId);
    const selectionMaskRef = useRef(selectionMask);

    useEffect(() => {
        docRef.current = doc;
    }, [doc]);

    useEffect(() => {
        layersRef.current = layers;
    }, [layers]);

    useEffect(() => {
        textBoxesRef.current = textBoxes;
    }, [textBoxes]);

    useEffect(() => {
        activeLayerIdRef.current = activeLayerId;
    }, [activeLayerId]);

    useEffect(() => {
        activeTextBoxIdRef.current = activeTextBoxId;
    }, [activeTextBoxId]);

    useEffect(() => {
        selectionMaskRef.current = selectionMask;
    }, [selectionMask]);

    const getActiveLayer = useCallback(() => {
        return layersRef.current.find((layer) => layer.id === activeLayerIdRef.current);
    }, []);

    const getActiveCanvas = useCallback(() => {
        if (!activeLayerIdRef.current) return null;
        return layerCanvasesRef.current.get(activeLayerIdRef.current) || null;
    }, []);

    const setLayersImmediate = useCallback((nextLayers) => {
        layersRef.current = nextLayers;
        setLayers(nextLayers);
    }, []);

    const setTextBoxesImmediate = useCallback((nextTextBoxes) => {
        textBoxesRef.current = nextTextBoxes;
        setTextBoxes(nextTextBoxes);
    }, []);

    const setActiveLayerImmediate = useCallback((id) => {
        activeLayerIdRef.current = id;
        setActiveLayerId(id);
    }, []);

    const setActiveTextBoxImmediate = useCallback((id) => {
        activeTextBoxIdRef.current = id;
        setActiveTextBoxId(id);
    }, []);

    const addLayerImmediate = useCallback(
        (meta, canvas, makeActive = true) => {
            layerCanvasesRef.current.set(meta.id, canvas);

            const nextLayers = [...layersRef.current, meta];

            setLayersImmediate(nextLayers);

            if (makeActive) {
                setActiveLayerImmediate(meta.id);
                setActiveTextBoxImmediate(null);
            }
        },
        [setActiveLayerImmediate, setActiveTextBoxImmediate, setLayersImmediate]
    );

    const makeSnapshot = useCallback(() => {
        const snapshotLayers = layersRef.current.map((layer) => {
            const canvas = layerCanvasesRef.current.get(layer.id);

            return {
                ...layer,
                dataUrl: canvas ? canvas.toDataURL("image/png") : null,
            };
        });

        return {
            doc: { ...docRef.current },
            activeLayerId: activeLayerIdRef.current,
            activeTextBoxId: activeTextBoxIdRef.current,
            layers: snapshotLayers,
            textBoxes: textBoxesRef.current.map((box) => ({ ...box })),
        };
    }, []);

    const pushHistory = useCallback(() => {
        const snapshot = makeSnapshot();

        historyRef.current.push(snapshot);

        if (historyRef.current.length > 40) {
            historyRef.current.shift();
        }

        redoRef.current = [];
    }, [makeSnapshot]);

    const restoreSnapshot = useCallback(
        async (snapshot) => {
            const newMap = new Map();
            const newLayers = [];

            for (const savedLayer of snapshot.layers || []) {
                const { dataUrl, ...meta } = savedLayer;
                const canvas = makeCanvas(snapshot.doc.width, snapshot.doc.height);
                const ctx = canvas.getContext("2d");

                if (dataUrl) {
                    const image = await loadImage(dataUrl);
                    ctx.drawImage(image, 0, 0);
                }

                newMap.set(meta.id, canvas);
                newLayers.push(meta);
            }

            layerCanvasesRef.current = newMap;
            docRef.current = snapshot.doc;

            setDoc(snapshot.doc);
            setLayersImmediate(newLayers);
            setTextBoxesImmediate(snapshot.textBoxes || []);
            setActiveLayerImmediate(snapshot.activeLayerId || null);
            setActiveTextBoxImmediate(snapshot.activeTextBoxId || null);
            setSelectionMask(null);
            setStatus("Snapshot restored");
        },
        [
            setActiveLayerImmediate,
            setActiveTextBoxImmediate,
            setLayersImmediate,
            setTextBoxesImmediate,
        ]
    );

    const undo = useCallback(async () => {
        if (historyRef.current.length === 0) {
            setStatus("Nothing to undo");
            return;
        }

        const current = makeSnapshot();

        redoRef.current.push(current);

        const previous = historyRef.current.pop();

        await restoreSnapshot(previous);

        setStatus("Undo complete");
    }, [makeSnapshot, restoreSnapshot]);

    const redo = useCallback(async () => {
        if (redoRef.current.length === 0) {
            setStatus("Nothing to redo");
            return;
        }

        const current = makeSnapshot();

        historyRef.current.push(current);

        const next = redoRef.current.pop();

        await restoreSnapshot(next);

        setStatus("Redo complete");
    }, [makeSnapshot, restoreSnapshot]);

    const renderComposite = useCallback(() => {
        const displayCanvas = displayCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!displayCanvas || !overlayCanvas) return;

        const width = docRef.current.width;
        const height = docRef.current.height;

        if (displayCanvas.width !== width || displayCanvas.height !== height) {
            displayCanvas.width = width;
            displayCanvas.height = height;
        }

        if (overlayCanvas.width !== width || overlayCanvas.height !== height) {
            overlayCanvas.width = width;
            overlayCanvas.height = height;
        }

        const ctx = displayCanvas.getContext("2d");
        const overlayCtx = overlayCanvas.getContext("2d");

        ctx.clearRect(0, 0, width, height);
        overlayCtx.clearRect(0, 0, width, height);

        if (docRef.current.background !== "transparent") {
            ctx.fillStyle = docRef.current.background;
            ctx.fillRect(0, 0, width, height);
        }

        for (const layer of layersRef.current) {
            if (!layer.visible) continue;

            const layerCanvas = layerCanvasesRef.current.get(layer.id);
            if (!layerCanvas) continue;

            ctx.save();

            ctx.globalAlpha = layer.opacity;
            ctx.globalCompositeOperation = layer.blendMode || "source-over";

            ctx.translate(width / 2 + layer.x, height / 2 + layer.y);
            ctx.rotate((layer.rotation * Math.PI) / 180);
            ctx.scale(layer.scale, layer.scale);
            ctx.drawImage(layerCanvas, -width / 2, -height / 2);

            ctx.restore();
        }

        if (strokeRef.current?.canvas) {
            ctx.save();

            if (strokeRef.current.mode === "eraser") {
                ctx.globalCompositeOperation = "destination-out";
            } else {
                ctx.globalCompositeOperation = "source-over";
            }

            ctx.drawImage(strokeRef.current.canvas, 0, 0);
            ctx.restore();
        }

        if (showMask && selectionMaskRef.current) {
            const mask = selectionMaskRef.current;
            const maskImage = overlayCtx.createImageData(width, height);

            for (let i = 0; i < mask.data.length; i += 1) {
                const alpha = mask.data[i];

                if (alpha <= 0) continue;

                const index = i * 4;

                maskImage.data[index] = 0;
                maskImage.data[index + 1] = 180;
                maskImage.data[index + 2] = 255;
                maskImage.data[index + 3] = Math.min(95, alpha * 0.45);
            }

            overlayCtx.putImageData(maskImage, 0, 0);
        }
    }, [showMask]);

    useEffect(() => {
        renderComposite();
    }, [doc, layers, selectionMask, showMask, zoom, renderComposite]);

    const addBlankLayer = useCallback(
        (name = "Paint Layer") => {
            pushHistory();

            const meta = createLayerMeta(name, "paint");
            const canvas = makeCanvas(docRef.current.width, docRef.current.height);

            addLayerImmediate(meta, canvas, true);
            setStatus(`Added ${name}`);
        },
        [addLayerImmediate, pushHistory]
    );

    const ensureEditableLayer = useCallback(() => {
        const active = getActiveLayer();
        const canvas = getActiveCanvas();

        if (active && canvas) {
            return {
                layer: active,
                canvas,
            };
        }

        const meta = createLayerMeta("Paint Layer", "paint");
        const nextCanvas = makeCanvas(docRef.current.width, docRef.current.height);

        addLayerImmediate(meta, nextCanvas, true);

        return {
            layer: meta,
            canvas: nextCanvas,
        };
    }, [addLayerImmediate, getActiveCanvas, getActiveLayer]);

    const handleImageUpload = useCallback(
        async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            try {
                pushHistory();

                const dataUrl = await fileToDataUrl(file);
                const image = await loadImage(dataUrl);

                const hasNoLayers = layersRef.current.length === 0;
                const width = hasNoLayers ? image.width : docRef.current.width;
                const height = hasNoLayers ? image.height : docRef.current.height;

                if (hasNoLayers) {
                    layerCanvasesRef.current = new Map();

                    const nextDoc = {
                        width,
                        height,
                        background: "transparent",
                    };

                    docRef.current = nextDoc;

                    setDoc(nextDoc);
                    setLayersImmediate([]);
                    setTextBoxesImmediate([]);
                    setActiveLayerImmediate(null);
                    setActiveTextBoxImmediate(null);
                }

                const meta = createLayerMeta(file.name || "Image Layer", "image");
                const canvas = makeCanvas(width, height);
                const ctx = canvas.getContext("2d");

                if (hasNoLayers) {
                    ctx.drawImage(image, 0, 0);
                } else {
                    const scale = Math.min(width / image.width, height / image.height, 1);
                    const drawWidth = image.width * scale;
                    const drawHeight = image.height * scale;
                    const x = (width - drawWidth) / 2;
                    const y = (height - drawHeight) / 2;

                    ctx.drawImage(image, x, y, drawWidth, drawHeight);
                }

                addLayerImmediate(meta, canvas, true);
                setSelectionMask(null);
                setStatus(`Loaded ${file.name}`);
            } catch (error) {
                console.error(error);
                setStatus("Could not load image");
            } finally {
                event.target.value = "";
            }
        },
        [
            addLayerImmediate,
            pushHistory,
            setActiveLayerImmediate,
            setActiveTextBoxImmediate,
            setLayersImmediate,
            setTextBoxesImmediate,
        ]
    );

    const getCanvasPoint = useCallback((event) => {
        const canvas = overlayCanvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const x = ((event.clientX - rect.left) / rect.width) * docRef.current.width;
        const y = ((event.clientY - rect.top) / rect.height) * docRef.current.height;

        return {
            x: clamp(x, 0, docRef.current.width - 1),
            y: clamp(y, 0, docRef.current.height - 1),
        };
    }, []);

    const addTextBoxAtPoint = useCallback(
        (point = null) => {
            pushHistory();

            const width = Math.min(420, Math.max(240, docRef.current.width * 0.34));
            const height = 150;
            const x = point ? point.x : docRef.current.width * 0.24;
            const y = point ? point.y : docRef.current.height * 0.22;

            const textBox = createTextBoxMeta({
                x: clamp(x, 0, Math.max(0, docRef.current.width - width)),
                y: clamp(y, 0, Math.max(0, docRef.current.height - height)),
                width,
                height,
                color,
                fontSize: Math.max(28, Math.min(72, fontSize)),
            });

            const nextTextBoxes = [...textBoxesRef.current, textBox];

            setTextBoxesImmediate(nextTextBoxes);
            setActiveTextBoxImmediate(textBox.id);
            setActiveLayerImmediate(null);
            setTool("textBox");
            setStatus("Text box added. Type inside it or drag its top handle to move it.");
        },
        [
            color,
            fontSize,
            pushHistory,
            setActiveLayerImmediate,
            setActiveTextBoxImmediate,
            setTextBoxesImmediate,
        ]
    );

    const updateTextBox = useCallback(
        (id, patch) => {
            const nextTextBoxes = textBoxesRef.current.map((box) =>
                box.id === id
                    ? {
                        ...box,
                        ...patch,
                    }
                    : box
            );

            setTextBoxesImmediate(nextTextBoxes);
        },
        [setTextBoxesImmediate]
    );

    const deleteActiveTextBox = useCallback(() => {
        const activeId = activeTextBoxIdRef.current;

        if (!activeId) return;

        pushHistory();

        const nextTextBoxes = textBoxesRef.current.filter((box) => box.id !== activeId);

        setTextBoxesImmediate(nextTextBoxes);
        setActiveTextBoxImmediate(null);
        setStatus("Text box deleted");
    }, [pushHistory, setActiveTextBoxImmediate, setTextBoxesImmediate]);

    const duplicateActiveTextBox = useCallback(() => {
        const activeId = activeTextBoxIdRef.current;
        const activeBox = textBoxesRef.current.find((box) => box.id === activeId);

        if (!activeBox) return;

        pushHistory();

        const copy = {
            ...activeBox,
            id: uid(),
            name: `${activeBox.name || "Text Box"} Copy`,
            x: activeBox.x + 28,
            y: activeBox.y + 28,
        };

        setTextBoxesImmediate([...textBoxesRef.current, copy]);
        setActiveTextBoxImmediate(copy.id);
        setStatus("Text box duplicated");
    }, [pushHistory, setActiveTextBoxImmediate, setTextBoxesImmediate]);

    const createMagicWandSelection = useCallback(
        (x, y) => {
            const canvas = getActiveCanvas();
            const layer = getActiveLayer();

            if (!canvas || !layer) {
                setStatus("No active layer for magic wand");
                return;
            }

            const startX = Math.floor(x);
            const startY = Math.floor(y);
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const mask = floodFillMaskFromImageData(
                imageData,
                startX,
                startY,
                wandTolerance,
                null
            );

            setSelectionMask({
                width: mask.width,
                height: mask.height,
                data: mask.data,
            });

            setStatus(`Magic wand selected ${mask.count.toLocaleString()} pixels`);
        },
        [getActiveCanvas, getActiveLayer, wandTolerance]
    );

    const fillConnectedAtPoint = useCallback(
        (point) => {
            const editable = ensureEditableLayer();

            if (!editable.layer || !editable.canvas || editable.layer.locked) {
                setStatus("No editable active layer");
                return;
            }

            const canvas = editable.canvas;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const startX = Math.floor(point.x);
            const startY = Math.floor(point.y);

            const mask = floodFillMaskFromImageData(
                imageData,
                startX,
                startY,
                wandTolerance,
                selectionMaskRef.current
            );

            if (mask.count <= 0) {
                setStatus("Fill bucket found no editable pixels");
                return;
            }

            pushHistory();

            const pixels = imageData.data;
            const fillColor = hexToRgb(color);

            for (let i = 0; i < mask.data.length; i += 1) {
                if (mask.data[i] <= 0) continue;

                const index = i * 4;

                blendPixel(
                    pixels,
                    index,
                    fillColor.r,
                    fillColor.g,
                    fillColor.b,
                    brushOpacity
                );
            }

            ctx.putImageData(imageData, 0, 0);
            renderComposite();

            if (selectionMaskRef.current) {
                setStatus(
                    `Fill bucket painted ${mask.count.toLocaleString()} connected pixels inside the selection`
                );
            } else {
                setStatus(`Fill bucket painted ${mask.count.toLocaleString()} connected pixels`);
            }
        },
        [brushOpacity, color, ensureEditableLayer, pushHistory, renderComposite, wandTolerance]
    );

    const fillSelectionInActiveLayer = useCallback(() => {
        const editable = ensureEditableLayer();

        if (!editable.layer || !editable.canvas || editable.layer.locked) {
            setStatus("No editable active layer");
            return;
        }

        pushHistory();

        const canvas = editable.canvas;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const mask = selectionMaskRef.current;
        const fillColor = hexToRgb(color);

        let count = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            const pixelIndex = i / 4;
            const selected = mask ? mask.data[pixelIndex] / 255 : 1;

            if (selected <= 0) continue;

            blendPixel(
                pixels,
                i,
                fillColor.r,
                fillColor.g,
                fillColor.b,
                brushOpacity * selected
            );

            count += 1;
        }

        ctx.putImageData(imageData, 0, 0);
        renderComposite();

        if (mask) {
            setStatus(`Filled ${count.toLocaleString()} selected pixels`);
        } else {
            setStatus("Filled the whole active layer");
        }
    }, [brushOpacity, color, ensureEditableLayer, pushHistory, renderComposite]);

    const createRectangleSelection = useCallback((start, end) => {
        const width = docRef.current.width;
        const height = docRef.current.height;
        const mask = new Uint8ClampedArray(width * height);

        const x1 = Math.floor(Math.min(start.x, end.x));
        const x2 = Math.floor(Math.max(start.x, end.x));
        const y1 = Math.floor(Math.min(start.y, end.y));
        const y2 = Math.floor(Math.max(start.y, end.y));

        for (let y = y1; y <= y2; y += 1) {
            for (let x = x1; x <= x2; x += 1) {
                if (x < 0 || y < 0 || x >= width || y >= height) continue;

                mask[y * width + x] = 255;
            }
        }

        setSelectionMask({
            width,
            height,
            data: mask,
        });

        setStatus("Rectangle selection created");
    }, []);

    const createLassoSelection = useCallback((points) => {
        const width = docRef.current.width;
        const height = docRef.current.height;

        if (points.length < 3) return;

        const temp = makeCanvas(width, height);
        const ctx = temp.getContext("2d");

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (const point of points.slice(1)) {
            ctx.lineTo(point.x, point.y);
        }

        ctx.closePath();
        ctx.fill();

        const imageData = ctx.getImageData(0, 0, width, height);
        const mask = new Uint8ClampedArray(width * height);

        for (let i = 0; i < mask.length; i += 1) {
            mask[i] = imageData.data[i * 4 + 3];
        }

        setSelectionMask({
            width,
            height,
            data: mask,
        });

        setStatus("Lasso selection created");
    }, []);

    const invertSelection = useCallback(() => {
        if (!selectionMaskRef.current) {
            setStatus("No selection to invert");
            return;
        }

        const current = selectionMaskRef.current;
        const next = new Uint8ClampedArray(current.data.length);

        for (let i = 0; i < current.data.length; i += 1) {
            next[i] = 255 - current.data[i];
        }

        setSelectionMask({
            width: current.width,
            height: current.height,
            data: next,
        });

        setStatus("Selection inverted");
    }, []);

    const clearSelection = useCallback(() => {
        const hadSelection = Boolean(selectionMaskRef.current);

        selectionMaskRef.current = null;
        setSelectionMask(null);
        renderComposite();

        if (hadSelection) {
            setStatus("Selection deselected. Filters and fills now affect the whole active layer.");
        } else {
            setStatus("No selection active. Filters and fills already affect the whole active layer.");
        }
    }, [renderComposite]);

    const commitTempCanvasToActiveLayer = useCallback(
        (tempCanvas, mode = "paint") => {
            const activeCanvas = getActiveCanvas();
            const layer = getActiveLayer();

            if (!activeCanvas || !layer || layer.locked) return;

            const ctx = activeCanvas.getContext("2d");

            ctx.save();

            if (mode === "eraser") {
                ctx.globalCompositeOperation = "destination-out";
            } else {
                ctx.globalCompositeOperation = "source-over";
            }

            ctx.drawImage(tempCanvas, 0, 0);
            ctx.restore();

            renderComposite();
        },
        [getActiveCanvas, getActiveLayer, renderComposite]
    );

    const drawShapePreview = useCallback(
        (start, end) => {
            renderComposite();

            const overlay = overlayCanvasRef.current;
            const ctx = overlay.getContext("2d");

            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);

            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);

            if (shapeType === "circle") {
                ctx.beginPath();
                ctx.ellipse(
                    x + width / 2,
                    y + height / 2,
                    width / 2,
                    height / 2,
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.stroke();
            } else {
                ctx.strokeRect(x, y, width, height);
            }

            ctx.restore();
        },
        [color, renderComposite, shapeType]
    );

    const drawSelectionPreview = useCallback(
        (start, end) => {
            renderComposite();

            const overlay = overlayCanvasRef.current;
            const ctx = overlay.getContext("2d");

            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);

            ctx.save();
            ctx.strokeStyle = "#00ccff";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(x, y, width, height);
            ctx.restore();
        },
        [renderComposite]
    );

    const drawLassoPreview = useCallback(
        (points) => {
            renderComposite();

            if (points.length < 2) return;

            const overlay = overlayCanvasRef.current;
            const ctx = overlay.getContext("2d");

            ctx.save();
            ctx.strokeStyle = "#00ccff";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            for (const point of points.slice(1)) {
                ctx.lineTo(point.x, point.y);
            }

            ctx.stroke();
            ctx.restore();
        },
        [renderComposite]
    );

    const drawTextAtPoint = useCallback(
        (point) => {
            ensureEditableLayer();
            pushHistory();

            const temp = makeCanvas(docRef.current.width, docRef.current.height);
            const ctx = temp.getContext("2d");

            ctx.save();
            ctx.fillStyle = color;
            ctx.font = `${fontSize}px Arial, sans-serif`;
            ctx.textBaseline = "top";
            ctx.fillText(textValue || "Text", point.x, point.y);
            ctx.restore();

            applyMaskToCanvas(temp, selectionMaskRef.current);
            commitTempCanvasToActiveLayer(temp, "paint");

            setStatus(selectionMaskRef.current ? "Raster text added to selection" : "Raster text added");
        },
        [
            color,
            commitTempCanvasToActiveLayer,
            ensureEditableLayer,
            fontSize,
            pushHistory,
            textValue,
        ]
    );

    const drawShapeToLayer = useCallback(
        (start, end) => {
            ensureEditableLayer();

            const temp = makeCanvas(docRef.current.width, docRef.current.height);
            const ctx = temp.getContext("2d");

            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);

            ctx.save();
            ctx.fillStyle = rgba(color, brushOpacity);

            if (shapeType === "circle") {
                ctx.beginPath();
                ctx.ellipse(
                    x + width / 2,
                    y + height / 2,
                    width / 2,
                    height / 2,
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            } else {
                ctx.fillRect(x, y, width, height);
            }

            ctx.restore();

            applyMaskToCanvas(temp, selectionMaskRef.current);
            commitTempCanvasToActiveLayer(temp, "paint");

            setStatus(selectionMaskRef.current ? "Shape added to selection" : "Shape added");
        },
        [
            brushOpacity,
            color,
            commitTempCanvasToActiveLayer,
            ensureEditableLayer,
            shapeType,
        ]
    );

    const handlePointerDown = useCallback(
        (event) => {
            const point = getCanvasPoint(event);

            event.currentTarget.setPointerCapture?.(event.pointerId);

            if (tool === "textBox") {
                addTextBoxAtPoint(point);
                return;
            }

            if (tool === "wand") {
                createMagicWandSelection(point.x, point.y);
                return;
            }

            if (tool === "bucket") {
                fillConnectedAtPoint(point);
                return;
            }

            if (tool === "text") {
                drawTextAtPoint(point);
                return;
            }

            if (tool === "rectSelect") {
                dragRef.current = {
                    mode: "rectSelect",
                    start: point,
                    current: point,
                };

                drawSelectionPreview(point, point);
                return;
            }

            if (tool === "lasso") {
                dragRef.current = {
                    mode: "lasso",
                    points: [point],
                };

                drawLassoPreview([point]);
                return;
            }

            if (tool === "move") {
                const active = getActiveLayer();

                if (!active) return;

                pushHistory();

                dragRef.current = {
                    mode: "move",
                    start: point,
                    layerId: active.id,
                    originalX: active.x,
                    originalY: active.y,
                };

                return;
            }

            if (tool === "shape") {
                ensureEditableLayer();
                pushHistory();

                dragRef.current = {
                    mode: "shape",
                    start: point,
                    current: point,
                };

                drawShapePreview(point, point);
                return;
            }

            if (tool === "brush" || tool === "eraser") {
                ensureEditableLayer();
                pushHistory();

                const temp = makeCanvas(docRef.current.width, docRef.current.height);
                const ctx = temp.getContext("2d");

                strokeRef.current = {
                    mode: tool,
                    canvas: temp,
                    ctx,
                    last: point,
                };

                drawBrushLine(ctx, point, point, {
                    color,
                    shape: brushShape,
                    size: brushSize,
                    hardness: brushHardness,
                    opacity: brushOpacity,
                    flow: brushFlow,
                    spacing: brushSpacing,
                });

                renderComposite();
            }
        },
        [
            addTextBoxAtPoint,
            brushFlow,
            brushHardness,
            brushOpacity,
            brushShape,
            brushSize,
            brushSpacing,
            color,
            createMagicWandSelection,
            drawLassoPreview,
            drawSelectionPreview,
            drawShapePreview,
            drawTextAtPoint,
            ensureEditableLayer,
            fillConnectedAtPoint,
            getActiveLayer,
            getCanvasPoint,
            pushHistory,
            renderComposite,
            tool,
        ]
    );

    const handlePointerMove = useCallback(
        (event) => {
            const point = getCanvasPoint(event);

            if (strokeRef.current) {
                const stroke = strokeRef.current;

                drawBrushLine(stroke.ctx, stroke.last, point, {
                    color,
                    shape: brushShape,
                    size: brushSize,
                    hardness: brushHardness,
                    opacity: brushOpacity,
                    flow: brushFlow,
                    spacing: brushSpacing,
                });

                stroke.last = point;
                renderComposite();

                return;
            }

            if (!dragRef.current) return;

            const drag = dragRef.current;

            if (drag.mode === "move") {
                const dx = point.x - drag.start.x;
                const dy = point.y - drag.start.y;

                const nextLayers = layersRef.current.map((layer) =>
                    layer.id === drag.layerId
                        ? {
                            ...layer,
                            x: drag.originalX + dx,
                            y: drag.originalY + dy,
                        }
                        : layer
                );

                setLayersImmediate(nextLayers);

                return;
            }

            if (drag.mode === "shape") {
                drag.current = point;
                drawShapePreview(drag.start, point);
                return;
            }

            if (drag.mode === "rectSelect") {
                drag.current = point;
                drawSelectionPreview(drag.start, point);
                return;
            }

            if (drag.mode === "lasso") {
                drag.points.push(point);
                drawLassoPreview(drag.points);
            }
        },
        [
            brushFlow,
            brushHardness,
            brushOpacity,
            brushShape,
            brushSize,
            brushSpacing,
            color,
            drawLassoPreview,
            drawSelectionPreview,
            drawShapePreview,
            getCanvasPoint,
            renderComposite,
            setLayersImmediate,
        ]
    );

    const handlePointerUp = useCallback(() => {
        if (strokeRef.current) {
            const stroke = strokeRef.current;

            applyMaskToCanvas(stroke.canvas, selectionMaskRef.current);
            commitTempCanvasToActiveLayer(stroke.canvas, stroke.mode);

            strokeRef.current = null;

            if (stroke.mode === "eraser") {
                setStatus(
                    selectionMaskRef.current
                        ? "Erase stroke committed inside selection"
                        : "Erase stroke committed"
                );
            } else {
                setStatus(
                    selectionMaskRef.current
                        ? "Brush stroke committed inside selection"
                        : "Brush stroke committed"
                );
            }

            renderComposite();

            return;
        }

        if (!dragRef.current) return;

        const drag = dragRef.current;

        dragRef.current = null;

        if (drag.mode === "shape") {
            drawShapeToLayer(drag.start, drag.current);
            renderComposite();
            return;
        }

        if (drag.mode === "rectSelect") {
            createRectangleSelection(drag.start, drag.current);
            renderComposite();
            return;
        }

        if (drag.mode === "lasso") {
            createLassoSelection(drag.points);
            renderComposite();
            return;
        }

        if (drag.mode === "move") {
            setStatus("Layer moved");
        }
    }, [
        commitTempCanvasToActiveLayer,
        createLassoSelection,
        createRectangleSelection,
        drawShapeToLayer,
        renderComposite,
    ]);

    const applyFilterToActiveLayer = useCallback(() => {
        const canvas = getActiveCanvas();
        const layer = getActiveLayer();

        if (!canvas || !layer || layer.locked) {
            setStatus("No editable active layer");
            return;
        }

        pushHistory();

        const width = canvas.width;
        const height = canvas.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const original = ctx.getImageData(0, 0, width, height);
        const result = new ImageData(new Uint8ClampedArray(original.data), width, height);

        let computed = result;

        if (filterName === "blur") {
            computed = boxBlurImageData(original, Math.max(1, Math.abs(filterStrength) / 10));
        }

        if (filterName === "sharpen") {
            computed = sharpenImageData(original);
        }

        const src = original.data;
        const dst = computed.data;
        const out = result.data;
        const mask = selectionMaskRef.current;

        const contrastAmount = clamp(filterStrength, -254, 254);
        const contrastFactor =
            (259 * (contrastAmount + 255)) / (255 * (259 - contrastAmount));

        for (let i = 0; i < out.length; i += 4) {
            const pixelIndex = i / 4;
            const selected = mask ? mask.data[pixelIndex] / 255 : 1;

            if (selected <= 0) {
                out[i] = src[i];
                out[i + 1] = src[i + 1];
                out[i + 2] = src[i + 2];
                out[i + 3] = src[i + 3];
                continue;
            }

            let r = src[i];
            let g = src[i + 1];
            let b = src[i + 2];
            let a = src[i + 3];

            if (filterName === "brightness") {
                r = clamp(r + filterStrength);
                g = clamp(g + filterStrength);
                b = clamp(b + filterStrength);
            }

            if (filterName === "contrast") {
                r = clamp(contrastFactor * (r - 128) + 128);
                g = clamp(contrastFactor * (g - 128) + 128);
                b = clamp(contrastFactor * (b - 128) + 128);
            }

            if (filterName === "grayscale") {
                const gray = r * 0.299 + g * 0.587 + b * 0.114;

                r = gray;
                g = gray;
                b = gray;
            }

            if (filterName === "invert") {
                r = 255 - r;
                g = 255 - g;
                b = 255 - b;
            }

            if (filterName === "blur" || filterName === "sharpen") {
                r = dst[i];
                g = dst[i + 1];
                b = dst[i + 2];
                a = dst[i + 3];
            }

            out[i] = src[i] * (1 - selected) + r * selected;
            out[i + 1] = src[i + 1] * (1 - selected) + g * selected;
            out[i + 2] = src[i + 2] * (1 - selected) + b * selected;
            out[i + 3] = src[i + 3] * (1 - selected) + a * selected;
        }

        ctx.putImageData(result, 0, 0);
        renderComposite();

        setStatus(`Applied ${filterName} to ${mask ? "selection" : "whole active layer"}`);
    }, [
        filterName,
        filterStrength,
        getActiveCanvas,
        getActiveLayer,
        pushHistory,
        renderComposite,
    ]);

    const updateActiveLayer = useCallback(
        (patch) => {
            const activeId = activeLayerIdRef.current;

            if (!activeId) return;

            const nextLayers = layersRef.current.map((layer) =>
                layer.id === activeId
                    ? {
                        ...layer,
                        ...patch,
                    }
                    : layer
            );

            setLayersImmediate(nextLayers);
        },
        [setLayersImmediate]
    );

    const deleteActiveLayer = useCallback(() => {
        const activeId = activeLayerIdRef.current;

        if (!activeId) return;

        pushHistory();

        layerCanvasesRef.current.delete(activeId);

        const nextLayers = layersRef.current.filter((layer) => layer.id !== activeId);
        const nextActiveId = nextLayers[nextLayers.length - 1]?.id || null;

        setLayersImmediate(nextLayers);
        setActiveLayerImmediate(nextActiveId);
        setStatus("Layer deleted");
    }, [pushHistory, setActiveLayerImmediate, setLayersImmediate]);

    const moveLayer = useCallback(
        (id, direction) => {
            const index = layersRef.current.findIndex((layer) => layer.id === id);

            if (index < 0) return;

            const target = index + direction;

            if (target < 0 || target >= layersRef.current.length) return;

            pushHistory();

            const nextLayers = [...layersRef.current];
            const temp = nextLayers[index];

            nextLayers[index] = nextLayers[target];
            nextLayers[target] = temp;

            setLayersImmediate(nextLayers);
        },
        [pushHistory, setLayersImmediate]
    );

    const toggleLayerVisibility = useCallback(
        (id) => {
            const nextLayers = layersRef.current.map((layer) =>
                layer.id === id
                    ? {
                        ...layer,
                        visible: !layer.visible,
                    }
                    : layer
            );

            setLayersImmediate(nextLayers);
        },
        [setLayersImmediate]
    );

    const toggleTextBoxVisibility = useCallback(
        (id) => {
            const nextTextBoxes = textBoxesRef.current.map((box) =>
                box.id === id
                    ? {
                        ...box,
                        visible: !box.visible,
                    }
                    : box
            );

            setTextBoxesImmediate(nextTextBoxes);
        },
        [setTextBoxesImmediate]
    );

    const renderFlattenedCanvas = useCallback((mimeType = "image/png") => {
        const width = docRef.current.width;
        const height = docRef.current.height;
        const output = makeCanvas(width, height);
        const ctx = output.getContext("2d");

        if (mimeType === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
        } else if (docRef.current.background !== "transparent") {
            ctx.fillStyle = docRef.current.background;
            ctx.fillRect(0, 0, width, height);
        }

        for (const layer of layersRef.current) {
            if (!layer.visible) continue;

            const canvas = layerCanvasesRef.current.get(layer.id);
            if (!canvas) continue;

            ctx.save();

            ctx.globalAlpha = layer.opacity;
            ctx.globalCompositeOperation = layer.blendMode || "source-over";

            ctx.translate(width / 2 + layer.x, height / 2 + layer.y);
            ctx.rotate((layer.rotation * Math.PI) / 180);
            ctx.scale(layer.scale, layer.scale);
            ctx.drawImage(canvas, -width / 2, -height / 2);

            ctx.restore();
        }

        for (const textBox of textBoxesRef.current) {
            drawTextBoxToContext(ctx, textBox);
        }

        return output;
    }, []);

    const exportImage = useCallback(
        (mimeType) => {
            const output = renderFlattenedCanvas(mimeType);
            const extension =
                mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";

            output.toBlob(
                (blob) => {
                    if (!blob) {
                        setStatus("Export failed");
                        return;
                    }

                    downloadBlob(blob, `edited-image.${extension}`);
                    setStatus(`Exported ${extension.toUpperCase()} with text boxes`);
                },
                mimeType,
                0.95
            );
        },
        [renderFlattenedCanvas]
    );

    const saveProjectJson = useCallback(() => {
        const snapshot = makeSnapshot();

        const project = {
            app: "CanvasImageStudio",
            version: 3,
            savedAt: new Date().toISOString(),
            ...snapshot,
        };

        const blob = new Blob([JSON.stringify(project, null, 2)], {
            type: "application/json",
        });

        downloadBlob(blob, "image-project.json");
        setStatus("Project JSON saved");
    }, [makeSnapshot]);

    const loadProjectJson = useCallback(
        async (event) => {
            const file = event.target.files?.[0];

            if (!file) return;

            try {
                const text = await file.text();
                const project = JSON.parse(text);

                pushHistory();
                await restoreSnapshot({
                    ...project,
                    textBoxes: project.textBoxes || [],
                });

                setStatus("Project JSON loaded");
            } catch (error) {
                console.error(error);
                setStatus("Could not load project JSON");
            } finally {
                event.target.value = "";
            }
        },
        [pushHistory, restoreSnapshot]
    );

    const activeLayer = layers.find((layer) => layer.id === activeLayerId);
    const activeTextBox = textBoxes.find((box) => box.id === activeTextBoxId);
    const hasSelection = Boolean(selectionMask);

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                minHeight: 0,
                display: "grid",
                gridTemplateColumns: {
                    xs: "260px minmax(620px, 1fr) 300px",
                    lg: "310px minmax(760px, 1fr) 360px",
                },
                background: "#090b10",
                color: "#f5f7fb",
                overflow: "hidden",
            }}
        >
            <EditorLeftPanel
                fileInputRef={fileInputRef}
                handleImageUpload={handleImageUpload}
                addBlankLayer={addBlankLayer}
                addTextBoxAtPoint={addTextBoxAtPoint}
                tool={tool}
                setTool={setTool}
                color={color}
                setColor={setColor}
                brushShape={brushShape}
                setBrushShape={setBrushShape}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                brushHardness={brushHardness}
                setBrushHardness={setBrushHardness}
                brushOpacity={brushOpacity}
                setBrushOpacity={setBrushOpacity}
                brushFlow={brushFlow}
                setBrushFlow={setBrushFlow}
                brushSpacing={brushSpacing}
                setBrushSpacing={setBrushSpacing}
                wandTolerance={wandTolerance}
                setWandTolerance={setWandTolerance}
                invertSelection={invertSelection}
                clearSelection={clearSelection}
                fillSelectionInActiveLayer={fillSelectionInActiveLayer}
                hasSelection={hasSelection}
                showMask={showMask}
                setShowMask={setShowMask}
                filterName={filterName}
                setFilterName={setFilterName}
                filterStrength={filterStrength}
                setFilterStrength={setFilterStrength}
                applyFilterToActiveLayer={applyFilterToActiveLayer}
                textValue={textValue}
                setTextValue={setTextValue}
                fontSize={fontSize}
                setFontSize={setFontSize}
                shapeType={shapeType}
                setShapeType={setShapeType}
            />

            <EditorCanvasCenter
                undo={undo}
                redo={redo}
                exportImage={exportImage}
                saveProjectJson={saveProjectJson}
                loadProjectJson={loadProjectJson}
                projectInputRef={projectInputRef}
                zoom={zoom}
                setZoom={setZoom}
                doc={doc}
                displayCanvasRef={displayCanvasRef}
                overlayCanvasRef={overlayCanvasRef}
                handlePointerDown={handlePointerDown}
                handlePointerMove={handlePointerMove}
                handlePointerUp={handlePointerUp}
                status={status}
                tool={tool}
                textBoxes={textBoxes}
                activeTextBoxId={activeTextBoxId}
                setActiveTextBoxId={setActiveTextBoxImmediate}
                updateTextBox={updateTextBox}
                pushHistory={pushHistory}
            />

            <EditorRightPanel
                activeLayer={activeLayer}
                activeLayerId={activeLayerId}
                layers={layers}
                setActiveLayerId={(id) => {
                    setActiveLayerImmediate(id);
                    setActiveTextBoxImmediate(null);
                }}
                updateActiveLayer={updateActiveLayer}
                deleteActiveLayer={deleteActiveLayer}
                toggleLayerVisibility={toggleLayerVisibility}
                moveLayer={moveLayer}
                textBoxes={textBoxes}
                activeTextBox={activeTextBox}
                activeTextBoxId={activeTextBoxId}
                setActiveTextBoxId={(id) => {
                    setActiveTextBoxImmediate(id);
                    setActiveLayerImmediate(null);
                }}
                updateTextBox={updateTextBox}
                deleteActiveTextBox={deleteActiveTextBox}
                duplicateActiveTextBox={duplicateActiveTextBox}
                toggleTextBoxVisibility={toggleTextBoxVisibility}
                pushHistory={pushHistory}
            />
        </Box>
    );
}

function EditorLeftPanel(props) {
    return (
        <Paper
            elevation={0}
            square
            sx={{
                minHeight: 0,
                overflowY: "auto",
                p: 2,
                borderRight: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "#0e1118",
                color: "common.white",
            }}
        >
            <Stack spacing={2}>
                <Stack spacing={1}>
                    <Typography sx={{ fontSize: 22, fontWeight: 950 }}>
                        Canvas Studio
                    </Typography>

                    <Button
                        variant="contained"
                        startIcon={<UploadFileRounded />}
                        onClick={() => props.fileInputRef.current?.click()}
                        sx={editorPrimaryButtonSx}
                        fullWidth
                    >
                        Upload Image
                    </Button>

                    <input
                        ref={props.fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={props.handleImageUpload}
                        style={{ display: "none" }}
                    />

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<AddRounded />}
                            onClick={() => props.addBlankLayer("Paint Layer")}
                            sx={editorSecondaryButtonSx}
                            fullWidth
                        >
                            Paint Layer
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<TextFieldsRounded />}
                            onClick={() => props.addTextBoxAtPoint()}
                            sx={editorSecondaryButtonSx}
                            fullWidth
                        >
                            Text Box
                        </Button>
                    </Stack>
                </Stack>

                <Divider sx={editorDividerSx} />

                <FormControl fullWidth size="small">
                    <InputLabel sx={editorLabelSx}>Tool</InputLabel>
                    <Select
                        value={props.tool}
                        label="Tool"
                        onChange={(event) => props.setTool(event.target.value)}
                        sx={editorSelectSx}
                    >
                        <MenuItem value="move">Move Layer</MenuItem>
                        <MenuItem value="brush">Brush</MenuItem>
                        <MenuItem value="eraser">Eraser</MenuItem>
                        <MenuItem value="bucket">Fill Bucket</MenuItem>
                        <MenuItem value="wand">Magic Wand</MenuItem>
                        <MenuItem value="rectSelect">Rectangle Select</MenuItem>
                        <MenuItem value="lasso">Lasso Select</MenuItem>
                        <MenuItem value="textBox">Place Text Box</MenuItem>
                        <MenuItem value="text">Raster Text</MenuItem>
                        <MenuItem value="shape">Shape</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Paint / Fill Color"
                    type="color"
                    value={props.color}
                    onChange={(event) => props.setColor(event.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={editorTextFieldSx}
                />

                <Divider sx={editorDividerSx} />

                <PanelTitle icon={<TextFieldsRounded />} title="Live Text Boxes" />

                <Typography sx={{ color: "#91a3b8", fontSize: 12.5, lineHeight: 1.55 }}>
                    Click <strong>Add Text Box</strong> to place a typeable box. Drag the top handle
                    to move it, type inside it, then style it from the right panel. Text boxes export
                    with the final image.
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<TextFieldsRounded />}
                    onClick={() => props.addTextBoxAtPoint()}
                    sx={editorPrimaryButtonSx}
                    fullWidth
                >
                    Add Movable Text Box
                </Button>

                <Divider sx={editorDividerSx} />

                <PanelTitle icon={<BrushRounded />} title="Brush / Eraser" />

                <FormControl fullWidth size="small">
                    <InputLabel sx={editorLabelSx}>Brush Shape</InputLabel>
                    <Select
                        value={props.brushShape}
                        label="Brush Shape"
                        onChange={(event) => props.setBrushShape(event.target.value)}
                        sx={editorSelectSx}
                    >
                        {BRUSH_SHAPES.map((shape) => (
                            <MenuItem key={shape.value} value={shape.value}>
                                {shape.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <EditorSlider
                    label="Brush Size"
                    value={props.brushSize}
                    min={1}
                    max={220}
                    step={1}
                    suffix="px"
                    onChange={props.setBrushSize}
                />

                <EditorSlider
                    label="Hardness"
                    value={props.brushHardness}
                    min={0.01}
                    max={1}
                    step={0.01}
                    percent
                    onChange={props.setBrushHardness}
                />

                <EditorSlider
                    label="Opacity / Fill Strength"
                    value={props.brushOpacity}
                    min={0.01}
                    max={1}
                    step={0.01}
                    percent
                    onChange={props.setBrushOpacity}
                />

                <EditorSlider
                    label="Flow"
                    value={props.brushFlow}
                    min={0.01}
                    max={1}
                    step={0.01}
                    percent
                    onChange={props.setBrushFlow}
                />

                <EditorSlider
                    label="Spacing"
                    value={props.brushSpacing}
                    min={0.03}
                    max={1}
                    step={0.01}
                    percent
                    onChange={props.setBrushSpacing}
                />

                <Divider sx={editorDividerSx} />

                <PanelTitle icon={<PaletteRounded />} title="Fill / Selection" />

                <EditorSlider
                    label="Wand / Bucket Tolerance"
                    value={props.wandTolerance}
                    min={1}
                    max={180}
                    step={1}
                    onChange={props.setWandTolerance}
                />

                <Typography sx={{ color: "#91a3b8", fontSize: 12.5, lineHeight: 1.55 }}>
                    Fill Bucket paints connected pixels matching the clicked color. If a selection
                    exists, bucket fill stays inside that selection. Deselect to return filters and
                    fills back to the whole active layer.
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<PaletteRounded />}
                    onClick={props.fillSelectionInActiveLayer}
                    sx={editorPrimaryButtonSx}
                    fullWidth
                >
                    {props.hasSelection ? "Fill Selection" : "Fill Whole Layer"}
                </Button>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        onClick={props.invertSelection}
                        disabled={!props.hasSelection}
                        sx={editorSecondaryButtonSx}
                        fullWidth
                    >
                        Invert
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={props.clearSelection}
                        sx={editorSecondaryButtonSx}
                        fullWidth
                    >
                        {props.hasSelection ? "Deselect" : "No Selection"}
                    </Button>
                </Stack>

                <FormControlLabel
                    control={
                        <Switch
                            checked={props.showMask}
                            onChange={(event) => props.setShowMask(event.target.checked)}
                        />
                    }
                    label={props.hasSelection ? "Show selection mask" : "No active selection"}
                    sx={{
                        color: "#cbd5e1",
                        "& .MuiFormControlLabel-label": {
                            fontSize: 13,
                        },
                    }}
                />

                <Divider sx={editorDividerSx} />

                <PanelTitle icon={<TuneRounded />} title="Filters" />

                <FormControl fullWidth size="small">
                    <InputLabel sx={editorLabelSx}>Filter</InputLabel>
                    <Select
                        value={props.filterName}
                        label="Filter"
                        onChange={(event) => props.setFilterName(event.target.value)}
                        sx={editorSelectSx}
                    >
                        <MenuItem value="brightness">Brightness</MenuItem>
                        <MenuItem value="contrast">Contrast</MenuItem>
                        <MenuItem value="grayscale">Grayscale</MenuItem>
                        <MenuItem value="invert">Invert</MenuItem>
                        <MenuItem value="blur">Blur</MenuItem>
                        <MenuItem value="sharpen">Sharpen</MenuItem>
                    </Select>
                </FormControl>

                <EditorSlider
                    label="Strength"
                    value={props.filterStrength}
                    min={-100}
                    max={100}
                    step={1}
                    onChange={props.setFilterStrength}
                />

                <Button
                    variant="contained"
                    startIcon={<TuneRounded />}
                    onClick={props.applyFilterToActiveLayer}
                    sx={editorPrimaryButtonSx}
                    fullWidth
                >
                    {props.hasSelection ? "Apply Filter to Selection" : "Apply Filter to Whole Layer"}
                </Button>

                <Divider sx={editorDividerSx} />

                <PanelTitle icon={<TextFieldsRounded />} title="Raster Text / Shape" />

                <TextField
                    label="Raster Text"
                    value={props.textValue}
                    onChange={(event) => props.setTextValue(event.target.value)}
                    size="small"
                    fullWidth
                    sx={editorTextFieldSx}
                />

                <EditorSlider
                    label="Raster Font Size"
                    value={props.fontSize}
                    min={8}
                    max={220}
                    step={1}
                    suffix="px"
                    onChange={props.setFontSize}
                />

                <FormControl fullWidth size="small">
                    <InputLabel sx={editorLabelSx}>Shape</InputLabel>
                    <Select
                        value={props.shapeType}
                        label="Shape"
                        onChange={(event) => props.setShapeType(event.target.value)}
                        sx={editorSelectSx}
                    >
                        <MenuItem value="rect">Rectangle</MenuItem>
                        <MenuItem value="circle">Circle / Ellipse</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
        </Paper>
    );
}

function EditorCanvasCenter(props) {
    const cursor =
        props.tool === "move"
            ? "grab"
            : props.tool === "text"
                ? "text"
                : ["brush", "eraser", "bucket", "wand", "rectSelect", "lasso", "shape", "textBox"].includes(
                    props.tool
                )
                    ? "crosshair"
                    : "default";

    return (
        <Box
            sx={{
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                backgroundColor: "#080a0f",
            }}
        >
            <Paper
                elevation={0}
                square
                sx={{
                    flexShrink: 0,
                    px: 1.5,
                    py: 1.15,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "#0e1118",
                    color: "common.white",
                    overflowX: "auto",
                }}
            >
                <Button
                    variant="outlined"
                    startIcon={<UndoRounded />}
                    onClick={props.undo}
                    sx={editorTopButtonSx}
                >
                    Undo
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<RedoRounded />}
                    onClick={props.redo}
                    sx={editorTopButtonSx}
                >
                    Redo
                </Button>

                <Divider orientation="vertical" flexItem sx={editorDividerSx} />

                <Button
                    variant="outlined"
                    startIcon={<DownloadRounded />}
                    onClick={() => props.exportImage("image/png")}
                    sx={editorTopButtonSx}
                >
                    PNG
                </Button>

                <Button
                    variant="outlined"
                    onClick={() => props.exportImage("image/jpeg")}
                    sx={editorTopButtonSx}
                >
                    JPEG
                </Button>

                <Button
                    variant="outlined"
                    onClick={() => props.exportImage("image/webp")}
                    sx={editorTopButtonSx}
                >
                    WebP
                </Button>

                <Divider orientation="vertical" flexItem sx={editorDividerSx} />

                <Button
                    variant="outlined"
                    startIcon={<SaveRounded />}
                    onClick={props.saveProjectJson}
                    sx={editorTopButtonSx}
                >
                    Save JSON
                </Button>

                <Button
                    variant="outlined"
                    onClick={() => props.projectInputRef.current?.click()}
                    sx={editorTopButtonSx}
                >
                    Load JSON
                </Button>

                <input
                    ref={props.projectInputRef}
                    type="file"
                    accept="application/json"
                    onChange={props.loadProjectJson}
                    style={{ display: "none" }}
                />

                <Box sx={{ flex: 1 }} />

                <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ minWidth: 230, flexShrink: 0 }}
                >
                    <GridOnRounded sx={{ color: "#52d7ff", fontSize: 18 }} />

                    <Slider
                        value={props.zoom}
                        min={0.1}
                        max={2}
                        step={0.05}
                        onChange={(event, value) => props.setZoom(value)}
                        sx={{
                            color: "#52d7ff",
                        }}
                    />

                    <Typography sx={{ color: "#cbd5e1", fontSize: 12, width: 44 }}>
                        {Math.round(props.zoom * 100)}%
                    </Typography>
                </Stack>
            </Paper>

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "auto",
                    p: 4,
                    display: "grid",
                    placeItems: "center",
                    background:
                        "linear-gradient(45deg, rgba(255,255,255,0.035) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.035) 25%, transparent 25%), #07090d",
                    backgroundSize: "28px 28px",
                }}
            >
                <Box
                    sx={{
                        width: props.doc.width * props.zoom,
                        height: props.doc.height * props.zoom,
                        minWidth: props.doc.width * props.zoom,
                        minHeight: props.doc.height * props.zoom,
                        position: "relative",
                        boxShadow: "0 26px 90px rgba(0,0,0,0.5)",
                        backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                >
                    <canvas
                        ref={props.displayCanvasRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            imageRendering: props.zoom >= 1.5 ? "pixelated" : "auto",
                        }}
                    />

                    <canvas
                        ref={props.overlayCanvasRef}
                        onPointerDown={props.handlePointerDown}
                        onPointerMove={props.handlePointerMove}
                        onPointerUp={props.handlePointerUp}
                        onPointerCancel={props.handlePointerUp}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            cursor,
                            touchAction: "none",
                        }}
                    />

                    <TextBoxOverlayLayer
                        textBoxes={props.textBoxes}
                        activeTextBoxId={props.activeTextBoxId}
                        zoom={props.zoom}
                        setActiveTextBoxId={props.setActiveTextBoxId}
                        updateTextBox={props.updateTextBox}
                        pushHistory={props.pushHistory}
                    />
                </Box>
            </Box>

            <Paper
                elevation={0}
                square
                sx={{
                    flexShrink: 0,
                    px: 2,
                    py: 1,
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "#0e1118",
                    color: "#cbd5e1",
                }}
            >
                <Typography sx={{ fontSize: 13 }}>
                    <strong style={{ color: "#52d7ff" }}>Tool:</strong> {props.tool}{" "}
                    <span style={{ opacity: 0.6 }}>—</span> {props.status}
                </Typography>
            </Paper>
        </Box>
    );
}

function TextBoxOverlayLayer({
                                 textBoxes,
                                 activeTextBoxId,
                                 zoom,
                                 setActiveTextBoxId,
                                 updateTextBox,
                                 pushHistory,
                             }) {
    return (
        <Box
            sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
            }}
        >
            {textBoxes.map((box) => (
                <EditableTextBox
                    key={box.id}
                    box={box}
                    active={box.id === activeTextBoxId}
                    zoom={zoom}
                    setActiveTextBoxId={setActiveTextBoxId}
                    updateTextBox={updateTextBox}
                    pushHistory={pushHistory}
                />
            ))}
        </Box>
    );
}

function EditableTextBox({
                             box,
                             active,
                             zoom,
                             setActiveTextBoxId,
                             updateTextBox,
                             pushHistory,
                         }) {
    const dragRef = useRef(null);

    if (!box.visible) return null;

    const startDrag = (event) => {
        if (box.locked) return;

        event.stopPropagation();
        event.preventDefault();

        pushHistory();
        setActiveTextBoxId(box.id);

        event.currentTarget.setPointerCapture?.(event.pointerId);

        dragRef.current = {
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            originalX: box.x,
            originalY: box.y,
        };
    };

    const moveDrag = (event) => {
        if (!dragRef.current) return;

        event.stopPropagation();
        event.preventDefault();

        const dx = (event.clientX - dragRef.current.startClientX) / zoom;
        const dy = (event.clientY - dragRef.current.startClientY) / zoom;

        updateTextBox(box.id, {
            x: dragRef.current.originalX + dx,
            y: dragRef.current.originalY + dy,
        });
    };

    const endDrag = (event) => {
        if (!dragRef.current) return;

        event.stopPropagation();
        dragRef.current = null;
    };

    return (
        <Box
            onPointerDown={(event) => {
                event.stopPropagation();
                setActiveTextBoxId(box.id);
            }}
            sx={{
                position: "absolute",
                left: box.x * zoom,
                top: box.y * zoom,
                width: box.width * zoom,
                height: box.height * zoom,
                transform: `rotate(${box.rotation || 0}deg)`,
                transformOrigin: "top left",
                pointerEvents: "auto",
                border: active
                    ? "2px solid rgba(82,215,255,0.95)"
                    : `${Math.max(1, box.borderWidth || 1)}px solid ${rgba(
                        box.borderColor || "#52d7ff",
                        box.borderOpacity || 0.45
                    )}`,
                backgroundColor: rgba(box.backgroundColor || "#000000", box.backgroundOpacity || 0),
                boxShadow: active ? "0 0 0 3px rgba(82,215,255,0.18)" : "none",
                overflow: "hidden",
            }}
        >
            <Box
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                sx={{
                    height: Math.max(22, 26 * zoom),
                    px: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: box.locked ? "not-allowed" : "grab",
                    color: "#06101a",
                    background: active
                        ? "linear-gradient(135deg, #52d7ff, #7c5cff)"
                        : "rgba(82,215,255,0.65)",
                    fontSize: Math.max(10, 11 * zoom),
                    fontWeight: 950,
                    userSelect: "none",
                }}
            >
                <span>{box.locked ? "Locked Text Box" : "Drag Text Box"}</span>
                <span>{active ? "Active" : ""}</span>
            </Box>

            <textarea
                value={box.text}
                disabled={box.locked}
                onFocus={() => {
                    pushHistory();
                    setActiveTextBoxId(box.id);
                }}
                onPointerDown={(event) => {
                    event.stopPropagation();
                    setActiveTextBoxId(box.id);
                }}
                onChange={(event) =>
                    updateTextBox(box.id, {
                        text: event.target.value,
                    })
                }
                style={{
                    width: "100%",
                    height: `calc(100% - ${Math.max(22, 26 * zoom)}px)`,
                    resize: "none",
                    border: 0,
                    outline: 0,
                    boxSizing: "border-box",
                    padding: Math.max(6, (box.padding || 14) * zoom),
                    color: box.color || "#ffffff",
                    background: "transparent",
                    fontSize: Math.max(8, (box.fontSize || 48) * zoom),
                    lineHeight: box.lineHeight || 1.18,
                    fontFamily: box.fontFamily || "Arial",
                    fontWeight: box.fontWeight || "800",
                    textAlign: box.align || "left",
                    overflow: "hidden",
                }}
            />
        </Box>
    );
}

function EditorRightPanel(props) {
    return (
        <Paper
            elevation={0}
            square
            sx={{
                minHeight: 0,
                overflowY: "auto",
                p: 2,
                borderLeft: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "#0e1118",
                color: "common.white",
            }}
        >
            <Stack spacing={2}>
                <PanelTitle icon={<TextFieldsRounded />} title="Text Boxes" />

                <Stack spacing={1}>
                    {props.textBoxes.map((box) => {
                        const selected = box.id === props.activeTextBoxId;

                        return (
                            <Paper
                                key={box.id}
                                elevation={0}
                                onClick={() => props.setActiveTextBoxId(box.id)}
                                sx={{
                                    p: 1.2,
                                    borderRadius: 2.5,
                                    cursor: "pointer",
                                    color: "common.white",
                                    border: selected
                                        ? "1px solid rgba(82,215,255,0.65)"
                                        : "1px solid rgba(255,255,255,0.1)",
                                    backgroundColor: selected
                                        ? "rgba(82,215,255,0.12)"
                                        : "rgba(255,255,255,0.045)",
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <IconButton
                                        size="small"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            props.toggleTextBoxVisibility(box.id);
                                        }}
                                        sx={{ color: box.visible ? "#52d7ff" : "#718096" }}
                                    >
                                        {box.visible ? (
                                            <VisibilityRounded fontSize="small" />
                                        ) : (
                                            <VisibilityOffRounded fontSize="small" />
                                        )}
                                    </IconButton>

                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                fontWeight: 950,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {box.name || "Text Box"}
                                        </Typography>

                                        <Typography sx={{ color: "#91a3b8", fontSize: 11.5 }}>
                                            {box.width.toFixed(0)}×{box.height.toFixed(0)} ·{" "}
                                            {box.fontSize}px
                                            {box.locked ? " · locked" : ""}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        );
                    })}

                    {props.textBoxes.length === 0 && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 2.5,
                                color: "#91a3b8",
                                backgroundColor: "rgba(255,255,255,0.045)",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}
                        >
                            <Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>
                                Click Add Text Box to place editable text over the image.
                            </Typography>
                        </Paper>
                    )}
                </Stack>

                {props.activeTextBox && (
                    <>
                        <Divider sx={editorDividerSx} />

                        <PanelTitle icon={<TuneRounded />} title="Active Text Box" />

                        <Stack spacing={1.5}>
                            <TextField
                                label="Name"
                                value={props.activeTextBox.name}
                                onFocus={props.pushHistory}
                                onChange={(event) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        name: event.target.value,
                                    })
                                }
                                size="small"
                                fullWidth
                                sx={editorTextFieldSx}
                            />

                            <TextField
                                label="Text"
                                value={props.activeTextBox.text}
                                onFocus={props.pushHistory}
                                onChange={(event) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        text: event.target.value,
                                    })
                                }
                                size="small"
                                fullWidth
                                multiline
                                minRows={3}
                                sx={editorTextFieldSx}
                            />

                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="outlined"
                                    onClick={props.duplicateActiveTextBox}
                                    sx={editorSecondaryButtonSx}
                                    fullWidth
                                >
                                    Duplicate
                                </Button>

                                <Button
                                    variant="outlined"
                                    onClick={props.deleteActiveTextBox}
                                    sx={{
                                        ...editorSecondaryButtonSx,
                                        color: "#ff7b96",
                                        borderColor: "rgba(255,123,150,0.35)",
                                    }}
                                    fullWidth
                                >
                                    Delete
                                </Button>
                            </Stack>

                            <Stack direction="row" spacing={1}>
                                <TextField
                                    label="Text Color"
                                    type="color"
                                    value={props.activeTextBox.color}
                                    onChange={(event) =>
                                        props.updateTextBox(props.activeTextBox.id, {
                                            color: event.target.value,
                                        })
                                    }
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={editorTextFieldSx}
                                />

                                <TextField
                                    label="Box Color"
                                    type="color"
                                    value={props.activeTextBox.backgroundColor}
                                    onChange={(event) =>
                                        props.updateTextBox(props.activeTextBox.id, {
                                            backgroundColor: event.target.value,
                                        })
                                    }
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={editorTextFieldSx}
                                />
                            </Stack>

                            <Stack direction="row" spacing={1}>
                                <TextField
                                    label="Border"
                                    type="color"
                                    value={props.activeTextBox.borderColor}
                                    onChange={(event) =>
                                        props.updateTextBox(props.activeTextBox.id, {
                                            borderColor: event.target.value,
                                        })
                                    }
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={editorTextFieldSx}
                                />

                                <FormControl fullWidth size="small">
                                    <InputLabel sx={editorLabelSx}>Align</InputLabel>
                                    <Select
                                        value={props.activeTextBox.align}
                                        label="Align"
                                        onChange={(event) =>
                                            props.updateTextBox(props.activeTextBox.id, {
                                                align: event.target.value,
                                            })
                                        }
                                        sx={editorSelectSx}
                                    >
                                        <MenuItem value="left">Left</MenuItem>
                                        <MenuItem value="center">Center</MenuItem>
                                        <MenuItem value="right">Right</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>

                            <FormControl fullWidth size="small">
                                <InputLabel sx={editorLabelSx}>Font</InputLabel>
                                <Select
                                    value={props.activeTextBox.fontFamily}
                                    label="Font"
                                    onChange={(event) =>
                                        props.updateTextBox(props.activeTextBox.id, {
                                            fontFamily: event.target.value,
                                        })
                                    }
                                    sx={editorSelectSx}
                                >
                                    {FONT_FAMILIES.map((font) => (
                                        <MenuItem key={font} value={font}>
                                            {font}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel sx={editorLabelSx}>Weight</InputLabel>
                                <Select
                                    value={props.activeTextBox.fontWeight}
                                    label="Weight"
                                    onChange={(event) =>
                                        props.updateTextBox(props.activeTextBox.id, {
                                            fontWeight: event.target.value,
                                        })
                                    }
                                    sx={editorSelectSx}
                                >
                                    <MenuItem value="400">Regular</MenuItem>
                                    <MenuItem value="600">Semi Bold</MenuItem>
                                    <MenuItem value="700">Bold</MenuItem>
                                    <MenuItem value="800">Extra Bold</MenuItem>
                                    <MenuItem value="900">Black</MenuItem>
                                </Select>
                            </FormControl>

                            <EditorSlider
                                label="Font Size"
                                value={props.activeTextBox.fontSize}
                                min={8}
                                max={220}
                                step={1}
                                suffix="px"
                                onChange={(value) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        fontSize: value,
                                    })
                                }
                            />

                            <EditorSlider
                                label="Box Width"
                                value={props.activeTextBox.width}
                                min={80}
                                max={1200}
                                step={1}
                                suffix="px"
                                onChange={(value) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        width: value,
                                    })
                                }
                            />

                            <EditorSlider
                                label="Box Height"
                                value={props.activeTextBox.height}
                                min={50}
                                max={900}
                                step={1}
                                suffix="px"
                                onChange={(value) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        height: value,
                                    })
                                }
                            />

                            <EditorSlider
                                label="X Position"
                                value={props.activeTextBox.x}
                                min={-1000}
                                max={2000}
                                step={1}
                                suffix="px"
                                onChange={(value) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        x: value,
                                    })
                                }
                            />

                            <EditorSlider
                                label="Y Position"
                                value={props.activeTextBox.y}
                                min={-1000}
                                max={2000}
                                step={1}
                                suffix="px"
                                onChange={(value) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        y: value,
                                    })
                                }
                            />

                            <EditorSlider
                                label="Rotation"
                                value={props.activeTextBox.rotation}
                                min={-180}
                                max={180}
                                step={1}
                                suffix="°"
                                onChange={(value) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        rotation: value,
                                    })
                                }
                            />

                            <EditorSlider
                                label="Background Opacity"
                                value={props.activeTextBox.backgroundOpacity}
                                min={0}
                                max={1}
                                step={0.01}
                                percent
                                onChange={(value) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        backgroundOpacity: value,
                                    })
                                }
                            />

                            <EditorSlider
                                label="Border Width"
                                value={props.activeTextBox.borderWidth}
                                min={0}
                                max={20}
                                step={1}
                                suffix="px"
                                onChange={(value) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        borderWidth: value,
                                    })
                                }
                            />

                            <EditorSlider
                                label="Border Opacity"
                                value={props.activeTextBox.borderOpacity}
                                min={0}
                                max={1}
                                step={0.01}
                                percent
                                onChange={(value) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        borderOpacity: value,
                                    })
                                }
                            />

                            <EditorSlider
                                label="Padding"
                                value={props.activeTextBox.padding}
                                min={0}
                                max={80}
                                step={1}
                                suffix="px"
                                onChange={(value) =>
                                    props.updateTextBox(props.activeTextBox.id, {
                                        padding: value,
                                    })
                                }
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={props.activeTextBox.locked}
                                        onChange={(event) =>
                                            props.updateTextBox(props.activeTextBox.id, {
                                                locked: event.target.checked,
                                            })
                                        }
                                    />
                                }
                                label="Lock text box"
                                sx={{
                                    color: "#cbd5e1",
                                    "& .MuiFormControlLabel-label": {
                                        fontSize: 13,
                                    },
                                }}
                            />
                        </Stack>
                    </>
                )}

                <Divider sx={editorDividerSx} />

                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <PanelTitle icon={<LayersRounded />} title="Raster Layers" />

                    <Tooltip title="Delete active layer">
                        <span>
                            <IconButton
                                disabled={!props.activeLayer}
                                onClick={props.deleteActiveLayer}
                                sx={{
                                    color: "#ff6b8a",
                                }}
                            >
                                <DeleteRounded />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Stack>

                <Stack spacing={1.1}>
                    {[...props.layers].reverse().map((layer, reversedIndex) => {
                        const realIndex = props.layers.length - 1 - reversedIndex;
                        const selected = layer.id === props.activeLayerId;

                        return (
                            <Paper
                                key={layer.id}
                                elevation={0}
                                onClick={() => props.setActiveLayerId(layer.id)}
                                sx={{
                                    p: 1.2,
                                    borderRadius: 2.5,
                                    cursor: "pointer",
                                    color: "common.white",
                                    border: selected
                                        ? "1px solid rgba(82,215,255,0.65)"
                                        : "1px solid rgba(255,255,255,0.1)",
                                    backgroundColor: selected
                                        ? "rgba(82,215,255,0.12)"
                                        : "rgba(255,255,255,0.045)",
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <IconButton
                                        size="small"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            props.toggleLayerVisibility(layer.id);
                                        }}
                                        sx={{ color: layer.visible ? "#52d7ff" : "#718096" }}
                                    >
                                        {layer.visible ? (
                                            <VisibilityRounded fontSize="small" />
                                        ) : (
                                            <VisibilityOffRounded fontSize="small" />
                                        )}
                                    </IconButton>

                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                fontWeight: 950,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {layer.name}
                                        </Typography>

                                        <Typography sx={{ color: "#91a3b8", fontSize: 11.5 }}>
                                            {layer.type} · {Math.round(layer.opacity * 100)}%
                                            {layer.locked ? " · locked" : ""}
                                        </Typography>
                                    </Box>
                                </Stack>

                                {selected && (
                                    <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            disabled={realIndex >= props.layers.length - 1}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                props.moveLayer(layer.id, 1);
                                            }}
                                            sx={layerMiniButtonSx}
                                        >
                                            Up
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            disabled={realIndex <= 0}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                props.moveLayer(layer.id, -1);
                                            }}
                                            sx={layerMiniButtonSx}
                                        >
                                            Down
                                        </Button>
                                    </Stack>
                                )}
                            </Paper>
                        );
                    })}

                    {props.layers.length === 0 && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 2.5,
                                color: "#91a3b8",
                                backgroundColor: "rgba(255,255,255,0.045)",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}
                        >
                            <Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>
                                Upload an image or add a paint layer to begin.
                            </Typography>
                        </Paper>
                    )}
                </Stack>

                <Divider sx={editorDividerSx} />

                <PanelTitle icon={<TuneRounded />} title="Active Raster Layer" />

                {!props.activeLayer && (
                    <Typography sx={{ color: "#91a3b8", fontSize: 13 }}>
                        No active raster layer selected.
                    </Typography>
                )}

                {props.activeLayer && (
                    <Stack spacing={1.5}>
                        <TextField
                            label="Layer Name"
                            value={props.activeLayer.name}
                            onChange={(event) =>
                                props.updateActiveLayer({
                                    name: event.target.value,
                                })
                            }
                            size="small"
                            fullWidth
                            sx={editorTextFieldSx}
                        />

                        <FormControl fullWidth size="small">
                            <InputLabel sx={editorLabelSx}>Blend Mode</InputLabel>
                            <Select
                                value={props.activeLayer.blendMode}
                                label="Blend Mode"
                                onChange={(event) =>
                                    props.updateActiveLayer({
                                        blendMode: event.target.value,
                                    })
                                }
                                sx={editorSelectSx}
                            >
                                {BLEND_MODES.map((mode) => (
                                    <MenuItem key={mode.value} value={mode.value}>
                                        {mode.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <EditorSlider
                            label="Opacity"
                            value={props.activeLayer.opacity}
                            min={0}
                            max={1}
                            step={0.01}
                            percent
                            onChange={(value) =>
                                props.updateActiveLayer({
                                    opacity: value,
                                })
                            }
                        />

                        <EditorSlider
                            label="X Offset"
                            value={props.activeLayer.x}
                            min={-1000}
                            max={1000}
                            step={1}
                            suffix="px"
                            onChange={(value) =>
                                props.updateActiveLayer({
                                    x: value,
                                })
                            }
                        />

                        <EditorSlider
                            label="Y Offset"
                            value={props.activeLayer.y}
                            min={-1000}
                            max={1000}
                            step={1}
                            suffix="px"
                            onChange={(value) =>
                                props.updateActiveLayer({
                                    y: value,
                                })
                            }
                        />

                        <EditorSlider
                            label="Scale"
                            value={props.activeLayer.scale}
                            min={0.05}
                            max={4}
                            step={0.01}
                            onChange={(value) =>
                                props.updateActiveLayer({
                                    scale: value,
                                })
                            }
                        />

                        <EditorSlider
                            label="Rotation"
                            value={props.activeLayer.rotation}
                            min={-180}
                            max={180}
                            step={1}
                            suffix="°"
                            onChange={(value) =>
                                props.updateActiveLayer({
                                    rotation: value,
                                })
                            }
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={props.activeLayer.locked}
                                    onChange={(event) =>
                                        props.updateActiveLayer({
                                            locked: event.target.checked,
                                        })
                                    }
                                />
                            }
                            label="Lock layer editing"
                            sx={{
                                color: "#cbd5e1",
                                "& .MuiFormControlLabel-label": {
                                    fontSize: 13,
                                },
                            }}
                        />
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

function PanelTitle({ icon, title }) {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Box
                sx={{
                    width: 30,
                    height: 30,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 1.5,
                    color: "#52d7ff",
                    backgroundColor: "rgba(82,215,255,0.1)",
                    "& svg": {
                        fontSize: 18,
                    },
                }}
            >
                {icon}
            </Box>

            <Typography sx={{ fontSize: 15, fontWeight: 950 }}>{title}</Typography>
        </Stack>
    );
}

function EditorSlider({
                          label,
                          value,
                          min,
                          max,
                          step,
                          onChange,
                          suffix = "",
                          percent = false,
                      }) {
    const displayValue = percent ? `${Math.round(value * 100)}%` : `${Number(value).toFixed(step < 1 ? 2 : 0)}${suffix}`;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.35 }}>
                <Typography sx={{ color: "#cbd5e1", fontSize: 12.5, fontWeight: 800 }}>
                    {label}
                </Typography>

                <Typography sx={{ color: "#91a3b8", fontSize: 12 }}>
                    {displayValue}
                </Typography>
            </Stack>

            <Slider
                value={Number(value)}
                min={min}
                max={max}
                step={step}
                onChange={(event, nextValue) => onChange(nextValue)}
                sx={{
                    color: "#52d7ff",
                    py: 0.5,
                }}
            />
        </Box>
    );
}

const primaryButtonSx = {
    minHeight: 52,
    px: 3,
    borderRadius: 999,
    color: "#06101a",
    fontWeight: 950,
    background: "linear-gradient(135deg, #52d7ff, #7c5cff)",
    boxShadow: "0 18px 50px rgba(82, 215, 255, 0.28)",
    textTransform: "none",
    "&:hover": {
        background: "linear-gradient(135deg, #7ee3ff, #9278ff)",
    },
};

const secondaryButtonSx = {
    minHeight: 52,
    px: 3,
    borderRadius: 999,
    color: "#f7f9fc",
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.055)",
    fontWeight: 850,
    textTransform: "none",
    backdropFilter: "blur(12px)",
    "&:hover": {
        borderColor: "rgba(82,215,255,0.45)",
        backgroundColor: "rgba(82,215,255,0.09)",
    },
};

const editorPrimaryButtonSx = {
    borderRadius: 2,
    color: "#06101a",
    fontWeight: 950,
    textTransform: "none",
    background: "linear-gradient(135deg, #52d7ff, #7c5cff)",
    boxShadow: "0 14px 38px rgba(82, 215, 255, 0.18)",
    "&:hover": {
        background: "linear-gradient(135deg, #7ee3ff, #9278ff)",
    },
};

const editorSecondaryButtonSx = {
    borderRadius: 2,
    color: "#f5f7fb",
    borderColor: "rgba(255,255,255,0.16)",
    fontWeight: 850,
    textTransform: "none",
    "&:hover": {
        borderColor: "rgba(82,215,255,0.4)",
        backgroundColor: "rgba(82,215,255,0.08)",
    },
    "&.Mui-disabled": {
        color: "rgba(255,255,255,0.35)",
        borderColor: "rgba(255,255,255,0.08)",
    },
};

const editorTopButtonSx = {
    flexShrink: 0,
    borderRadius: 2,
    color: "#f5f7fb",
    borderColor: "rgba(255,255,255,0.16)",
    fontWeight: 850,
    textTransform: "none",
    "&:hover": {
        borderColor: "rgba(82,215,255,0.4)",
        backgroundColor: "rgba(82,215,255,0.08)",
    },
};

const layerMiniButtonSx = {
    flex: 1,
    minWidth: 0,
    color: "#f5f7fb",
    borderColor: "rgba(255,255,255,0.14)",
    fontSize: 12,
    fontWeight: 850,
    textTransform: "none",
    "&:hover": {
        borderColor: "rgba(82,215,255,0.4)",
        backgroundColor: "rgba(82,215,255,0.08)",
    },
};

const editorDividerSx = {
    borderColor: "rgba(255,255,255,0.1)",
};

const editorLabelSx = {
    color: "#91a3b8",
    "&.Mui-focused": {
        color: "#52d7ff",
    },
};

const editorSelectSx = {
    color: "#f5f7fb",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.045)",
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(255,255,255,0.16)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(82,215,255,0.4)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#52d7ff",
    },
    "& .MuiSvgIcon-root": {
        color: "#cbd5e1",
    },
};

const editorTextFieldSx = {
    "& .MuiInputBase-root": {
        color: "#f5f7fb",
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.045)",
    },
    "& .MuiInputLabel-root": {
        color: "#91a3b8",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#52d7ff",
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(255,255,255,0.16)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(82,215,255,0.4)",
    },
    "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#52d7ff",
    },
};