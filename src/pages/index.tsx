import React from 'react';
import Layout from '@theme/Layout';
import SearchBar from '@theme/SearchBar';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

const sections = [
  {
    id: 'bitrise-platform',
    title: 'Bitrise as a Platform',
    description: 'Learn the fundamentals of your Mobile DevOps platform.',
    href: '/en/bitrise-platform',
    links: [
      {label: 'Getting started with Bitrise', href: '/en/bitrise-platform/getting-started/getting-started-with-the-bitrise-platform'},
      {label: 'Integrations', href: '/en/bitrise-platform/integrations/about-integrations'},
      {label: 'Migrating from Jenkins', href: '/en/bitrise-platform/getting-started/migrating-to-bitrise/migrating-from-jenkins-to-bitrise'},
      {label: 'Workspaces', href: '/en/bitrise-platform/workspaces/workspaces-overview'},
      {label: 'Migrating from App Center', href: '/en/bitrise-platform/getting-started/migrating-to-bitrise/migrating-from-app-center-to-bitrise'},
      {label: 'Bitrise AI FAQs', href: '/en/bitrise-platform/getting-started/ai-faq---how-bitrise-leverages-ai-technologies-in-its-features-and-services'},
    ],
  },
  {
    id: 'bitrise-ci',
    title: 'Bitrise CI',
    description: 'Automate builds and tests, and deploy your mobile apps.',
    href: '/en/bitrise-ci',
    links: [
      {label: 'Getting started with CI', href: '/en/bitrise-ci/getting-started/getting-started'},
      {label: 'Code signing', href: '/en/bitrise-ci/code-signing/ios-code-signing/ios-code-signing'},
      {label: 'Workflows and Pipelines', href: '/en/bitrise-ci/workflows-and-pipelines/workflows/workflows-overview'},
      {label: 'Testing', href: '/en/bitrise-ci/testing/testing-android-apps'},
      {label: 'Builds', href: '/en/bitrise-ci/run-and-analyze-builds/starting-builds/starting-builds-manually'},
      {label: 'Bitrise API', href: '/en/bitrise-ci/api/authenticating-with-the-bitrise-api'},
    ],
  },
  {
    id: 'bitrise-build-cache',
    title: 'Build Cache',
    description: 'Speed up your builds on any CI/CD platform or in a local environment.',
    href: '/en/bitrise-build-cache',
    links: [
      {label: 'Build Cache for Xcode', href: '/en/bitrise-build-cache/build-cache-for-xcode/configuring-the-build-cache-for-xcode-in-the-bitrise-ci-environment'},
      {label: 'Build Cache for Gradle', href: '/en/bitrise-build-cache/build-cache-for-gradle/configuring-the-build-cache-for-gradle-in-the-bitrise-ci-environment'},
      {label: 'Build Cache for Bazel', href: '/en/bitrise-build-cache/build-cache-for-bazel/configuring-the-build-cache-for-bazel-in-the-bitrise-ci-environment'},
    ],
  },
  {
    id: 'bitrise-release-management',
    title: 'Release Management',
    description: 'Test and release your mobile apps in an automated and transparent way.',
    href: '/en/release-management',
    links: [
      {label: 'Build distribution for testing', href: '/en/release-management/build-distribution/managing-distributable-builds'},
      {label: 'Bitrise CodePush', href: '/en/release-management/codepush/about-codepush'},
      {label: 'Distribution API', href: '/en/release-management/release-management-api'},
    ],
  },
  {
    id: 'bitrise-insights',
    title: 'Insights',
    description: 'Explore analytics, monitor trends, and set up alerts to improve efficiency.',
    href: '/en/insights',
    links: [
      {label: 'Metrics', href: '/en/insights/available-metrics-in-insights/bitrise-ci-metrics'},
      {label: 'Alerts', href: '/en/insights/configuring-alerts-in-insights'},
      {label: 'Insights tutorials', href: '/en/insights/insights-tutorials/monitoring-and-optimizing-your-slowest-mobile-builds'},
    ],
  },
  {
    id: 'bitrise-build-hub',
    title: 'Bitrise Build Hub',
    description: 'Use high-performance build infrastructure for GitHub Actions, purpose-built for mobile app development.',
    href: '/en/bitrise-build-hub',
    links: [
      {label: 'Build Hub overview', href: '/en/bitrise-build-hub/build-hub-for-github-actions/build-hub-for-github-actions-overview'},
      {label: 'Configuring Build Hub for GitHub Actions', href: '/en/bitrise-build-hub/build-hub-for-github-actions/configuring-build-hub-for-github-actions'},
      {label: 'Machine types', href: '/en/bitrise-build-hub/infrastructure/build-machine-types'},
    ],
  },
];

function PortalCard({section}: {section: typeof sections[0]}) {
  return (
    <div className={styles.card} data-section={section.id}>
      <div className={styles.cardHeader}>
        <h3><a href={section.href}>{section.title}</a></h3>
        <p>{section.description}</p>
      </div>
      <ul className={styles.cardLinks}>
        {section.links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
      <hr className={styles.cardDivider} />
      <a href={section.href} className={styles.viewAll}>View all</a>
    </div>
  );
}

export default function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout title="Home" description={siteConfig.tagline}>
      {/* Full-width purple gradient hero */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <h1>Welcome to Bitrise Documentation</h1>
            <p>Find product documentation, code samples, API &amp; CLI references, and more.</p>
            <div className={styles.searchBox}>
              <SearchBar />
            </div>
          </div>
          <div className={styles.heroRight}>
            <img
              src="/img/brand/portal-header-illustration.png"
              alt=""
            />
          </div>
        </div>
      </div>

      {/* Subtitle section */}
      <div className={styles.subtitleSection}>
        <div className={styles.subtitleInner}>
          <h2>Learn how to use Bitrise, the Mobile DevOps Platform tailored for mobile engineering teams</h2>
          <p>Bitrise's Mobile DevOps Platform equips you for success every step of the way, from planning to monitoring.</p>
        </div>
      </div>

      {/* Cards section */}
      <div className={styles.cardsSection}>
        <div className={styles.cardsInner}>
          {sections.map((section) => (
            <PortalCard key={section.id} section={section} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
