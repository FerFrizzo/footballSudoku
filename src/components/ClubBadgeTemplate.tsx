import React from 'react';
import Svg, { Path, Circle, Defs, ClipPath, G, Polygon } from 'react-native-svg';

interface ClubBadgeTemplateProps {
  templateId: string;
  primaryColor: string;
  secondaryColor: string;
  size?: number;
  selected?: boolean;
}

const SHIELD = 'M 50 5 L 90 20 L 90 60 Q 90 85 50 95 Q 10 85 10 60 L 10 20 Z';

export default function ClubBadgeTemplate({
  templateId,
  primaryColor,
  secondaryColor,
  size = 80,
  selected = false,
}: ClubBadgeTemplateProps) {
  const strokeColor = selected ? '#FFFFFF' : 'transparent';
  const strokeWidth = selected ? 3 : 0;

  const renderBadge = () => {
    switch (templateId) {
      case 'shield_split':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <ClipPath id="shield_split_clip">
                <Path d={SHIELD} />
              </ClipPath>
            </Defs>
            <G clipPath="url(#shield_split_clip)">
              <Path d="M 50 0 L 50 100 L 0 100 L 0 0 Z" fill={primaryColor} />
              <Path d="M 50 0 L 100 0 L 100 100 L 50 100 Z" fill={secondaryColor} />
            </G>
            <Path
              d={SHIELD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Svg>
        );

      case 'shield_stripe':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <ClipPath id="shield_stripe_clip">
                <Path d={SHIELD} />
              </ClipPath>
            </Defs>
            <G clipPath="url(#shield_stripe_clip)">
              <Path d="M 0 0 L 100 0 L 100 100 L 0 100 Z" fill={primaryColor} />
              <Path d="M 0 35 L 100 35 L 100 65 L 0 65 Z" fill={secondaryColor} />
            </G>
            <Path
              d={SHIELD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Svg>
        );

      case 'circle_badge':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="44" fill={primaryColor} />
            <Circle cx="50" cy="50" r="38" fill={secondaryColor} />
            <Circle cx="50" cy="50" r="32" fill={primaryColor} />
            <Circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Svg>
        );

      case 'diamond':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Polygon points="50,5 95,50 50,95 5,50" fill={primaryColor} />
            <Polygon points="50,20 80,50 50,80 20,50" fill={secondaryColor} />
            <Polygon
              points="50,5 95,50 50,95 5,50"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Svg>
        );

      case 'pennant_stripe':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <ClipPath id="pennant_clip">
                <Path d={SHIELD} />
              </ClipPath>
            </Defs>
            <G clipPath="url(#pennant_clip)">
              <Path d="M 0 0 L 100 0 L 100 100 L 0 100 Z" fill={primaryColor} />
              <Path d="M -10 30 L 40 -10 L 60 -10 L -10 60 Z" fill={secondaryColor} />
              <Path d="M 20 110 L 70 10 L 110 10 L 60 110 Z" fill={secondaryColor} />
              <Path d="M 60 110 L 110 30 L 110 60 L 90 110 Z" fill={secondaryColor} />
            </G>
            <Path
              d={SHIELD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Svg>
        );

      case 'chevron':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <ClipPath id="chevron_clip">
                <Path d={SHIELD} />
              </ClipPath>
            </Defs>
            <G clipPath="url(#chevron_clip)">
              <Path d="M 0 0 L 100 0 L 100 100 L 0 100 Z" fill={primaryColor} />
              <Path d="M 10 38 L 50 62 L 90 38 L 90 58 L 50 82 L 10 58 Z" fill={secondaryColor} />
            </G>
            <Path
              d={SHIELD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Svg>
        );

      default:
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Path d={SHIELD} fill={primaryColor} />
          </Svg>
        );
    }
  };

  return renderBadge();
}
