import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Grid,
    Stack,
    Typography,
} from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import CropRoundedIcon from "@mui/icons-material/CropRounded";
import PhotoSizeSelectLargeRoundedIcon from "@mui/icons-material/PhotoSizeSelectLargeRounded";
import CompressRoundedIcon from "@mui/icons-material/CompressRounded";
import BrokenImageRoundedIcon from "@mui/icons-material/BrokenImageRounded";
import FilterVintageRoundedIcon from "@mui/icons-material/FilterVintageRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";

import { SiteShell } from "../components/components";
import Seo from "../components/seo";

const SITE_URL = "https://imagemasterlab.com";

const streamlinedTools = [
    {
        title: "Crop Image Online",
        path: "/crop-image",
        icon: <CropRoundedIcon />,
        description:
            "Open a focused crop tool, select an image, adjust the crop area, preview it, and export the cropped result.",
        keywords: "crop image online, crop photo, browser image cropper",
        badge: "Crop Tool",
    },
    {
        title: "Resize Image Online",
        path: "/resize-image",
        icon: <PhotoSizeSelectLargeRoundedIcon />,
        description:
            "Upload an image, enter a new width and height, keep aspect ratio locked, and export the resized image.",
        keywords: "resize image online, image resizer, resize photo",
        badge: "Resize Tool",
    },
    {
        title: "Compress Image Online",
        path: "/compress-image",
        icon: <CompressRoundedIcon />,
        description:
            "Reduce image file size with simple JPEG and WebP quality controls before exporting.",
        keywords: "compress image online, image compressor, reduce image size",
        badge: "Compression",
    },
    {
        title: "Background Remover",
        path: "/background-remover",
        icon: <BrokenImageRoundedIcon />,
        description:
            "Remove simple solid-color backgrounds and export transparent PNG images directly from the browser.",
        keywords: "background remover, transparent PNG, remove background",
        badge: "Transparent PNG",
    },
    {
        title: "Photo Filters Online",
        path: "/photo-filters",
        icon: <FilterVintageRoundedIcon />,
        description:
            "Apply brightness, contrast, saturation, grayscale, sepia, and blur filters with a streamlined editor.",
        keywords: "photo filters online, image filters, photo effects",
        badge: "Filters",
    },
    {
        title: "Add Text to Image",
        path: "/add-text-to-image",
        icon: <TextFieldsRoundedIcon />,
        description:
            "Add custom text to photos, change size, color, position, and export polished image graphics.",
        keywords: "add text to image, photo text editor, image caption maker",
        badge: "Text Tool",
    },
    {
        title: "Convert to WebP",
        path: "/convert-to-webp",
        icon: <ImageRoundedIcon />,
        description:
            "Upload PNG or JPEG images and export browser-ready WebP files for websites and social content.",
        keywords: "convert image to WebP, PNG to WebP, JPG to WebP",
        badge: "WebP Export",
    },
    {
        title: "Watermark Image",
        path: "/watermark-image",
        icon: <WaterDropRoundedIcon />,
        description:
            "Add a text watermark, adjust opacity and placement, then export a protected image.",
        keywords: "add watermark to image, watermark photo online, text watermark",
        badge: "Watermark",
    },
];

const converterLinks = [
    {
        label: "Convert to PNG",
        path: "/convert-to-png",
    },
    {
        label: "Convert to JPG",
        path: "/convert-to-jpg",
    },
    {
        label: "Convert to WebP",
        path: "/convert-to-webp",
    },
    {
        label: "Meme Maker",
        path: "/meme-maker",
    },
];

