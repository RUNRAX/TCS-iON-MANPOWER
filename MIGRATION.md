# iOS 26.4 "Liquid Glass" UI Upgrade
## Drop-in migration guide for TCS iON Manpower Portal

---

### What's included

| File | Description |
|------|-------------|
| `app/globals.css` | Full CSS token system — glass utilities, radius variables, spring timing |
| `components/ui/glass3d.tsx` | Upgraded material system — GlassCard, GlassPanel, GlassSheet, GlassButton, GlassBadge, GlassDivider |
| `components/layout/SiteLayout.tsx` | Sidebar + header with 3-layer glass edge lighting and spring nav |
| `app/(auth)/login/page.tsx` | Login page with glow-pulse app icon, spring submit button, and edge-lit card |
| `app/(dashboard)/admin/dashboard/page.tsx` | Admin dashboard with staggered stat cards and animated booking table |

---

### How to apply

1. **Back up your originals** — copy the existing files to `.bak` before replacing.

2. **Replace files** — drop each file from this package into the matching path in your project root.

3. **No new dependencies** — every upgrade uses only packages already in your `package.json`:
   - `framer-motion` (already installed)
   - `lucide-react` (already installed)
   - CSS built-ins only

4. **Tailwind config** — no changes needed. The new system uses inline CSS + CSS variables
   for all glass effects (Tailwind classes are additive, not replaced).

5. **Test pages** — run `npm run dev` and verify:
   - `/login` — glass card with edge lighting and ambient orbs
   - `/admin/dashboard` — staggered stat cards with tilt + glow
   - Sidebar navigation — spring-physics nav items with active bar animation
   - Theme toggle — smooth dark/light transitions

---

### The iOS 26.4 Glass System — 3-Layer Model

Every glass surface in this upgrade implements Apple's "Liquid Glass" stack:

```
Layer 1: backdrop-filter: blur(40px) saturate(200%) brightness(1.06)
         → The frosted lens — blurs and richens content behind it

Layer 2: background: rgba(10,8,24,0.52) [dark] / rgba(255,255,255,0.68) [light]
         → The tinted glass body — semi-transparent fill

Layer 3: box-shadow:
           inset 0  1.5px 0  rgba(255,255,255,0.20)  /* top specular  */
           inset 0  -1px  0  rgba(0,0,0,0.16)         /* bottom shadow */
           inset  1px 0   0  rgba(255,255,255,0.09)   /* left rim      */
           inset -1px 0   0  rgba(255,255,255,0.04)   /* right rim     */
           0 16px 56px -8px rgba(0,0,0,0.45)          /* outer drop    */
         → The 3D edge chamfer — makes the surface feel physically thick
```

---

### Spring Physics — Apple Timing Reference

| Interaction | Curve | Use case |
|-------------|-------|----------|
| `cubic-bezier(0.25, 1, 0.5, 1)` | `--spring-snappy` | Button hover/tap |
| `cubic-bezier(0.34, 1.56, 0.64, 1)` | `--spring-bounce` | Scale-up reveal |
| `cubic-bezier(0.22, 1, 0.36, 1)` | `--spring-smooth` | Page transitions |
| `cubic-bezier(0.0, 0.0, 0.2, 1)` | `--spring-decel` | Theme color shifts |

Framer-motion spring config: `{ stiffness: 320–420, damping: 24–32 }`

---

### Extending to other pages

Apply this pattern to any new page:

```tsx
import { GlassCard, GlassBadge, GlassButton } from "@/components/ui/glass3d";
import { useTheme } from "@/lib/context/ThemeContext";

export default function MyPage() {
  const { dark } = useTheme();

  return (
    <div className="p-6 space-y-6">
      {/* Stat card */}
      <GlassCard depth={12} className="rounded-2xl p-5">
        <p className="text-2xl font-black" style={{ color: dark ? "#f0eeff" : "#0f0a2e" }}>
          42
        </p>
        <p className="text-sm mt-1" style={{ color: dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.44)" }}>
          Active shifts
        </p>
      </GlassCard>

      {/* Action button */}
      <GlassButton variant="primary" size="md">
        Add shift
      </GlassButton>

      {/* Status badge */}
      <GlassBadge color="#34d399" pulse>Live</GlassBadge>
    </div>
  );
}
```

---

### Radius nesting rule (Apple squircle math)

Always nest radii at a 0.60–0.65 ratio inward:

```
Outer container: border-radius: 32px  (var(--radius-xl))
  Inner card:    border-radius: 20px  (~0.625 × 32)
    Inner button: border-radius: 13px (~0.65 × 20)
      Inner chip: border-radius: 8px  (var(--radius-xs))
```

---

*TCS iON Manpower Portal · iOS 26.4 Glass System*
