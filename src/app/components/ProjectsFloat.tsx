import { ArrowUpRight } from "./Icons";

type Project = { title: string; desc: string; tags: string[]; href: string };

const ACCENTS = ["#67e8f9", "#6ee7b7", "#60a5fa", "#a5f3fc"];

/** Projects as a calm, centred grid. Only the "view code" link is interactive. */
export default function ProjectsFloat({ projects }: { projects: Project[] }) {
  return (
    <div className="pgrid">
      {projects.map((p, i) => (
        <article key={p.title} className="pcard" style={{ ["--c1" as string]: ACCENTS[i % ACCENTS.length] } as React.CSSProperties}>
          <span className="pcard-num mono">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="pcard-title">{p.title}</h3>
          <p className="pcard-desc">{p.desc}</p>
          <div className="chips">
            {p.tags.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
          <a href={p.href} target="_blank" rel="noreferrer" className="pcard-link mono">
            view code <ArrowUpRight />
          </a>
        </article>
      ))}
    </div>
  );
}