const sisterSites = [
    {
        title: "MusicStudioLab",
        url: "https://musicstudiolab.com",
        displayUrl: "musicstudiolab.com",
        icon: <MusicNoteRoundedIcon />,
        badge: "Browser Music Studio",
        description:
            "Create sounds, sequence patterns, design synths, arrange playlists, use WebAudio effects, and export music from the browser.",
        cta: "Visit MusicStudioLab",
        gradient:
            "linear-gradient(135deg, rgba(82,215,255,.17), rgba(124,92,255,.07))",
        border: "rgba(82,215,255,.24)",
        iconBg: "rgba(82,215,255,.13)",
        accent: "#52d7ff",
    },
    {
        title: "AudioMasterLab",
        url: "https://audiomasterlab.com",
        displayUrl: "audiomasterlab.com",
        icon: <GraphicEqRoundedIcon />,
        badge: "Browser Audio Mastering",
        description:
            "Upload audio, preview waveforms, apply mastering effects, shape tone and loudness, and export improved audio directly.",
        cta: "Visit AudioMasterLab",
        gradient:
            "linear-gradient(135deg, rgba(112,255,214,.14), rgba(82,215,255,.07))",
        border: "rgba(112,255,214,.24)",
        iconBg: "rgba(112,255,214,.12)",
        accent: "#70ffd6",
    },
    {
        title: "SuiteOfficeLab",
        url: "https://suiteofficelab.com",
        displayUrl: "suiteofficelab.com",
        icon: <DescriptionRoundedIcon />,
        badge: "Browser Office Suite",
        description:
            "Edit CSV files, Word-style documents, PowerPoint-style slides, and PDFs from a frontend-only browser office suite.",
        cta: "Visit SuiteOfficeLab",
        gradient:
            "linear-gradient(135deg, rgba(179,140,255,.17), rgba(255,255,255,.055))",
        border: "rgba(179,140,255,.25)",
        iconBg: "rgba(179,140,255,.13)",
        accent: "#b38cff",
    },
];

function buildHomeJsonLd() {
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                name: "ImageMaster Lab",
                url: SITE_URL,
                description:
                    "ImageMaster Lab is a browser-based image editor with a full canvas editor and streamlined image tools for cropping, resizing, compressing, filtering, converting, watermarking, and adding text to images.",
                potentialAction: {
                    "@type": "SearchAction",
                    target: `${SITE_URL}/photo-filters?q={search_term_string}`,
                    "query-input": "required name=search_term_string",
                },
            },
            {
                "@type": "WebApplication",
                "@id": `${SITE_URL}/#app`,
                name: "ImageMaster Lab",
                applicationCategory: "MultimediaApplication",
                operatingSystem: "Web Browser",
                url: SITE_URL,
                image: `${SITE_URL}/seo/image-tools-preview.webp`,
                description:
                    "A browser image editor with a full canvas workspace and focused SEO tool pages for common image tasks.",
                offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                },
                featureList: [
                    "Canvas image editor",
                    "Crop image online",
                    "Resize image online",
                    "Compress image online",
                    "Background remover",
                    "Photo filters",
                    "Add text to image",
                    "Convert to PNG",
                    "Convert to JPG",
                    "Convert to WebP",
                    "Watermark image",
                    "Meme maker",
                ],
            },
            {
                "@type": "ItemList",
                "@id": `${SITE_URL}/#streamlined-tools`,
                name: "ImageMaster Lab Streamlined Image Tools",
                itemListElement: streamlinedTools.map((tool, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: tool.title,
                    url: `${SITE_URL}${tool.path}`,
                })),
            },
            {
                "@type": "ItemList",
                "@id": `${SITE_URL}/#related-browser-apps`,
                name: "Related Browser App Network",
                itemListElement: sisterSites.map((site, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: site.title,
                    url: site.url,
                })),
            },
        ],
    };
}

