# Grafana Dashboards

This directory contains Grafana dashboard JSON files for visualizing Stellaris empire budget data.

## Dashboard Files

- `empireBudget.json` - Main empire budget overview with all resource types
- `energyBudget.json` - Energy resource breakdown
- `mineralsBudget.json` - Minerals resource breakdown
- `foodBudget.json` - Food resource breakdown
- `tradeBudget.json` - Trade value breakdown
- `alloysBudget.json` - Alloys resource breakdown
- `consumerGoodsBudget.json` - Consumer goods breakdown
- `unityBudget.json` - Unity resource breakdown

## Resource Color Codes

The Empire Budget dashboard uses the following color scheme for resources:

### Basic Resources

| Resource | Color | Hex Code |
|----------|-------|----------|
| Energy | Yellow | `#F2CC0C` |
| Minerals | Red | `#E02F44` |
| Food | Green | `#73BF69` |
| Trade | Blue | `#8AB8FF` |

### Advanced Resources

| Resource | Color | Hex Code |
|----------|-------|----------|
| Alloys | Hot Pink | `#FF69B4` |
| Consumer Goods | Saddle Brown | `#8B4513` |

### Strategic Resources

| Resource | Color | Hex Code |
|----------|-------|----------|
| Exotic Gases | Green | `#73BF69` |
| Rare Crystals | Yellow | `#F2CC0C` |
| Volatile Motes | Saddle Brown | `#8B4513` |

### Rare Resources

| Resource | Color | Hex Code |
|----------|-------|----------|
| Zro | Light Blue | `#5DADE2` |
| Dark Matter | Purple | `#9B59B6` |
| Living Metal | Gray | `#616161` |
| Nanites | Light Gray | `#BDBDBD` |

### Abstract Resources

| Resource | Color | Hex Code |
|----------|-------|----------|
| Influence | Purple | `#A64D79` |
| Unity | Turquoise | `#56B4E9` |
| Physics Research | Blue | `#3274A1` |
| Engineering Research | Yellow | `#F2CC0C` |
| Society Research | Green | `#73BF69` |

## Applying Colors

Apply colors using field overrides with:
- `matcher.id: "byName"`
- `properties.id: "color"`
- `mode: "fixed"`
