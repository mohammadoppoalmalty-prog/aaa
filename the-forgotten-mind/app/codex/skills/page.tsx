import type { Metadata } from 'next';
import { allSkills } from '@/content/loader';
import { EmptyState } from '@/codex/ui/EmptyState';
import styles from '../section.module.css';

export const metadata: Metadata = {
  title: 'Skills',
  description: 'What he leads, what he works in, and what he would rather someone better held.',
};

/**
 * Three levels, not a row of percentages.
 *
 * "92% React" is unactionable — nobody knows what 92% of React is. Naming the
 * level of responsibility someone can be given is a claim a hiring engineer can
 * act on, and the third column is what makes the first one believable.
 */
const LEVELS = [
  { id: 'lead', title: 'Put me on it alone', note: 'No supervision needed.' },
  { id: 'fluent', title: 'Fluent, not the expert', note: 'Pair me once and I am fine.' },
  { id: 'supporting', title: 'Hire someone better', note: 'I will support them properly.' },
] as const;

export default function SkillsPage() {
  const skills = allSkills();

  if (skills.length === 0) {
    return (
      <EmptyState
        headline="No skills published yet"
        body="content/skills holds one template. Each entry names a level of responsibility rather than a percentage, because a percentage is not something anyone can act on."
      />
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Skills</h1>
      <p className={styles.lede}>
        Every entry says what level of responsibility it can carry. The third column is deliberate: a portfolio that
        claims everything equally has claimed nothing.
      </p>

      <div className={styles.columns}>
        {LEVELS.map((level) => {
          const held = skills.filter((skill) => skill.data.level === level.id);
          return (
            <section key={level.id} className={styles.column}>
              <h2>{level.title}</h2>
              <p className={styles.note}>{level.note}</p>
              <ul role="list">
                {held.map((skill) => (
                  <li key={skill.data.name}>
                    {skill.data.name} <span>since {skill.data.since}</span>
                  </li>
                ))}
                {held.length === 0 ? <li className={styles.none}>Nothing here yet.</li> : null}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