export default function Home() {
    return (
        <SiteShell>
            <Seo
                title="Browser Image Editor and Online Image Tools"
                path="/"
                description="ImageMaster Lab is a browser-based image editor with a full canvas editor plus streamlined SEO tool URLs for crop image, resize image, compress image, background remover, photo filters, image conversion, add text to image, watermarking, and meme making. Explore related browser apps including MusicStudioLab, AudioMasterLab, and SuiteOfficeLab."
                keywords="ImageMaster Lab, browser image editor, online image editor, crop image online, resize image online, compress image online, background remover, photo filters online, convert image to WebP, add text to image, watermark image, meme maker, MusicStudioLab, AudioMasterLab, SuiteOfficeLab, suiteofficelab.com"
                image="/seo/image-tools-preview.webp"
                imageAlt="ImageMaster Lab browser image editor and online image tools preview"
                type="website"
                robots="index,follow,max-image-preview:large"
                jsonLd={buildHomeJsonLd()}
            />

            <Box
                component="section"
                sx={{
                    position: "relative",
                    overflow: "hidden",
                    pt: { xs: 5, md: 8 },
                    pb: { xs: 6, md: 10 },
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background:
                            "radial-gradient(circle at 12% 14%, rgba(82,215,255,.24), transparent 34%), radial-gradient(circle at 78% 12%, rgba(124,92,255,.22), transparent 32%), radial-gradient(circle at 50% 100%, rgba(255,51,120,.1), transparent 38%)",
                    }}
                />

                <Container maxWidth="xl" sx={{ position: "relative" }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} lg={7.4}>
                            <Stack
                                spacing={3}
                                alignItems={{ xs: "center", lg: "flex-start" }}
                                textAlign={{ xs: "center", lg: "left" }}
                            >
                                <Box
                                    sx={{
                                        width: 94,
                                        height: 94,
                                        borderRadius: "30px",
                                        display: "grid",
                                        placeItems: "center",
                                        background:
                                            "linear-gradient(135deg, rgba(82,215,255,.24), rgba(124,92,255,.2))",
                                        border: "1px solid rgba(255,255,255,.16)",
                                        boxShadow: "0 24px 80px rgba(0,0,0,.45)",
                                    }}
                                >
                                    <AutoAwesomeRoundedIcon
                                        sx={{
                                            fontSize: 54,
                                            color: "#52d7ff",
                                        }}
                                    />
                                </Box>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                    justifyContent={{ xs: "center", lg: "flex-start" }}
                                    useFlexGap
                                >
                                    <Chip
                                        icon={<ImageRoundedIcon />}
                                        label="Full browser image editor"
                                        sx={heroChipSx}
                                    />

                                    <Chip
                                        icon={<SearchRoundedIcon />}
                                        label="SEO tool URLs"
                                        sx={heroChipMutedSx}
                                    />

                                    <Chip
                                        icon={<CloudOffRoundedIcon />}
                                        label="Frontend local editing"
                                        sx={heroChipMutedSx}
                                    />
                                </Stack>

                                <Typography
                                    component="h1"
                                    sx={{
                                        maxWidth: 1120,
                                        fontWeight: 950,
                                        fontSize: {
                                            xs: 42,
                                            sm: 58,
                                            md: 82,
                                        },
                                        lineHeight: 0.94,
                                        letterSpacing: "-0.075em",
                                    }}
                                >
                                    Edit images in a full canvas editor or use fast one-click image tools.
                                </Typography>

                                <Typography
                                    sx={{
                                        maxWidth: 940,
                                        color: "rgba(255,255,255,.72)",
                                        fontSize: { xs: 16, md: 20 },
                                        lineHeight: 1.75,
                                    }}
                                >
                                    ImageMaster Lab now has a complete Photoshop-style browser editor
                                    plus streamlined direct URLs for common image searches like crop
                                    image online, resize image online, compress image, background
                                    remover, photo filters, add text to image, watermark image, and
                                    image conversion.
                                </Typography>

                                <Typography
                                    sx={{
                                        maxWidth: 900,
                                        color: "rgba(255,255,255,.62)",
                                        fontSize: { xs: 15, md: 17 },
                                        lineHeight: 1.7,
                                    }}
                                >
                                    Explore more browser apps from the same creative tool network:
                                    MusicStudioLab for music production, AudioMasterLab for audio
                                    mastering, and SuiteOfficeLab for CSV, Word-style document,
                                    PowerPoint-style slide, and PDF editing.
                                </Typography>

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.5}
                                    justifyContent={{ xs: "center", lg: "flex-start" }}
                                >
                                    <Button
                                        component={RouterLink}
                                        to="/image"
                                        size="large"
                                        variant="contained"
                                        startIcon={<RocketLaunchRoundedIcon />}
                                        sx={primaryButtonSx}
                                    >
                                        Open Full Editor
                                    </Button>

                                    <Button
                                        component={RouterLink}
                                        to="/additional-pages"
                                        size="large"
                                        variant="outlined"
                                        startIcon={<AppsRoundedIcon />}
                                        sx={outlineButtonSx}
                                    >
                                        Browse Streamlined Tools
                                    </Button>
                                </Stack>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                    justifyContent={{ xs: "center", lg: "flex-start" }}
                                    useFlexGap
                                    sx={{ pt: 1 }}
                                >
                                    {converterLinks.map((link) => (
                                        <Button
                                            key={link.path}
                                            component={RouterLink}
                                            to={link.path}
                                            size="small"
                                            sx={quickLinkSx}
                                        >
                                            {link.label}
                                        </Button>
                                    ))}
                                </Stack>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} lg={4.6}>
                            <HeroPreviewCard />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
                <Container maxWidth="xl">
                    <SectionHeading
                        eyebrow="Streamlined SEO URLs"
                        title="Direct image tool pages built for what users search."
                        description="Each URL opens a focused upload popup, a simple tool-specific editor, and a direct export button. These pages are easier to target with unique SEO tags and structured data."
                    />

                    <Grid container spacing={2.5}>
                        {streamlinedTools.map((tool) => (
                            <Grid item xs={12} sm={6} lg={3} key={tool.path}>
                                <ToolCard tool={tool} />
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
                <Container maxWidth="xl">
                    <Grid container spacing={2.5}>
                        <Grid item xs={12} md={4}>
                            <InfoPanel
                                icon={<ImageRoundedIcon />}
                                title="Full editor for advanced edits"
                                text="Use the main /image editor when users need layers, selections, text boxes, filters, brushes, fills, crop, and project-style image editing."
                                buttonLabel="Open /image"
                                buttonPath="/image"
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <InfoPanel
                                icon={<BoltRoundedIcon />}
                                title="Fast tools for simple searches"
                                text="Use streamlined URLs when the user only needs one task: crop, resize, compress, convert, filter, watermark, or add text."
                                buttonLabel="View all tools"
                                buttonPath="/additional-pages"
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <InfoPanel
                                icon={<FileDownloadRoundedIcon />}
                                title="Export directly from the browser"
                                text="Images are loaded into browser canvas tools and exported with Blob downloads, keeping the workflow simple and frontend-only."
                                buttonLabel="Try crop tool"
                                buttonPath="/crop-image"
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
                <Container maxWidth="xl">
                    <SectionHeading
                        eyebrow="Creative Browser App Network"
                        title="More browser tools from our connected websites."
                        description="ImageMaster Lab connects with a growing browser app network for image editing, music production, audio mastering, and office document editing."
                    />

                    <Grid container spacing={2.5}>
                        {sisterSites.map((site) => (
                            <Grid item xs={12} md={4} key={site.title}>
                                <SisterSiteCard site={site} />
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            <Box component="section" sx={{ py: { xs: 6, md: 10 } }}>
                <Container maxWidth="xl">
                    <Card
                        sx={{
                            borderRadius: 5,
                            overflow: "hidden",
                            color: "common.white",
                            border: "1px solid rgba(255,255,255,.12)",
                            background:
                                "radial-gradient(circle at top left, rgba(82,215,255,.18), transparent 34%), radial-gradient(circle at bottom right, rgba(124,92,255,.16), transparent 38%), rgba(255,255,255,.055)",
                            boxShadow: "0 28px 90px rgba(0,0,0,.35)",
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} md={8}>
                                    <Typography
                                        component="h2"
                                        sx={{
                                            fontSize: { xs: 30, md: 48 },
                                            lineHeight: 1,
                                            letterSpacing: "-0.05em",
                                            fontWeight: 950,
                                            mb: 1.5,
                                        }}
                                    >
                                        Start with the full editor or jump straight into a focused tool.
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color: "rgba(255,255,255,.7)",
                                            fontSize: 17,
                                            lineHeight: 1.7,
                                            maxWidth: 920,
                                        }}
                                    >
                                        The full editor is best for advanced canvas work. The streamlined
                                        URLs are best for search traffic and fast one-task editing.
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Stack spacing={1.25}>
                                        <Button
                                            component={RouterLink}
                                            to="/image"
                                            variant="contained"
                                            size="large"
                                            startIcon={<RocketLaunchRoundedIcon />}
                                            sx={primaryButtonSx}
                                        >
                                            Open Full Editor
                                        </Button>

                                        <Button
                                            component={RouterLink}
                                            to="/background-remover"
                                            variant="outlined"
                                            size="large"
                                            sx={outlineButtonSx}
                                        >
                                            Try Background Remover
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </SiteShell>
    );
}

function HeroPreviewCard() {
    return (
        <Card
            sx={{
                borderRadius: 5,
                overflow: "hidden",
                color: "common.white",
                border: "1px solid rgba(255,255,255,.14)",
                background:
                    "linear-gradient(145deg, rgba(255,255,255,.085), rgba(255,255,255,.035))",
                backdropFilter: "blur(22px)",
                boxShadow: "0 34px 110px rgba(0,0,0,.42)",
                position: "relative",
            }}
        >
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at top right, rgba(82,215,255,.2), transparent 42%), radial-gradient(circle at bottom left, rgba(124,92,255,.18), transparent 38%)",
                    pointerEvents: "none",
                }}
            />

            <CardContent sx={{ p: 3, position: "relative" }}>
                <Stack spacing={2.2}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: "18px",
                                display: "grid",
                                placeItems: "center",
                                color: "#52d7ff",
                                background: "rgba(82,215,255,.12)",
                                border: "1px solid rgba(82,215,255,.18)",
                            }}
                        >
                            <SearchRoundedIcon />
                        </Box>

                        <Box>
                            <Typography
                                variant="overline"
                                sx={{
                                    color: "#52d7ff",
                                    fontWeight: 950,
                                    letterSpacing: 1.2,
                                }}
                            >
                                SEO Entry Points
                            </Typography>

                            <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                One app, many searchable URLs
                            </Typography>
                        </Box>
                    </Stack>

                    <Typography sx={{ color: "rgba(255,255,255,.68)", lineHeight: 1.7 }}>
                        Users can land directly on a task-specific page, select a file from a popup,
                        make a focused edit, and export without seeing the full advanced editor.
                    </Typography>

                    {[
                        "/crop-image",
                        "/resize-image",
                        "/compress-image",
                        "/background-remover",
                        "/photo-filters",
                        "/add-text-to-image",
                    ].map((path) => (
                        <Button
                            key={path}
                            component={RouterLink}
                            to={path}
                            endIcon={<RocketLaunchRoundedIcon />}
                            sx={{
                                justifyContent: "space-between",
                                px: 2,
                                py: 1.35,
                                color: "white",
                                fontWeight: 950,
                                borderRadius: "16px",
                                border: "1px solid rgba(82,215,255,.18)",
                                background:
                                    "linear-gradient(135deg, rgba(82,215,255,.13), rgba(124,92,255,.08))",
                            }}
                        >
                            {path}
                        </Button>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
}

function ToolCard({ tool }) {
    return (
        <Card
            component={RouterLink}
            to={tool.path}
            sx={{
                height: "100%",
                textDecoration: "none",
                color: "common.white",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,.11)",
                background:
                    "linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.035))",
                boxShadow: "0 24px 70px rgba(0,0,0,.26)",
                transition: "transform 180ms ease, border-color 180ms ease",
                "&:hover": {
                    transform: "translateY(-5px)",
                    borderColor: "rgba(82,215,255,.46)",
                },
            }}
        >
            <CardContent sx={{ p: 2.75 }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                            sx={{
                                width: 52,
                                height: 52,
                                borderRadius: "18px",
                                display: "grid",
                                placeItems: "center",
                                color: "#52d7ff",
                                backgroundColor: "rgba(82,215,255,.12)",
                                border: "1px solid rgba(82,215,255,.18)",
                            }}
                        >
                            {tool.icon}
                        </Box>

                        <Chip
                            label={tool.badge}
                            size="small"
                            sx={{
                                color: "#dff8ff",
                                border: "1px solid rgba(82,215,255,.22)",
                                backgroundColor: "rgba(82,215,255,.09)",
                                fontWeight: 900,
                            }}
                        />
                    </Stack>

                    <Box>
                        <Typography
                            component="h2"
                            sx={{
                                fontSize: 21,
                                fontWeight: 950,
                                mb: 1,
                            }}
                        >
                            {tool.title}
                        </Typography>

                        <Typography
                            sx={{
                                color: "rgba(255,255,255,.68)",
                                fontSize: 14.5,
                                lineHeight: 1.7,
                            }}
                        >
                            {tool.description}
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            color: "#52d7ff",
                            fontSize: 13,
                            fontWeight: 950,
                        }}
                    >
                        {tool.path}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}

function InfoPanel({ icon, title, text, buttonLabel, buttonPath }) {
    return (
        <Card
            sx={{
                height: "100%",
                color: "common.white",
                borderRadius: 4,
                background: "rgba(255,255,255,.055)",
                border: "1px solid rgba(255,255,255,.11)",
                boxShadow: "0 22px 70px rgba(0,0,0,.25)",
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Box
                        sx={{
                            width: 54,
                            height: 54,
                            borderRadius: "18px",
                            display: "grid",
                            placeItems: "center",
                            color: "#52d7ff",
                            background: "rgba(82,215,255,.12)",
                            border: "1px solid rgba(82,215,255,.18)",
                        }}
                    >
                        {icon}
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 950 }}>
                        {title}
                    </Typography>

                    <Typography sx={{ color: "rgba(255,255,255,.68)", lineHeight: 1.7 }}>
                        {text}
                    </Typography>

                    <Button
                        component={RouterLink}
                        to={buttonPath}
                        variant="outlined"
                        sx={outlineButtonSx}
                    >
                        {buttonLabel}
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
}

function SisterSiteCard({ site }) {
    return (
        <Card
            sx={{
                height: "100%",
                background: site.gradient,
                border: `1px solid ${site.border}`,
                backdropFilter: "blur(18px)",
                boxShadow: "0 26px 80px rgba(0,0,0,.28)",
                position: "relative",
                overflow: "hidden",
                color: "common.white",
            }}
        >
            <Box
                sx={{
                    position: "absolute",
                    top: -60,
                    right: -60,
                    width: 180,
                    height: 180,
                    borderRadius: "999px",
                    background: site.iconBg,
                    filter: "blur(4px)",
                }}
            />

            <CardContent sx={{ p: 3, position: "relative" }}>
                <Stack spacing={2.2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                width: 58,
                                height: 58,
                                borderRadius: "20px",
                                display: "grid",
                                placeItems: "center",
                                color: site.accent,
                                background: site.iconBg,
                                border: `1px solid ${site.border}`,
                            }}
                        >
                            {site.icon}
                        </Box>

                        <Box>
                            <Typography
                                variant="overline"
                                sx={{
                                    color: site.accent,
                                    fontWeight: 950,
                                    letterSpacing: 1.2,
                                }}
                            >
                                Related Website
                            </Typography>

                            <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                {site.title}
                            </Typography>
                        </Box>
                    </Stack>

                    <Chip
                        label={site.badge}
                        sx={{
                            width: "fit-content",
                            color: site.accent,
                            fontWeight: 950,
                            border: `1px solid ${site.border}`,
                            background: "rgba(0,0,0,.18)",
                        }}
                    />

                    <Typography sx={{ color: "rgba(255,255,255,.72)", lineHeight: 1.75 }}>
                        {site.description}
                    </Typography>

                    <Button
                        component="a"
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        endIcon={<OpenInNewRoundedIcon />}
                        sx={{
                            mt: "auto",
                            color: "#061019",
                            fontWeight: 950,
                            background:
                                "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,.78) 100%)",
                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,.88) 100%)",
                            },
                        }}
                    >
                        {site.cta}
                    </Button>

                    <Typography
                        component="a"
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            color: "rgba(255,255,255,.58)",
                            fontSize: 13,
                            textDecoration: "none",
                            "&:hover": {
                                color: site.accent,
                            },
                        }}
                    >
                        {site.displayUrl}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}

