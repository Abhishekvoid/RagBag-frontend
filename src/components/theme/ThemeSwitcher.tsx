// // src/components/theme/ThemeSwitcher.tsx
// "use client";

// import { useTheme } from "../theme-provider";
// import { ThemeName } from "./theme";

// export function ThemeSwitcher() {
//   const { theme, setTheme, toggleVariant, variant } = useTheme();

//   const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setTheme(e.target.value as ThemeName);
//   };

//   return (
//     <div className="flex items-center gap-2">
//       {/* Dropdown for selecting theme */}
//       <select
//         value={theme}
//         onChange={handleSelect}
//         className="border rounded p-1 bg-background text-foreground"
//       >
//         <option value="cosmic-night">Cosmic Night</option>
//         <option value="notebook">Notebook</option>
//         <option value="vintage-paper">Vintage Paper</option>
//       </select>

//       {/* Toggle for light/dark */}
//       <button
//         onClick={toggleVariant}
//         className="px-2 py-1 rounded bg-primary text-primary-foreground"
//       >
//         {variant === "light" ? "🌞 Light" : "🌙 Dark"}
//       </button>
//     </div>
//   );
// }
