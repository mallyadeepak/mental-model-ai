interface BreadcrumbProps {
  trail: { id: string; title: string }[];
  onNavigate: (id: string) => void;
}

export function Breadcrumb({ trail, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-sm">
      {trail.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300 dark:text-gray-600">/</span>}
          {i === trail.length - 1 ? (
            <span className="font-medium text-gray-800 dark:text-gray-100">{crumb.title}</span>
          ) : (
            <button
              onClick={() => onNavigate(crumb.id)}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              {crumb.title}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}