function SectionHeading({ eyebrow, title, description }) {
    return (
        <Stack spacing={2} sx={{ maxWidth: 980, mb: 4 }}>
            <Chip
                label={eyebrow}
                sx={{
                    width: "fit-content",
                    color: "#dff8ff",
                    border: "1px solid rgba(82,215,255,.28)",
                    backgroundColor: "rgba(82,215,255,.09)",
                    fontWeight: 950,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                }}
            />

            <Typography
                component="h2"
                sx={{
                    fontSize: { xs: 32, md: 56 },
                    lineHeight: 1,
                    letterSpacing: "-0.06em",
                    fontWeight: 950,
                }}
            >
                {title}
            </Typography>

            <Typography
                sx={{
                    color: "rgba(255,255,255,.7)",
                    fontSize: 17,
                    lineHeight: 1.75,
                }}
            >
                {description}
            </Typography>
        </Stack>
    );
}

const heroChipSx = {
    color: "#dff8ff",
    fontWeight: 950,
    border: "1px solid rgba(82,215,255,.28)",
    backgroundColor: "rgba(82,215,255,.1)",
    "& .MuiChip-icon": {
        color: "#52d7ff",
    },
};

const heroChipMutedSx = {
    color: "white",
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,.14)",
    backgroundColor: "rgba(255,255,255,.06)",
    "& .MuiChip-icon": {
        color: "#52d7ff",
    },
};

