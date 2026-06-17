import type { Project } from "../../lib/api.js";
import ProjectTile from "./ProjectTile.js";

interface Props {
  projects: Project[];
  onOpen: (p: Project) => void;
}

export default function ProjectGrid({ projects, onOpen }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p, i) => (
        <ProjectTile key={p.id} project={p} onOpen={onOpen} index={i} />
      ))}
    </div>
  );
}
