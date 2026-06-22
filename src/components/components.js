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
    ImageRounded,
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

const uid = () => `layer_${Date.now()}_${Math.random().toString(16).slice(2)}`;

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
    const clean = hex.replace("#", "");

    if (clean.length === 3) {
        return {
            r: parseInt(clean[0] + clean[0], 16),
            g: parseInt(clean[1] + clean[1], 16),
            b: parseInt(clean[2] + clean[2], 16),
        };
    }

    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
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

function stampBrush(ctx, x, y, options) {
    const size = Math.max(1, options.size);
    const radius = size / 2;
    const alpha = clamp(options.opacity * options.flow, 0, 1);
    const hardness = clamp(options.hardness, 0.01, 1);

    ctx.save();

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
                            Edit, paint, select, filter, and export images directly in your browser.
                        </Typography>

                        <Typography
                            sx={{
                                maxWidth: 760,
                                color: "#b9c5d6",
                                fontSize: { xs: "1rem", md: "1.25rem" },
                                lineHeight: 1.7,
                            }}
                        >
                            A Photoshop-style canvas editor built with layers, brushes, magic wand
                            selections, lasso tools, selection-aware filters, shapes, text tools,
                            project saves, and direct PNG, JPEG, or WebP export.
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

                        <Grid container spacing={1.5} sx={{ pt: 2 }}>
                            <Grid item xs={12} sm={4}>
                                <StatCard
                                    title="Layers"
                                    text="Stack, move, rotate, scale, hide, blend, and export."
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <StatCard
                                    title="Selections"
                                    text="Magic wand, rectangle select, lasso, invert, and masks."
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <StatCard
                                    title="Brushes"
                                    text="Size, hardness, opacity, flow, spacing, eraser, and shapes."
                                />
                            </Grid>
                        </Grid>
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
            icon: <AutoFixHighRounded />,
            title: "Magic Wand",
            text: "Click into an image to select similar pixels using tolerance-based flood selection.",
        },
        {
            icon: <SelectAllRounded />,
            title: "Lasso & Rectangle Select",
            text: "Build mask-based selections that can control brushes, erasers, filters, text, and shapes.",
        },
        {
            icon: <BrushRounded />,
            title: "Advanced Brushes",
            text: "Paint with size, hardness, opacity, flow, spacing, color, and soft brush stamping.",
        },
        {
            icon: <TuneRounded />,
            title: "Selection Filters",
            text: "Apply brightness, contrast, grayscale, invert, blur, and sharpen to full layers or selected areas.",
        },
        {
            icon: <PaletteRounded />,
            title: "Text & Shapes",
            text: "Add text, draw rectangles, draw circles, and render those edits into the active layer.",
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
                        The app is built around a true layered canvas system instead of a simple
                        one-canvas drawing demo. Edits can be stacked, masked, filtered, saved,
                        restored, and exported cleanly.
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
            title: "Select",
            text: "Use wand, lasso, or rectangle selection to isolate areas.",
        },
        {
            number: "03",
            title: "Edit",
            text: "Paint, erase, add text, add shapes, and apply filters.",
        },
        {
            number: "04",
            title: "Export",
            text: "Flatten visible layers into PNG, JPEG, or WebP.",
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
                            Upload. Select. Edit. Export.
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

function StatCard({ title, text }) {
    return (
        <Paper
            elevation={0}
            sx={{
                height: "100%",
                p: 2,
                borderRadius: 3,
                color: "common.white",
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.055)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
        >
            <Typography sx={{ fontWeight: 950, mb: 0.75 }}>{title}</Typography>
            <Typography sx={{ color: "#b9c5d6", fontSize: 14, lineHeight: 1.55 }}>
                {text}
            </Typography>
        </Paper>
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
                transition: "transform 180ms ease, border-color 180ms ease, background 180ms ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: "rgba(82,215,255,0.35)",
                    background:
                        "linear-gradient(180deg, rgba(82,215,255,0.11), rgba(255,255,255,0.04))",
                },
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
    const tools = ["Move", "Brush", "Eraser", "Wand", "Lasso", "Text", "Shape", "Filter"];

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
                {["#ff5f57", "#ffbd2e", "#28c840"].map((color) => (
                    <Box
                        key={color}
                        sx={{
                            width: 11,
                            height: 11,
                            borderRadius: "50%",
                            backgroundColor: color,
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
                        {tools.map((tool) => (
                            <Box
                                key={tool}
                                sx={{
                                    p: 1.15,
                                    borderRadius: 2,
                                    color: "#dbe7f6",
                                    fontSize: 12,
                                    fontWeight: 850,
                                    backgroundColor:
                                        tool === "Wand"
                                            ? "rgba(82,215,255,0.14)"
                                            : "rgba(255,255,255,0.06)",
                                    border:
                                        tool === "Wand"
                                            ? "1px solid rgba(82,215,255,0.28)"
                                            : "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                {tool}
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
                                    inset: "18% 20% 28% 18%",
                                    border: "2px dashed rgba(82,215,255,0.9)",
                                    borderRadius: "42% 34% 48% 28%",
                                    backgroundColor: "rgba(82,215,255,0.14)",
                                }}
                            />

                            <Box
                                sx={{
                                    position: "absolute",
                                    width: "58%",
                                    height: 24,
                                    left: "22%",
                                    bottom: "22%",
                                    borderRadius: 999,
                                    background:
                                        "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))",
                                    transform: "rotate(-14deg)",
                                    filter: "blur(1px)",
                                }}
                            />

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
                                Selected
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
                        {["Image Layer", "Paint Layer", "Text Layer", "Shape Layer"].map(
                            (layer, index) => (
                                <Box
                                    key={layer}
                                    sx={{
                                        borderRadius: 2,
                                        p: 1.25,
                                        fontSize: 12,
                                        fontWeight: 900,
                                        color: index === 0 ? "#e8faff" : "#c8d3e2",
                                        border:
                                            index === 0
                                                ? "1px solid rgba(82,215,255,0.55)"
                                                : "1px solid rgba(255,255,255,0.1)",
                                        backgroundColor:
                                            index === 0
                                                ? "rgba(82,215,255,0.13)"
                                                : "rgba(255,255,255,0.05)",
                                    }}
                                >
                                    {layer}
                                </Box>
                            )
                        )}

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1 }} />

                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            {["PNG", "JPEG", "WebP"].map((item) => (
                                <Chip
                                    key={item}
                                    size="small"
                                    label={item}
                                    sx={{
                                        color: "#dff8ff",
                                        backgroundColor: "rgba(82,215,255,0.1)",
                                        border: "1px solid rgba(82,215,255,0.22)",
                                        fontWeight: 900,
                                    }}
                                />
                            ))}
                        </Stack>
                    </Stack>
                </Grid>
            </Grid>
        </Paper>
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
    backdropFilter: "blur(12px)",
    "&:hover": {
        borderColor: "rgba(82,215,255,0.45)",
        backgroundColor: "rgba(82,215,255,0.09)",
    },
};

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

    const [tool, setTool] = useState("brush");
    const [color, setColor] = useState("#ff3355");
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
    const activeLayerIdRef = useRef(activeLayerId);
    const selectionMaskRef = useRef(selectionMask);

    useEffect(() => {
        docRef.current = doc;
    }, [doc]);

    useEffect(() => {
        layersRef.current = layers;
    }, [layers]);

    useEffect(() => {
        activeLayerIdRef.current = activeLayerId;
    }, [activeLayerId]);

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
            layers: snapshotLayers,
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

    const restoreSnapshot = useCallback(async (snapshot) => {
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

        setDoc(snapshot.doc);
        setLayers(newLayers);
        setActiveLayerId(snapshot.activeLayerId);
        setSelectionMask(null);
        setStatus("Snapshot restored");
    }, []);

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

    const addBlankLayer = useCallback((name = "Paint Layer") => {
        pushHistory();

        const meta = createLayerMeta(name, "paint");
        const canvas = makeCanvas(docRef.current.width, docRef.current.height);

        layerCanvasesRef.current.set(meta.id, canvas);

        setLayers((prev) => [...prev, meta]);
        setActiveLayerId(meta.id);
        setStatus(`Added ${name}`);
    }, [pushHistory]);

    const ensureLayer = useCallback(() => {
        const active = getActiveLayer();

        if (active) return active;

        const meta = createLayerMeta("Paint Layer", "paint");
        const canvas = makeCanvas(docRef.current.width, docRef.current.height);

        layerCanvasesRef.current.set(meta.id, canvas);

        setLayers((prev) => [...prev, meta]);
        setActiveLayerId(meta.id);

        return meta;
    }, [getActiveLayer]);

    const handleImageUpload = useCallback(async (event) => {
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

                setDoc({
                    width,
                    height,
                    background: "transparent",
                });
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

            layerCanvasesRef.current.set(meta.id, canvas);

            setLayers((prev) => [...prev, meta]);
            setActiveLayerId(meta.id);
            setSelectionMask(null);
            setStatus(`Loaded ${file.name}`);
        } catch (error) {
            console.error(error);
            setStatus("Could not load image");
        } finally {
            event.target.value = "";
        }
    }, [pushHistory]);

    const getCanvasPoint = useCallback((event) => {
        const canvas = overlayCanvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const x = ((event.clientX - rect.left) / rect.width) * docRef.current.width;
        const y = ((event.clientY - rect.top) / rect.height) * docRef.current.height;

        return {
            x: clamp(x, 0, docRef.current.width),
            y: clamp(y, 0, docRef.current.height),
        };
    }, []);

    const createMagicWandSelection = useCallback((x, y) => {
        const canvas = getActiveCanvas();
        const layer = getActiveLayer();

        if (!canvas || !layer) {
            setStatus("No active layer for magic wand");
            return;
        }

        const width = canvas.width;
        const height = canvas.height;
        const startX = Math.floor(x);
        const startY = Math.floor(y);

        if (startX < 0 || startY < 0 || startX >= width || startY >= height) return;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        const startIndex = (startY * width + startX) * 4;
        const targetR = pixels[startIndex];
        const targetG = pixels[startIndex + 1];
        const targetB = pixels[startIndex + 2];
        const targetA = pixels[startIndex + 3];

        const visited = new Uint8Array(width * height);
        const mask = new Uint8ClampedArray(width * height);
        const stack = [startY * width + startX];

        while (stack.length > 0) {
            const pixelIndex = stack.pop();

            if (visited[pixelIndex]) continue;
            visited[pixelIndex] = 1;

            const px = pixelIndex % width;
            const py = Math.floor(pixelIndex / width);
            const rgbaIndex = pixelIndex * 4;

            const r = pixels[rgbaIndex];
            const g = pixels[rgbaIndex + 1];
            const b = pixels[rgbaIndex + 2];
            const a = pixels[rgbaIndex + 3];

            const distance = colorDistance(r, g, b, a, targetR, targetG, targetB, targetA);

            if (distance > wandTolerance) continue;

            mask[pixelIndex] = 255;

            if (px > 0) stack.push(pixelIndex - 1);
            if (px < width - 1) stack.push(pixelIndex + 1);
            if (py > 0) stack.push(pixelIndex - width);
            if (py < height - 1) stack.push(pixelIndex + width);
        }

        setSelectionMask({
            width,
            height,
            data: mask,
        });

        setStatus("Magic wand selection created");
    }, [getActiveCanvas, getActiveLayer, wandTolerance]);

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
        if (!selectionMaskRef.current) return;

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
        setSelectionMask(null);
        setStatus("Selection cleared");
    }, []);

    const commitTempCanvasToActiveLayer = useCallback((tempCanvas, mode = "paint") => {
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
    }, [getActiveCanvas, getActiveLayer, renderComposite]);

    const drawShapePreview = useCallback((start, end) => {
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
    }, [color, renderComposite, shapeType]);

    const drawSelectionPreview = useCallback((start, end) => {
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
    }, [renderComposite]);

    const drawLassoPreview = useCallback((points) => {
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
    }, [renderComposite]);

    const drawTextAtPoint = useCallback((point) => {
        ensureLayer();
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

        setStatus("Text added");
    }, [
        color,
        commitTempCanvasToActiveLayer,
        ensureLayer,
        fontSize,
        pushHistory,
        textValue,
    ]);

    const drawShapeToLayer = useCallback((start, end) => {
        ensureLayer();

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

        setStatus("Shape added");
    }, [
        brushOpacity,
        color,
        commitTempCanvasToActiveLayer,
        ensureLayer,
        shapeType,
    ]);

    const handlePointerDown = useCallback((event) => {
        const point = getCanvasPoint(event);

        event.currentTarget.setPointerCapture?.(event.pointerId);

        if (tool === "wand") {
            createMagicWandSelection(point.x, point.y);
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
            ensureLayer();
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
            ensureLayer();
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
                size: brushSize,
                hardness: brushHardness,
                opacity: brushOpacity,
                flow: brushFlow,
                spacing: brushSpacing,
            });

            renderComposite();
        }
    }, [
        brushFlow,
        brushHardness,
        brushOpacity,
        brushSize,
        brushSpacing,
        color,
        createMagicWandSelection,
        drawLassoPreview,
        drawSelectionPreview,
        drawShapePreview,
        drawTextAtPoint,
        ensureLayer,
        getActiveLayer,
        getCanvasPoint,
        pushHistory,
        renderComposite,
        tool,
    ]);

    const handlePointerMove = useCallback((event) => {
        const point = getCanvasPoint(event);

        if (strokeRef.current) {
            const stroke = strokeRef.current;

            drawBrushLine(stroke.ctx, stroke.last, point, {
                color,
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

            setLayers((prev) =>
                prev.map((layer) =>
                    layer.id === drag.layerId
                        ? {
                            ...layer,
                            x: drag.originalX + dx,
                            y: drag.originalY + dy,
                        }
                        : layer
                )
            );

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
    }, [
        brushFlow,
        brushHardness,
        brushOpacity,
        brushSize,
        brushSpacing,
        color,
        drawLassoPreview,
        drawSelectionPreview,
        drawShapePreview,
        getCanvasPoint,
        renderComposite,
    ]);

    const handlePointerUp = useCallback(() => {
        if (strokeRef.current) {
            const stroke = strokeRef.current;

            applyMaskToCanvas(stroke.canvas, selectionMaskRef.current);
            commitTempCanvasToActiveLayer(stroke.canvas, stroke.mode);

            strokeRef.current = null;

            setStatus(stroke.mode === "eraser" ? "Erase stroke committed" : "Brush stroke committed");
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

        setStatus(`Applied ${filterName}${mask ? " to selection" : ""}`);
    }, [
        filterName,
        filterStrength,
        getActiveCanvas,
        getActiveLayer,
        pushHistory,
        renderComposite,
    ]);

    const updateActiveLayer = useCallback((patch) => {
        const activeId = activeLayerIdRef.current;

        if (!activeId) return;

        setLayers((prev) =>
            prev.map((layer) =>
                layer.id === activeId
                    ? {
                        ...layer,
                        ...patch,
                    }
                    : layer
            )
        );
    }, []);

    const deleteActiveLayer = useCallback(() => {
        const activeId = activeLayerIdRef.current;

        if (!activeId) return;

        pushHistory();

        layerCanvasesRef.current.delete(activeId);

        setLayers((prev) => {
            const next = prev.filter((layer) => layer.id !== activeId);
            setActiveLayerId(next[next.length - 1]?.id || null);
            return next;
        });

        setStatus("Layer deleted");
    }, [pushHistory]);

    const moveLayer = useCallback((id, direction) => {
        setLayers((prev) => {
            const index = prev.findIndex((layer) => layer.id === id);
            if (index < 0) return prev;

            const target = index + direction;

            if (target < 0 || target >= prev.length) return prev;

            pushHistory();

            const next = [...prev];
            const temp = next[index];

            next[index] = next[target];
            next[target] = temp;

            return next;
        });
    }, [pushHistory]);

    const toggleLayerVisibility = useCallback((id) => {
        setLayers((prev) =>
            prev.map((layer) =>
                layer.id === id
                    ? {
                        ...layer,
                        visible: !layer.visible,
                    }
                    : layer
            )
        );
    }, []);

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

        return output;
    }, []);

    const exportImage = useCallback((mimeType) => {
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
                setStatus(`Exported ${extension.toUpperCase()}`);
            },
            mimeType,
            0.95
        );
    }, [renderFlattenedCanvas]);

    const saveProjectJson = useCallback(() => {
        const snapshot = makeSnapshot();

        const project = {
            app: "CanvasImageStudio",
            version: 1,
            savedAt: new Date().toISOString(),
            ...snapshot,
        };

        const blob = new Blob([JSON.stringify(project, null, 2)], {
            type: "application/json",
        });

        downloadBlob(blob, "image-project.json");
        setStatus("Project JSON saved");
    }, [makeSnapshot]);

    const loadProjectJson = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const project = JSON.parse(text);

            pushHistory();
            await restoreSnapshot(project);

            setStatus("Project JSON loaded");
        } catch (error) {
            console.error(error);
            setStatus("Could not load project JSON");
        } finally {
            event.target.value = "";
        }
    }, [pushHistory, restoreSnapshot]);

    const activeLayer = layers.find((layer) => layer.id === activeLayerId);

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                minHeight: 0,
                display: "grid",
                gridTemplateColumns: {
                    xs: "230px minmax(520px, 1fr) 260px",
                    lg: "280px minmax(680px, 1fr) 310px",
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
                tool={tool}
                setTool={setTool}
                color={color}
                setColor={setColor}
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
            />

            <EditorRightPanel
                activeLayer={activeLayer}
                activeLayerId={activeLayerId}
                layers={layers}
                setActiveLayerId={setActiveLayerId}
                updateActiveLayer={updateActiveLayer}
                deleteActiveLayer={deleteActiveLayer}
                toggleLayerVisibility={toggleLayerVisibility}
                moveLayer={moveLayer}
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

                    <Button
                        variant="outlined"
                        startIcon={<AddRounded />}
                        onClick={() => props.addBlankLayer("Paint Layer")}
                        sx={editorSecondaryButtonSx}
                        fullWidth
                    >
                        Add Paint Layer
                    </Button>
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
                        <MenuItem value="wand">Magic Wand</MenuItem>
                        <MenuItem value="rectSelect">Rectangle Select</MenuItem>
                        <MenuItem value="lasso">Lasso Select</MenuItem>
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="shape">Shape</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Color"
                    type="color"
                    value={props.color}
                    onChange={(event) => props.setColor(event.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={editorTextFieldSx}
                />

                <Divider sx={editorDividerSx} />

                <PanelTitle icon={<BrushRounded />} title="Brush" />

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
                    label="Opacity"
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

                <PanelTitle icon={<AutoFixHighRounded />} title="Selection" />

                <EditorSlider
                    label="Wand Tolerance"
                    value={props.wandTolerance}
                    min={1}
                    max={180}
                    step={1}
                    onChange={props.setWandTolerance}
                />

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        onClick={props.invertSelection}
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
                        Clear
                    </Button>
                </Stack>

                <FormControlLabel
                    control={
                        <Switch
                            checked={props.showMask}
                            onChange={(event) => props.setShowMask(event.target.checked)}
                        />
                    }
                    label="Show selection mask"
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
                    Apply Filter
                </Button>

                <Divider sx={editorDividerSx} />

                <PanelTitle icon={<TextFieldsRounded />} title="Text & Shapes" />

                <TextField
                    label="Text"
                    value={props.textValue}
                    onChange={(event) => props.setTextValue(event.target.value)}
                    size="small"
                    fullWidth
                    sx={editorTextFieldSx}
                />

                <EditorSlider
                    label="Font Size"
                    value={props.fontSize}
                    min={12}
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
                        <MenuItem value="circle">Circle</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
        </Paper>
    );
}

function EditorCanvasCenter(props) {
    return (
        <Box
            sx={{
                minWidth: 0,
                minHeight: 0,
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                overflow: "hidden",
                backgroundColor: "#07090d",
            }}
        >
            <Paper
                elevation={0}
                square
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.25,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "#111622",
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
                    startIcon={<DownloadRounded />}
                    onClick={() => props.exportImage("image/jpeg")}
                    sx={editorTopButtonSx}
                >
                    JPEG
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<DownloadRounded />}
                    onClick={() => props.exportImage("image/webp")}
                    sx={editorTopButtonSx}
                >
                    WebP
                </Button>

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
                    startIcon={<UploadFileRounded />}
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

                <Box sx={{ minWidth: 180, ml: 1 }}>
                    <Typography sx={{ color: "#aeb7c8", fontSize: 12, fontWeight: 800 }}>
                        Zoom {Math.round(props.zoom * 100)}%
                    </Typography>
                    <Slider
                        size="small"
                        value={props.zoom}
                        min={0.15}
                        max={2}
                        step={0.05}
                        onChange={(event, value) => props.setZoom(value)}
                    />
                </Box>
            </Paper>

            <Box
                sx={{
                    minHeight: 0,
                    overflow: "auto",
                    display: "grid",
                    placeItems: "center",
                    background:
                        "radial-gradient(circle at top, rgba(82,215,255,0.09), transparent 32%), #07090d",
                    p: 3,
                }}
            >
                <Box
                    sx={{
                        position: "relative",
                        width: props.doc.width * props.zoom,
                        height: props.doc.height * props.zoom,
                        minWidth: 1,
                        minHeight: 1,
                        boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
                        background:
                            "linear-gradient(45deg, #2a2e38 25%, transparent 25%), linear-gradient(-45deg, #2a2e38 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2e38 75%), linear-gradient(-45deg, transparent 75%, #2a2e38 75%)",
                        backgroundSize: "24px 24px",
                        backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
                    }}
                >
                    <canvas
                        ref={props.displayCanvasRef}
                        width={props.doc.width}
                        height={props.doc.height}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            display: "block",
                        }}
                    />

                    <canvas
                        ref={props.overlayCanvasRef}
                        width={props.doc.width}
                        height={props.doc.height}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            display: "block",
                            cursor: "crosshair",
                            touchAction: "none",
                        }}
                        onPointerDown={props.handlePointerDown}
                        onPointerMove={props.handlePointerMove}
                        onPointerUp={props.handlePointerUp}
                        onPointerCancel={props.handlePointerUp}
                        onPointerLeave={props.handlePointerUp}
                    />
                </Box>
            </Box>

            <Paper
                elevation={0}
                square
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    px: 1.5,
                    py: 1,
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 13,
                    color: "#aeb7c8",
                    backgroundColor: "#111622",
                }}
            >
                <Typography sx={{ fontSize: 13, color: "#aeb7c8" }}>
                    {props.status}
                </Typography>

                <Typography sx={{ fontSize: 13, color: "#aeb7c8" }}>
                    Canvas: {props.doc.width} × {props.doc.height}
                </Typography>

                <Typography sx={{ fontSize: 13, color: "#aeb7c8" }}>
                    Active Tool: {props.tool}
                </Typography>
            </Paper>
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
                <Stack direction="row" spacing={1} alignItems="center">
                    <LayersRounded sx={{ color: "#52d7ff" }} />
                    <Typography sx={{ fontSize: 20, fontWeight: 950 }}>Layers</Typography>
                </Stack>

                {props.activeLayer ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            borderRadius: 3,
                            color: "common.white",
                            border: "1px solid rgba(82,215,255,0.2)",
                            backgroundColor: "rgba(82,215,255,0.08)",
                        }}
                    >
                        <Stack spacing={1.5}>
                            <Typography sx={{ color: "#aeb7c8", fontSize: 12, fontWeight: 900 }}>
                                ACTIVE LAYER
                            </Typography>

                            <Typography sx={{ fontWeight: 900 }}>
                                {props.activeLayer.name}
                            </Typography>

                            <EditorSlider
                                label="Opacity"
                                value={props.activeLayer.opacity}
                                min={0}
                                max={1}
                                step={0.01}
                                percent
                                onChange={(value) => props.updateActiveLayer({ opacity: value })}
                            />

                            <EditorSlider
                                label="Scale"
                                value={props.activeLayer.scale}
                                min={0.1}
                                max={4}
                                step={0.01}
                                onChange={(value) => props.updateActiveLayer({ scale: value })}
                            />

                            <EditorSlider
                                label="Rotation"
                                value={props.activeLayer.rotation}
                                min={-180}
                                max={180}
                                step={1}
                                suffix="°"
                                onChange={(value) => props.updateActiveLayer({ rotation: value })}
                            />

                            <FormControl fullWidth size="small">
                                <InputLabel sx={editorLabelSx}>Blend Mode</InputLabel>
                                <Select
                                    value={props.activeLayer.blendMode}
                                    label="Blend Mode"
                                    onChange={(event) =>
                                        props.updateActiveLayer({ blendMode: event.target.value })
                                    }
                                    sx={editorSelectSx}
                                >
                                    <MenuItem value="source-over">Normal</MenuItem>
                                    <MenuItem value="multiply">Multiply</MenuItem>
                                    <MenuItem value="screen">Screen</MenuItem>
                                    <MenuItem value="overlay">Overlay</MenuItem>
                                    <MenuItem value="darken">Darken</MenuItem>
                                    <MenuItem value="lighten">Lighten</MenuItem>
                                    <MenuItem value="color-dodge">Color Dodge</MenuItem>
                                    <MenuItem value="color-burn">Color Burn</MenuItem>
                                    <MenuItem value="hard-light">Hard Light</MenuItem>
                                    <MenuItem value="soft-light">Soft Light</MenuItem>
                                    <MenuItem value="difference">Difference</MenuItem>
                                    <MenuItem value="exclusion">Exclusion</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteRounded />}
                                onClick={props.deleteActiveLayer}
                                sx={{
                                    borderRadius: 2,
                                    fontWeight: 900,
                                    textTransform: "none",
                                }}
                            >
                                Delete Active Layer
                            </Button>
                        </Stack>
                    </Paper>
                ) : (
                    <Typography sx={{ color: "#aeb7c8", fontSize: 14 }}>
                        No active layer yet. Upload an image or add a paint layer.
                    </Typography>
                )}

                <Divider sx={editorDividerSx} />

                <Stack spacing={1.2}>
                    {[...props.layers].reverse().map((layer) => (
                        <Paper
                            key={layer.id}
                            elevation={0}
                            onClick={() => props.setActiveLayerId(layer.id)}
                            sx={{
                                p: 1.25,
                                borderRadius: 2.5,
                                cursor: "pointer",
                                color: "common.white",
                                border:
                                    layer.id === props.activeLayerId
                                        ? "1px solid rgba(82,215,255,0.65)"
                                        : "1px solid rgba(255,255,255,0.12)",
                                backgroundColor:
                                    layer.id === props.activeLayerId
                                        ? "rgba(82, 215, 255, 0.13)"
                                        : "rgba(255,255,255,0.05)",
                            }}
                        >
                            <Stack spacing={1}>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            noWrap
                                            sx={{ fontSize: 13, fontWeight: 900 }}
                                        >
                                            {layer.name}
                                        </Typography>

                                        <Typography sx={{ color: "#aeb7c8", fontSize: 12 }}>
                                            {Math.round(layer.opacity * 100)}% · {layer.type}
                                        </Typography>
                                    </Box>

                                    <Tooltip title={layer.visible ? "Hide" : "Show"}>
                                        <IconButton
                                            size="small"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                props.toggleLayerVisibility(layer.id);
                                            }}
                                            sx={{ color: "#dff8ff" }}
                                        >
                                            {layer.visible ? (
                                                <VisibilityRounded fontSize="small" />
                                            ) : (
                                                <VisibilityOffRounded fontSize="small" />
                                            )}
                                        </IconButton>
                                    </Tooltip>
                                </Stack>

                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            props.moveLayer(layer.id, 1);
                                        }}
                                        sx={layerMiniButtonSx}
                                    >
                                        Up
                                    </Button>

                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            props.moveLayer(layer.id, -1);
                                        }}
                                        sx={layerMiniButtonSx}
                                    >
                                        Down
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            </Stack>
        </Paper>
    );
}

