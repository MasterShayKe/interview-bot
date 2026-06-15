import type { Project } from "../../lib/api.js";
import ProjectTile from "./ProjectTile.js";

interface Props {
  projects: Project[];
  onOpen: (p: Project) => void;
  /** Optional extra tile(s) rendered after the projects (e.g. the GitHub tile). */
  trailing?: React.ReactNode;
}

export default function ProjectGrid({ projects, onOpen, trailing }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {projects.map((p) => (
        <ProjectTile key={p.id} project={p} onOpen={onOpen} />
      ))}
      {trailing}
    </div>
  );
}
