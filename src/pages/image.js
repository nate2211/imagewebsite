import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    ArrowBackRounded,
    AutoFixHighRounded,
    BrushRounded,
    FileDownloadRounded,
    ImageRounded,
    LayersRounded,
    SaveRounded,
    SelectAllRounded,
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
                    "radial-gradient(circle at top left, rgba(82,215,255,0.13), transparent 32%), radial-gradient(circle at top right, rgba(124, 92, 255, 0.12), transparent 30%), #07090f",
            }}
        >
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
                <Container maxWidth={false} sx={{ px: { xs: 2, md: 3.5 }, py: 2.25 }}>
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
                                            maxWidth: 850,
                                            color: "#aeb7c8",
                                            lineHeight: 1.6,
                                            fontSize: 15,
                                        }}
                                    >
                                        Upload an image, create layers, paint with complex brushes,
                                        select with the wand or lasso, apply filters to selections,
                                        and export the final render.
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
                            sx={{ maxWidth: { xs: "100%", md: 560 } }}
                        >
                            <HeaderChip icon={<LayersRounded />} label="Layers" />
                            <HeaderChip icon={<BrushRounded />} label="Brushes" />
                            <HeaderChip icon={<AutoFixHighRounded />} label="Wand" />
                            <HeaderChip icon={<SelectAllRounded />} label="Masks" />
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
                        On smaller screens, the editor works best in landscape mode or on desktop
                        because it has left tools, a canvas workspace, and a right layer panel.
                    </Typography>
                </Box>
            )}

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