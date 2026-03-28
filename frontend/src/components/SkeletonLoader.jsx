import ContentLoader from "react-content-loader";
import { useTheme } from "../context/ThemeContext";

// FIX: was accessing document.body.style at render time (SSR-unsafe + incorrect detection)
// Now uses ThemeContext correctly

const TaskCardSkeleton = () => {
  const { isDark } = useTheme();
  return (
    <ContentLoader
      speed={2}
      width="100%"
      height={90}
      viewBox="0 0 400 90"
      backgroundColor={isDark ? "#1e293b" : "#f1f5f9"}
      foregroundColor={isDark ? "#2d3f54" : "#e2e8f0"}
    >
      <circle cx="18" cy="18" r="12" />
      <rect x="40" y="10" rx="6" ry="6" width="200" height="14" />
      <rect x="40" y="32" rx="5" ry="5" width="280" height="10" />
      <rect x="40" y="50" rx="5" ry="5" width="120" height="9" />
      <rect x="310" y="55" rx="7" ry="7" width="74" height="24" />
    </ContentLoader>
  );
};

const StatsCardSkeleton = () => {
  const { isDark } = useTheme();
  return (
    <ContentLoader
      speed={2}
      width={180}
      height={90}
      viewBox="0 0 180 90"
      backgroundColor={isDark ? "#1e293b" : "#f1f5f9"}
      foregroundColor={isDark ? "#2d3f54" : "#e2e8f0"}
    >
      <rect x="55" y="18" rx="7" ry="7" width="60" height="22" />
      <rect x="65" y="50" rx="4" ry="4" width="40" height="11" />
    </ContentLoader>
  );
};

export { TaskCardSkeleton, StatsCardSkeleton };
export default TaskCardSkeleton;