function PanelTitle({ icon, title }) {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Box
                sx={{
                    width: 28,
                    height: 28,
                    display: "grid",
                    placeItems: "center",
                    color: "#52d7ff",
                    borderRadius: 1.5,
                    backgroundColor: "rgba(82,215,255,0.1)",
                }}
            >
                {React.cloneElement(icon, { fontSize: "small" })}
            </Box>

            <Typography sx={{ fontSize: 14, fontWeight: 950 }}>
                {title}
            </Typography>
        </Stack>
    );
}

function EditorSlider({
                          label,
                          value,
                          min,
                          max,
                          step,
                          suffix = "",
                          percent = false,
                          onChange,
                      }) {
    const displayValue = percent ? `${Math.round(value * 100)}%` : `${value}${suffix}`;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography sx={{ color: "#aeb7c8", fontSize: 12, fontWeight: 800 }}>
                    {label}
                </Typography>

                <Typography sx={{ color: "#dff8ff", fontSize: 12, fontWeight: 900 }}>
                    {displayValue}
                </Typography>
            </Stack>

            <Slider
                size="small"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(event, nextValue) => onChange(nextValue)}
                sx={{
                    color: "#52d7ff",
                    "& .MuiSlider-thumb": {
                        boxShadow: "0 0 0 5px rgba(82,215,255,0.1)",
                    },
                }}
            />
        </Box>
    );
}

const editorDividerSx = {
    borderColor: "rgba(255,255,255,0.08)",
};

const editorLabelSx = {
    color: "#aeb7c8",
    "&.Mui-focused": {
        color: "#52d7ff",
    },
};

const editorSelectSx = {
    color: "common.white",
    borderRadius: 2,
    backgroundColor: "#171d2b",
    ".MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(255,255,255,0.14)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(82,215,255,0.35)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#52d7ff",
    },
    ".MuiSvgIcon-root": {
        color: "#aeb7c8",
    },
};

const editorTextFieldSx = {
    "& .MuiInputLabel-root": {
        color: "#aeb7c8",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#52d7ff",
    },
    "& .MuiOutlinedInput-root": {
        color: "common.white",
        borderRadius: 2,
        backgroundColor: "#171d2b",
        "& fieldset": {
            borderColor: "rgba(255,255,255,0.14)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(82,215,255,0.35)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#52d7ff",
        },
    },
};

const editorPrimaryButtonSx = {
    borderRadius: 2,
    color: "#06101a",
    fontWeight: 950,
    textTransform: "none",
    background: "linear-gradient(135deg, #52d7ff, #7c5cff)",
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