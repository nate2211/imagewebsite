import React from "react";
import {
  BrowserRouter,
  Link as RouterLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from "@mui/material";
import {
  CollectionsRounded,
  HomeRounded,
  ImageRounded,
  TuneRounded,
} from "@mui/icons-material";
import { HelmetProvider } from "react-helmet-async";

import Home from "./pages/home";
import Image from "./pages/image";
import Archive from "./pages/archive";
import AdditionalPages from "./pages/additionalpages";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#52d7ff",
    },
    secondary: {
      main: "#7c5cff",
    },
    background: {
      default: "#07090f",
      paper: "#0e1118",
    },
  },
  typography: {
    fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 800,
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

const navItems = [
  {
    label: "Home",
    path: "/",
    icon: <HomeRounded />,
  },
  {
    label: "Image",
    path: "/image",
    icon: <ImageRounded />,
  },
  {
    label: "Archive",
    path: "/archive",
    icon: <CollectionsRounded />,
  },
];

function NavBar() {
  const location = useLocation();

  return (
      <AppBar
          position="sticky"
          elevation={0}
          sx={{
            top: 0,
            zIndex: (themeValue) => themeValue.zIndex.drawer + 20,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background:
                "linear-gradient(135deg, rgba(7,9,15,0.94), rgba(13,18,30,0.9))",
            backdropFilter: "blur(18px)",
          }}
      >
        <Container maxWidth="xl">
          <Toolbar
              disableGutters
              sx={{
                minHeight: { xs: 64, md: 74 },
                gap: 1.5,
                justifyContent: "space-between",
              }}
          >
            <Button
                component={RouterLink}
                to="/"
                startIcon={<TuneRounded />}
                sx={{
                  minWidth: 0,
                  px: { xs: 1, sm: 1.5 },
                  borderRadius: 999,
                  color: "#f7fbff",
                  fontWeight: 950,
                  fontSize: { xs: "0.95rem", sm: "1.08rem" },
                  letterSpacing: 0,
                  "& .MuiButton-startIcon": {
                    mr: { xs: 0, sm: 1 },
                  },
                }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                ImageMasterLab
              </Box>
            </Button>

            <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  p: 0.5,
                  maxWidth: "100%",
                  overflowX: "auto",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.045)",
                }}
            >
              {navItems.map((item) => {
                const active =
                    item.path === "/"
                        ? location.pathname === "/"
                        : location.pathname === item.path ||
                        location.pathname.startsWith(`${item.path}/`);

                return (
                    <Button
                        key={item.path}
                        component={RouterLink}
                        to={item.path}
                        startIcon={item.icon}
                        sx={{
                          minHeight: 42,
                          px: { xs: 1.25, sm: 1.8 },
                          borderRadius: 999,
                          color: active ? "#07111f" : "#d9e6f7",
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                          background: active
                              ? "linear-gradient(135deg, #52d7ff, #9a84ff)"
                              : "transparent",
                          boxShadow: active
                              ? "0 10px 24px rgba(82,215,255,0.18)"
                              : "none",
                          "&:hover": {
                            background: active
                                ? "linear-gradient(135deg, #7ee3ff, #b4a4ff)"
                                : "rgba(255,255,255,0.08)",
                          },
                          "& .MuiButton-startIcon": {
                            mr: { xs: 0, sm: 0.75 },
                          },
                        }}
                    >
                      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                        {item.label}
                      </Box>
                    </Button>
                );
              })}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
  );
}

function AppRoutes() {
  return (
      <>
        <NavBar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/image" element={<Image />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/additional-pages" element={<AdditionalPages />} />
          <Route path="/crop-image" element={<AdditionalPages />} />
          <Route path="/resize-image" element={<AdditionalPages />} />
          <Route path="/compress-image" element={<AdditionalPages />} />
          <Route path="/background-remover" element={<AdditionalPages />} />
          <Route path="/photo-filters" element={<AdditionalPages />} />
          <Route path="/convert-to-png" element={<AdditionalPages />} />
          <Route path="/convert-to-jpg" element={<AdditionalPages />} />
          <Route path="/convert-to-webp" element={<AdditionalPages />} />
          <Route path="/add-text-to-image" element={<AdditionalPages />} />
          <Route path="/watermark-image" element={<AdditionalPages />} />
          <Route path="/meme-maker" element={<AdditionalPages />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Box
            component="footer"
            sx={{
              py: 2.5,
              px: 2,
              textAlign: "center",
              color: "rgba(244,248,255,0.58)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "#07090f",
            }}
        >
          <Typography variant="body2">
            ImageMasterLab image tools, editor, and Archive image search.
          </Typography>
        </Box>
      </>
  );
}

export default function App() {
  return (
      <HelmetProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </HelmetProvider>
  );
}
