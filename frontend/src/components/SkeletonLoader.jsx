import ContentLoader from 'react-content-loader';

const TaskCardSkeleton = () => {
  // Use inline styles with light/dark detection from CSS
  const isDark = document.body.style.backgroundColor === 'rgb(15, 23, 42)' || 
                  document.body.classList.contains('dark-mode');
  
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

const StatsCardSkeleton = () => {
  const isDark = document.body.style.backgroundColor === 'rgb(15, 23, 42)' || 
                  document.body.classList.contains('dark-mode');
  
  return (
    <ContentLoader
      speed={2}
      width={180}
      height={100}
      viewBox="0 0 180 100"
      backgroundColor={isDark ? "#2d2d3a" : "#f0f0f0"}
      foregroundColor={isDark ? "#3d3d4a" : "#e0e0e0"}
    >
      <rect x="60" y="20" rx="8" ry="8" width="50" height="25" />
      <rect x="70" y="55" rx="4" ry="4" width="30" height="12" />
    </ContentLoader>
  );
};

export { TaskCardSkeleton, StatsCardSkeleton };
export default TaskCardSkeleton;