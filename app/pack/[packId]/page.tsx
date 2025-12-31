import Link from "next/link";
import { getPack } from "../../../lib/store";

export default async function PackPage({
  params
}: {
  params: { packId: string };
}) {
  const pack = await getPack(params.packId);

  if (!pack) {
    return (
      <main>
        <div className="shell">
          <section className="card">
            <div className="section-title">Pack not found</div>
            <p>The share link is invalid or expired.</p>
            <Link className="button secondary" href="/">
              Back to generator
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="shell">
        <section className="card">
          <div className="section-title">{pack.title}</div>
          <p>Generated: {new Date(pack.createdAt).toLocaleString()}</p>
          <Link className="button secondary" href="/">
            Back to generator
          </Link>
        </section>

        <section className="grid-2">
          {pack.researchReport ? (
            <div className="card">
              <div className="section-title">Research report</div>
              <p>{pack.researchReport.summary}</p>
              <div className="list">
                {pack.researchReport.sources.map((source) => (
                  <div key={source.url} className="note-block">
                    <strong>{source.title}</strong>
                    <p>{source.excerpt}</p>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="card">
            <div className="section-title">Blueprint</div>
            <div className="list">
              {pack.blueprint.topics.map((topic) => (
                <div key={topic.id} className="note-block">
                  <strong>{topic.title}</strong>
                  <div className="pill-list">
                    <span className="pill">Weight {topic.weight}%</span>
                    <span className="pill">Order {topic.revisionOrder}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title">Notes</div>
            {pack.notes.map((note) => (
              <div key={note.lectureId} className="note-block">
                <div className="kicker">{note.lectureTitle}</div>
                <p>{note.summary}</p>
                <div className="pill-list">
                  {note.citations.slice(0, 4).map((citation) => (
                    <a
                      key={citation.label}
                      className="pill"
                      href={citation.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {citation.timestamp}
                    </a>
                  ))}
                </div>
                {note.visuals?.length ? (
                  <div className="visuals">
                    {note.visuals.map((visual, index) => (
                      <div key={`${visual.timestamp}-${index}`} className="visual-card">
                        <img src={visual.url} alt={visual.description} />
                        <div className="kicker">{visual.timestamp}</div>
                        <p>{visual.description}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-title">Question bank</div>
            <div className="list">
              {pack.questions.map((question) => (
                <div key={question.id} className="question">
                  <strong>{question.stem}</strong>
                  {question.options ? (
                    <div className="options">
                      {question.options.map((option) => (
                        <div key={option.id} className="option">
                          <span>{option.id}.</span>
                          <span>{option.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="pill-list">
                    {question.citations.slice(0, 2).map((citation) => (
                      <a
                        key={citation.label}
                        className="pill"
                        href={citation.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {citation.timestamp}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
