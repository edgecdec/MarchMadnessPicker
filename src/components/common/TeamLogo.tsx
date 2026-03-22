"use client";
import Box from "@mui/material/Box";
import { SxProps, Theme } from "@mui/material/styles";

export default function TeamLogo({ src, size = 16, sx }: { src: string; size?: number; sx?: SxProps<Theme> }) {
  const pad = Math.max(2, Math.round(size * 0.15));
  return (
    <Box
      component="img"
      src={src}
      alt=""
      sx={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        bgcolor: "background.paper",
        borderRadius: "4px",
        p: `${pad}px`,
        boxSizing: "content-box",
        border: 1,
        borderColor: "divider",
        ...((sx as object) || {}),
      }}
    />
  );
}