const primaryButtonSx = {
    px: 3,
    py: 1.35,
    borderRadius: 999,
    color: "#061019",
    fontWeight: 950,
    textTransform: "none",
    background: "linear-gradient(135deg, #52d7ff 0%, #7c5cff 100%)",
    boxShadow: "0 18px 48px rgba(82,215,255,.22)",
    "&:hover": {
        background: "linear-gradient(135deg, #8ae8ff 0%, #9f8cff 100%)",
    },
};

const outlineButtonSx = {
    px: 3,
    py: 1.25,
    borderRadius: 999,
    color: "white",
    borderColor: "rgba(255,255,255,.18)",
    fontWeight: 900,
    textTransform: "none",
    "&:hover": {
        borderColor: "rgba(82,215,255,.45)",
        backgroundColor: "rgba(82,215,255,.08)",
    },
};

const quickLinkSx = {
    color: "#dff8ff",
    fontWeight: 900,
    borderRadius: 999,
    px: 1.6,
    py: 0.7,
    border: "1px solid rgba(82,215,255,.2)",
    backgroundColor: "rgba(82,215,255,.07)",
    textTransform: "none",
    "&:hover": {
        backgroundColor: "rgba(82,215,255,.13)",
        borderColor: "rgba(82,215,255,.42)",
    },
};