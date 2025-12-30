import * as React from "react";
import Svg, { Path, G } from "react-native-svg";

export default function WaitWhatLogo({
  width = 120,
  height = 40,
  color = "#FFFFFF",
}) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 600 200"
      fill="none"
    >
      <G fill={color}>
        {/* Paste SVG paths here */}
        <Path d="M10 40 L50 40 ..." />
      </G>
    </Svg>
  );
}
