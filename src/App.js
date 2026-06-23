import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { HelmetProvider } from "react-helmet-async";
import Home from "./pages/home";
import Image from "./pages/image";

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

export default function App() {
  return (
      <HelmetProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/image" element={<Image />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </HelmetProvider>
  );
}