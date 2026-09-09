import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { allProjects, projectBySlug } from '@/content/loader';
import styles from './project.module.css';

/* Every project is a real, crawlable, shareable URL — generated at build time,
   so a link pasted into a conversation unfurls and loads instantly. */
export function generateStaticParams() {
  return allProjects().map(({ data }) => ({ slug: data.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = projectBySlug(slug);
  if (!entry) return { title: 'Not found' };
  return {
    title: entry.data.title,
    description: entry.data.narratorLine,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = projectBySlug(slug);
  if (!entry) notFound();

  const { data, body } = entry;

  return (
    <article className={styles.page}>
      <header className={styles.head}>
        <p className={styles.meta}>
          {data.year} · {data.role} · {data.status}
        </p>
        <h1 className={styles.title}>{data.title}</h1>
        <p className={styles.narrator}>{data.narratorLine}</p>
        <ul className={styles.stack} role="list">
          {data.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
        <p className={styles.links}>
          {data.demo ? <a href={data.demo}>Live demo</a> : null}
          {data.repo ? (
            <a href={data.repo}>Source</a>
          ) : (
            <span className={styles.noRepo}>No public repo — {data.repoAbsentReason}</span>
          )}
        </p>
      </header>

      {data.metrics.length > 0 ? (
        <dl className={styles.metrics}>
          {data.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className={`${styles.body} flow prose`}>
        <MDXRemote source={body} />
      </div>

      {/* The two fields the schema makes mandatory, given the weight they earn. */}
      <section className={styles.honest} aria-labelledby="what-broke">
        <h2 id="what-broke">What broke</h2>
        <p>{data.whatBroke}</p>
        <h2>What I learned</h2>
        <p>{data.whatILearned}</p>
      </section>

      <p className={styles.back}>
        <Link href="/codex/projects">← All projects</Link>
      </p>
    </article>
  );
}
