import type { Metadata } from 'next';
import Link from 'next/link';
import { allProjects } from '@/content/loader';
import { TOTAL_MEMORIES, ALL_AREAS } from '@/world/areas/manifest';
import { Restoration } from '@/overture/Restoration';
import { Counters } from '@/overture/Counters';
import { Ridge } from '@/overture/Ridge';
import { Doors } from '@/overture/Doors';
import styles from './overture.module.css';

export const metadata: Metadata = {
  title: 'An interactive portfolio',
  description:
    'A portfolio built as a world you can walk through — and a complete, readable archive for anyone who only has five minutes.',
};

/**
 * The Overture — screen 00, GDD Part 8.
 *
 * It answers the question the title screen cannot: what is this, who made it,
 * and why should I give it my time. Without it, a visitor's first decision is a
 * leap of faith.
 *
 * It was a genuine risk to this project's hardest constraint — time to portfolio
 * content ≤ 1 input — and it is only admissible because of one rule, held here:
 * **the three doors are in the first viewport and pinned to the bottom of every
 * one after it.** It adds a path; it never adds a gate.
 *
 * Server-rendered. The only client code is four small islands: the scroll
 * progress that heals the page, the counters, the canvas, and the door that
 * knows whether you have a save.
 */
export default function Overture() {
  const projects = allProjects();

  return (
    <main className={styles.page}>
      <Restoration />

      {/* §0 — the hero. State what this is in five seconds. */}
      <section className={styles.hero}>
        <Ridge />
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>An interactive portfolio</p>
          <h1 className={styles.title}>
            The <strong>Forgotten Mind</strong>
          </h1>
          <p className={styles.lede}>
            A world that remembers a career, and forgets it again if nobody walks through it. Everything inside is also
            written down plainly — so you can explore it, or read it, and neither route is the consolation prize.
          </p>
          <Doors />
          <p className={styles.scrollHint}>
            Or read on. This page warms as you scroll, which is the same thing the world does when you remember
            something.
          </p>
        </div>
      </section>

      {/* §1 — remove the leap of faith. */}
      <Section id="what" eyebrow="What this is" title="Three true things, before you decide">
        <div className={styles.panels}>
          <article>
            <h3>It is a portfolio</h3>
            <p>
              Projects, work history, skills at the level they are actually held, and the failures attached to each of
              them. All of it readable in about five minutes.
            </p>
          </article>
          <article>
            <h3>It is also a world</h3>
            <p>
              Nineteen places, a hundred memories, sixteen puzzles and a guardian who will admit when it does not know
              something. About an hour if you take your time.
            </p>
          </article>
          <article>
            <h3>You never have to play it</h3>
            <p>
              The Codex holds everything the world holds, at any moment, in one click. That is not a fallback — it is
              half the design, and it is the half that is accessible at AAA.
            </p>
          </article>
        </div>
      </Section>

      {/* §2 — make it a person rather than a product. */}
      <Section id="who" eyebrow="Who made it" title="One person, in the evenings">
        <div className={styles.who}>
          <blockquote className={styles.quote}>
            “A list of jobs tells you what someone did. A world tells you how they think. This has both, because you
            should not have to choose.”
          </blockquote>
          <div className={styles.whoText}>
            <p>
              <span className={styles.pending}>The two honest paragraphs here are yours to write.</span> They belong in{' '}
              <code>content/</code> beside the rest, and this page renders them from there — the same source the world
              reads, so the two halves can never say different things about the same person.
            </p>
            <p>
              The rest of this page is real and running today: the architecture, the two layers, the accessibility
              posture, and every number below.
            </p>
          </div>
        </div>
      </Section>

      {/* §3 — convey scale without a wall of text. */}
      <Section id="inside" eyebrow="What is inside" title="The scale of it">
        <Counters
          counts={[
            { value: ALL_AREAS.length, label: 'places' },
            { value: TOTAL_MEMORIES, label: 'memories' },
            { value: 10, label: 'projects' },
            { value: 16, label: 'puzzles' },
            { value: 5, label: 'endings' },
            { value: 1, label: 'guardian' },
          ]}
        />
        <p className={styles.footnote}>
          Counts from the world atlas, which is one typed table — so this section cannot claim nineteen places while the
          game holds eighteen.
        </p>
      </Section>

      {/* §4 — make the choice informed rather than blind. */}
      <Section id="ways" eyebrow="Two ways in" title="Both go to the same content">
        <div className={styles.ways}>
          <article>
            <p className={styles.wayCost}>20–60 minutes</p>
            <h3>The world</h3>
            <p>
              WebGL, walkable, third-person. It streams as you go, saves the moment you look away, and offers you the
              exit any time you want it — with no penalty and nothing withheld.
            </p>
            <Link href="/world">Enter the world →</Link>
          </article>
          <article>
            <p className={styles.wayCost}>Under a minute</p>
            <h3>The Codex</h3>
            <p>
              Server-rendered HTML. No WebGL, no waiting, crawlable, printable, and readable on a phone on a train. It
              is a conforming alternate version of the whole world.
            </p>
            <Link href="/codex">Open the Codex →</Link>
          </article>
        </div>
      </Section>

      {/* §5 — deliver value before any commitment. */}
      <Section id="work" eyebrow="Selected work" title="Three, with what broke in them">
        {projects.length === 0 ? (
          <p className={styles.pending}>
            No projects are authored yet, so this section shows nothing rather than something invented. The schema is in
            place and requires a real failure in every entry — see <code>content/projects</code>.
          </p>
        ) : (
          <div className={styles.work}>
            {projects.slice(0, 3).map(({ data }) => (
              <article key={data.slug}>
                <p className={styles.wayCost}>
                  {data.year} · {data.role}
                </p>
                <h3>
                  <Link href={`/codex/projects/${data.slug}`}>{data.title}</Link>
                </h3>
                <ul className={styles.stack} role="list">
                  {data.stack.slice(0, 5).map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
                <p className={styles.broke}>
                  <span>What broke</span>
                  {data.whatBroke}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>

      {/* §6 — close on the choice, at full size. */}
      <Section id="enter" eyebrow="Enter" title="Whichever you have time for">
        <Doors />
        <p className={styles.footnote}>
          Returning, and want the plain screen? <Link href="/enter">The gate is here</Link>. What is and is not
          accessible is written down at <Link href="/accessibility">/accessibility</Link>.
        </p>
      </Section>

      <Doors pinned />
    </main>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section} id={id} aria-labelledby={`${id}-title`}>
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.sectionTitle} id={`${id}-title`}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
