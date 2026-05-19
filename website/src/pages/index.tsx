import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

type Audience = {
  title: string;
  description: string;
  href: string;
};

const audiences: Audience[] = [
  {
    title: 'Frivillig',
    description:
      'Du vil melde deg på som frivillig eller medlem. Følg trinnene i påmeldingsskjemaet.',
    href: '/docs/users/public-registration',
  },
  {
    title: 'Stab',
    description:
      'Du tar imot påmeldinger eller endrer innhold. Velg din rolle på administrasjonssiden.',
    href: '/docs/users/admin/',
  },
  {
    title: 'Utvikler',
    description:
      'Du setter opp eller endrer Railway. Bidragsyterguidene dekker kode, database og deploy.',
    href: '/docs/contributors/',
  },
];

function HomepageHeader(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--lg button--secondary"
            to="/docs/users/public-registration"
          >
            Meld deg på
          </Link>
          <Link
            className="button button--lg button--secondary button--outline"
            to="/docs/users/admin/"
          >
            Administrasjon
          </Link>
          <Link
            className="button button--lg button--secondary button--outline"
            to="/docs/contributors/"
          >
            Utvikler
          </Link>
        </div>
      </div>
    </header>
  );
}

function AudienceGrid(): JSX.Element {
  return (
    <section className={styles.audienceSection}>
      <div className="container">
        <h2 className={styles.audienceHeading}>Hvem er du?</h2>
        <div className={styles.audienceGrid}>
          {audiences.map((a) => (
            <Link key={a.href} to={a.href} className={clsx('card', styles.audienceCard)}>
              <div className="card__header">
                <h3>{a.title}</h3>
              </div>
              <div className="card__body">
                <p>{a.description}</p>
              </div>
              <div className="card__footer">
                <span className={styles.audienceCardCta}>Les mer →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Frivilligregistrering for Oslo Røde Kors — påmeldingsskjema for frivillige og medlemmer, og administrasjonsgrensesnitt for staben."
    >
      <HomepageHeader />
      <main>
        <AudienceGrid />
      </main>
    </Layout>
  );
}
