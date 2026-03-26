// frontend/src/components/TaskCardSkeleton.jsx
import ContentLoader from "react-content-loader";
import { useTheme } from "../context/ThemeContext";

const TaskCardSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <ContentLoader
      speed={2}
      width={400}
      height={120}
      viewBox="0 0 400 120"
      backgroundColor={isDark ? "#2d2d3a" : "#f0f0f0"}
      foregroundColor={isDark ? "#3d3d4a" : "#e0e0e0"}
    >
      <circle cx="20" cy="20" r="15" />
      <rect x="50" y="12" rx="8" ry="8" width="200" height="18" />
      <rect x="50" y="40" rx="6" ry="6" width="300" height="12" />
      <rect x="50" y="65" rx="6" ry="6" width="150" height="10" />
      <rect x="250" y="85" rx="8" ry="8" width="80" height="28" />
    </ContentLoader>
  );
};

export default TaskCardSkeleton;