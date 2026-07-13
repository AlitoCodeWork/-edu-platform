import type { ContentResult } from "@/lib/content/types";

const TYPE_LABEL: Record<string, string> = {
  video: "Video",
  book: "Libro",
  magazine: "Revista",
  paper: "Paper",
  image: "Imagen",
  news: "Noticia",
};

export function ContentCard({ item }: { item: ContentResult }) {
  const label = TYPE_LABEL[item.type] ?? item.type;
  return (
    <article className="card">
      {item.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="card-thumb" src={item.thumbnail} alt="" loading="lazy" />
      ) : (
        <div className="card-thumb card-thumb--empty">{label}</div>
      )}
      <div className="card-body">
        <span className="badge">{label}</span>
        <h3 className="card-title">{item.title}</h3>
        <span className="card-source">{item.source}</span>
        <div className="card-actions">
          {item.embedUrl && (
            <a className="btn btn-primary" href={item.embedUrl} target="_blank" rel="noreferrer">
              Ver
            </a>
          )}
          {item.downloadUrl && (
            <a className="btn" href={item.downloadUrl} target="_blank" rel="noreferrer">
              Descargar
            </a>
          )}
          {!item.embedUrl && !item.downloadUrl && (
            <a className="btn" href={item.sourceUrl} target="_blank" rel="noreferrer">
              Ir a la fuente
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
