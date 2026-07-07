    import React from "react";
    import { Link as RouterLink } from "react-router-dom";
    import {
        ArrowBackRounded,
        AutoFixHighRounded,
        BrushRounded,
        ColorizeRounded,
        ContentCopyRounded,
        CropRounded,
        FileDownloadRounded,
        FlipToFrontRounded,
        FormatColorFillRounded,
        ImageRounded,
        LayersRounded,
        PaletteRounded,
        SaveRounded,
        SelectAllRounded,
        TextFieldsRounded,
        TuneRounded,
    } from "@mui/icons-material";
    import {
        Box,
        Button,
        Chip,
        Container,
        Paper,
        Stack,
        Typography,
        useMediaQuery,
        useTheme,
    } from "@mui/material";
    import { CanvasImageEditor } from "../components/components";
    import Seo from "../components/seo";

    export default function Image() {
        const theme = useTheme();
        const compact = useMediaQuery(theme.breakpoints.down("md"));

        return (
            <Box
                component="main"
                sx={{
                    minHeight: "100vh",
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    color: "common.white",
                    background:
                        "radial-gradient(circle at top left, rgba(82,215,255,0.13), transparent 32%), radial-gradient(circle at top right, rgba(124, 92, 255, 0.12), transparent 30%), radial-gradient(circle at bottom, rgba(255,51,120,0.08), transparent 40%), #07090f",
                }}
            >
                <Seo
                    title="Canvas Image Editor"
                    path="/image"
                    description="Use ImageMaster Lab's canvas image editor to upload photos, paint with shaped brushes, add movable text boxes, create selections, apply filters, manage layers, crop, and export PNG, JPEG, or WebP files."
                    keywords="canvas image editor, React canvas editor, online photo editor, image layers, image filters, movable text boxes, crop tool, fill bucket, image selection tool, export PNG JPEG WebP"
                />
                <Paper
                    component="header"
                    elevation={0}
                    square
                    sx={{
                        flexShrink: 0,
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        background:
                            "radial-gradient(circle at top left, rgba(82,215,255,0.12), transparent 32%), rgba(14,17,24,0.96)",
                        color: "common.white",
                        backdropFilter: "blur(16px)",
                    }}
                >
                    <Container
                        maxWidth={false}
                        sx={{
                            px: { xs: 2, md: 3.5 },
                            py: 2.25,
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={2}
                            alignItems={{ xs: "flex-start", md: "flex-end" }}
                            justifyContent="space-between"
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Button
                                    component={RouterLink}
                                    to="/"
                                    startIcon={<ArrowBackRounded />}
                                    sx={{
                                        color: "#52d7ff",
                                        fontWeight: 950,
                                        px: 0,
                                        mb: 0.75,
                                        textTransform: "none",
                                        "&:hover": {
                                            backgroundColor: "transparent",
                                            color: "#8ae8ff",
                                        },
                                    }}
                                >
                                    Home
                                </Button>

                                <Stack direction="row" spacing={1.25} alignItems="center">
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            display: { xs: "none", sm: "grid" },
                                            placeItems: "center",
                                            borderRadius: 2.25,
                                            color: "#06101a",
                                            background:
                                                "linear-gradient(135deg, #52d7ff, #7c5cff)",
                                            boxShadow: "0 16px 42px rgba(82, 215, 255, 0.2)",
                                        }}
                                    >
                                        <ImageRounded />
                                    </Box>

                                    <Box>
                                        <Typography
                                            component="h1"
                                            sx={{
                                                m: 0,
                                                fontSize: {
                                                    xs: "1.85rem",
                                                    sm: "2.35rem",
                                                    md: "2.9rem",
                                                },
                                                lineHeight: 1,
                                                letterSpacing: "-0.055em",
                                                fontWeight: 950,
                                            }}
                                        >
                                            Canvas Image Editor
                                        </Typography>

                                        <Typography
                                            sx={{
                                                mt: 0.9,
                                                maxWidth: 980,
                                                color: "#aeb7c8",
                                                lineHeight: 1.6,
                                                fontSize: 15,
                                            }}
                                        >
                                            Upload an image, paint with shaped brushes, use fill bucket,
                                            make selections, feather masks, crop, add gradients, sample
                                            colors, duplicate and merge layers, place movable text boxes,
                                            resize them with handles, and export as PNG, JPEG, or WebP.
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                                justifyContent={{ xs: "flex-start", md: "flex-end" }}
                                sx={{
                                    maxWidth: { xs: "100%", md: 920 },
                                }}
                            >
                                <HeaderChip icon={<LayersRounded />} label="Layers" />
                                <HeaderChip icon={<BrushRounded />} label="Shape Brushes" />
                                <HeaderChip icon={<FormatColorFillRounded />} label="Fill Bucket" />
                                <HeaderChip icon={<PaletteRounded />} label="Gradients" />
                                <HeaderChip icon={<ColorizeRounded />} label="Eyedropper" />
                                <HeaderChip icon={<AutoFixHighRounded />} label="Magic Wand" />
                                <HeaderChip icon={<SelectAllRounded />} label="Selections" />
                                <HeaderChip icon={<ContentCopyRounded />} label="Copy / Cut / Paste" />
                                <HeaderChip icon={<CropRounded />} label="Crop" />
                                <HeaderChip icon={<TextFieldsRounded />} label="Resizable Text Boxes" />
                                <HeaderChip icon={<FlipToFrontRounded />} label="Merge / Flatten" />
                                <HeaderChip icon={<TuneRounded />} label="Filters" />
                                <HeaderChip icon={<FileDownloadRounded />} label="PNG / JPEG / WebP" />
                                <HeaderChip icon={<SaveRounded />} label="Project JSON" />
                            </Stack>
                        </Stack>
                    </Container>
                </Paper>

                {compact && (
                    <Box
                        sx={{
                            flexShrink: 0,
                            px: 2,
                            py: 1.25,
                            color: "#dff8ff",
                            borderBottom: "1px solid rgba(82,215,255,0.12)",
                            backgroundColor: "rgba(82,215,255,0.065)",
                        }}
                    >
                        <Typography sx={{ fontSize: 13.5, lineHeight: 1.55 }}>
                            On smaller screens, this editor works best in landscape mode or on desktop
                            because it has a left tools panel, a large canvas workspace, and a right
                            layers/text panel.
                        </Typography>
                    </Box>
                )}

                <EditorFeatureBar />

                <Box
                    component="section"
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        overflow: "hidden",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                        "& > *": {
                            height: "100% !important",
                            minHeight: "0 !important",
                        },
                    }}
                >
                    <CanvasImageEditor />
                </Box>
            </Box>
        );
    }

    function HeaderChip({ icon, label }) {
        return (
            <Chip
                icon={icon}
                label={label}
                sx={{
                    height: 34,
                    color: "#dff8ff",
                    backgroundColor: "rgba(82,215,255,0.1)",
                    border: "1px solid rgba(82,215,255,0.22)",
                    fontSize: 12,
                    fontWeight: 900,
                    "& .MuiChip-icon": {
                        color: "#52d7ff",
                        fontSize: 18,
                    },
                }}
            />
        );
    }

    function EditorFeatureBar() {
        const items = [
            {
                icon: <SelectAllRounded />,
                label: "Select pixels, feather masks, then fill, filter, cut, copy, paste, or delete.",
            },
            {
                icon: <CropRounded />,
                label: "Use Crop Tool to drag a crop box or crop directly to your active selection.",
            },
            {
                icon: <TextFieldsRounded />,
                label: "Text boxes now have direct move, resize, and rotation handles on the canvas.",
            },
            {
                icon: <LayersRounded />,
                label: "Raster layers support thumbnails, duplicate, merge down, merge visible, and flatten.",
            },
        ];

        return (
            <Paper
                elevation={0}
                square
                sx={{
                    flexShrink: 0,
                    px: { xs: 1.5, md: 2.25 },
                    py: 1.1,
                    display: { xs: "none", lg: "block" },
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(9, 12, 18, 0.92)",
                    color: "common.white",
                }}
            >

                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    alignItems="center"
                >
                    {items.map((item) => (
                        <Box
                            key={item.label}
                            sx={{
                                flex: "1 1 260px",
                                minHeight: 42,
                                px: 1.5,
                                py: 0.9,
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "#cbd5e1",
                                backgroundColor: "rgba(255,255,255,0.045)",
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 28,
                                    height: 28,
                                    flexShrink: 0,
                                    borderRadius: 1.35,
                                    display: "grid",
                                    placeItems: "center",
                                    color: "#52d7ff",
                                    backgroundColor: "rgba(82,215,255,0.1)",
                                    "& svg": {
                                        fontSize: 17,
                                    },
                                }}
                            >
                                {item.icon}
                            </Box>

                            <Typography
                                sx={{
                                    fontSize: 12.4,
                                    lineHeight: 1.35,
                                    fontWeight: 800,
                                }}
                            >
                                {item.label}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Paper>
        );
    }