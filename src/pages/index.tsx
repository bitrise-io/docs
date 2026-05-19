import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  BitkitProvider,

  BitkitLink,
  IconDashboard,
  IconCi,
  IconBuildCache,
  IconRelease,
  IconInsights,
  IconCpu,
} from '@bitrise/bitkit-v2';
import styles from './index.module.css';

type SectionLink = {label: string; href: string};

type Section = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{size?: '16' | '24'}>;
  iconBg: string;
  iconColor: string;
  columns: [SectionLink[], SectionLink[]] | [SectionLink[]];
};

const sections: Section[] = [
  {
    id: 'bitrise-platform',
    title: 'Bitrise as a Platform',
    description: 'Learn the fundamentals of your Mobile DevOps platform.',
    href: '/en/bitrise-platform',
    icon: IconDashboard,
    iconBg: '#f6eaff',
    iconColor: '#7b3ba5',
    columns: [
      [
        {label: 'Getting started with Bitrise', href: '/en/bitrise-platform/getting-started/getting-started-with-the-bitrise-platform'},
        {label: 'Integrations', href: '/en/bitrise-platform/integrations/about-integrations'},
        {label: 'Migrating from Jenkins', href: '/en/bitrise-ci/getting-started/migrating-to-bitrise/migrating-from-jenkins-to-bitrise'},
      ],
      [
        {label: 'Workspaces', href: '/en/bitrise-platform/workspaces/workspaces-overview'},
        {label: 'Migrating from App Center', href: '/en/bitrise-ci/getting-started/migrating-to-bitrise/migrating-from-app-center-to-bitrise'},
        {label: 'Bitrise AI FAQs', href: '/en/bitrise-platform/ai/ai-faq---how-bitrise-leverages-ai-technologies-in-its-features-and-services'},
      ],
    ],
  },
  {
    id: 'bitrise-ci',
    title: 'Bitrise CI',
    description: 'Automate builds and tests, and deploy your mobile apps.',
    href: '/en/bitrise-ci',
    icon: IconCi,
    iconBg: '#ffd7c9',
    iconColor: '#d45202',
    columns: [
      [
        {label: 'Getting started with CI', href: '/en/bitrise-ci/getting-started/getting-started'},
        {label: 'Workflows and Pipelines', href: '/en/bitrise-ci/workflows-and-pipelines/workflows/workflows-overview'},
        {label: 'Builds', href: '/en/bitrise-ci/run-and-analyze-builds/starting-builds/starting-builds-manually'},
      ],
      [
        {label: 'Code signing', href: '/en/bitrise-ci/code-signing/ios-code-signing/ios-code-signing'},
        {label: 'Testing', href: '/en/bitrise-ci/testing/testing-android-apps/android-unit-tests'},
        {label: 'Bitrise API', href: '/en/bitrise-ci/api/authenticating-with-the-bitrise-api'},
      ],
    ],
  },
  {
    id: 'bitrise-build-cache',
    title: 'Build Cache',
    description: 'Speed up your builds on any CI/CD platform or in a local environment.',
    href: '/en/bitrise-build-cache',
    icon: IconBuildCache,
    iconBg: '#fff4cd',
    iconColor: '#b27e00',
    columns: [
      [
        {label: 'Build Cache for Xcode', href: '/en/bitrise-build-cache/build-cache-for-xcode/configuring-the-build-cache-for-xcode-in-the-bitrise-ci-environment'},
        {label: 'Build Cache for Gradle', href: '/en/bitrise-build-cache/build-cache-for-gradle/configuring-the-build-cache-for-gradle-in-the-bitrise-ci-environment'},
        {label: 'Build Cache for Bazel', href: '/en/bitrise-build-cache/build-cache-for-bazel/configuring-the-build-cache-for-bazel-in-the-bitrise-ci-environment'},
      ],
    ],
  },
  {
    id: 'release-management',
    title: 'Release Management',
    description: 'Test and release your mobile apps in an automated and transparent way.',
    href: '/en/release-management',
    icon: IconRelease,
    iconBg: '#d7f5ff',
    iconColor: '#2582d0',
    columns: [
      [
        {label: 'Build distribution for testing', href: '/en/release-management/build-distribution/distributing-builds-to-testers'},
        {label: 'Bitrise CodePush', href: '/en/release-management/codepush/about-codepush'},
        {label: 'Distribution API', href: '/en/release-management/release-management-api'},
      ],
    ],
  },
  {
    id: 'insights',
    title: 'Insights',
    description: 'Explore analytics, monitor trends, and set up alerts to improve efficiency.',
    href: '/en/insights',
    icon: IconInsights,
    iconBg: '#dbfff3',
    iconColor: '#2a9d4c',
    columns: [
      [
        {label: 'Metrics', href: '/en/insights/available-metrics-in-insights/bitrise-ci-metrics'},
        {label: 'Alerts', href: '/en/insights/configuring-alerts-in-insights'},
        {label: 'Insights tutorials', href: '/en/insights/insights-tutorials/monitoring-and-optimizing-your-slowest-mobile-builds'},
      ],
    ],
  },
  {
    id: 'bitrise-build-hub',
    title: 'Build Hub',
    description: 'Use high-performance build infrastructure for GitHub Actions, purpose-built for mobile app development.',
    href: '/en/bitrise-build-hub',
    icon: IconCpu,
    iconBg: '#efebef',
    iconColor: '#7d7184',
    columns: [
      [
        {label: 'Build Hub overview', href: '/en/bitrise-build-hub/build-hub-for-github-actions/build-hub-for-github-actions-overview'},
        {label: 'Configuring Build Hub for Github Actions', href: '/en/bitrise-build-hub/build-hub-for-github-actions/configuring-build-hub-for-github-actions'},
        {label: 'Machine types', href: '/en/bitrise-build-hub/infrastructure/build-machine-types'},
      ],
    ],
  },
];

function ProductCard({section}: {section: Section}) {
  const Icon = section.icon;
  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <div className={styles.cardTitleBlock}>
          <div
            className={styles.productIcon}
            style={{backgroundColor: section.iconBg, color: section.iconColor}}
          >
            <Icon size="24" />
          </div>
          <div className={styles.cardTextBlock}>
            <a href={section.href} className={styles.cardTitleLink}><h3 className={styles.cardTitle}>{section.title}</h3></a>
            <p className={styles.cardDescription}>{section.description}</p>
          </div>
        </div>

        <div className={styles.cardLinks}>
          {section.columns.map((col, colIdx) => (
            <div key={colIdx} className={styles.linkColumn}>
              {col.map((link) => (
                <a key={link.label} href={link.href} className={styles.cardLink}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <hr className={styles.cardDivider} />
          <a href={section.href} className={styles.viewAllLink}>View all</a>
        </div>
      </div>
    </div>
  );
}

export default function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout title="Home" description={siteConfig.tagline}>
      <BitkitProvider>
        <div className={styles.page}>
          {/* Purple hero */}
          <div className={styles.hero}>
            <div className={styles.heroContent}>
              <div className={styles.titleBlock}>
                <h1 className={styles.heroTitle}>Welcome to Bitrise Documentation</h1>
                <p className={styles.heroSubtitle}>
                  Find product documentation, code samples, API &amp; CLI references, and more.
                </p>
              </div>
              <div className={styles.heroSearch}>
                <div className={styles.heroSearchField}>
                  <svg className={styles.heroSearchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path fill="currentColor" fillRule="evenodd" d="M15.906 17.32a8 8 0 1 1 1.414-1.414l4.387 4.387-1.414 1.414zM17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0" clipRule="evenodd"/>
                  </svg>
                  <input
                    className={styles.heroSearchInput}
                    type="text"
                    placeholder="Search all documentation"
                    id="searchWidgetTrigger"
                    readOnly
                  />
                </div>
              </div>
            </div>
            <img
              src="/img/brand/portal-header-illustration.png"
              alt=""
              className={styles.heroIllustration}
            />
          </div>

          {/* Tagline */}
          <div className={styles.tagline}>
            <div className={styles.taglineInner}>
              <h2 className={styles.taglineHeading}>
                Learn how to use Bitrise, the Mobile DevOps Platform tailored for mobile engineering teams
              </h2>
              <p className={styles.taglineText}>
                Bitrise&apos;s Mobile DevOps Platform equips you for success every step of the way, from planning to monitoring.
              </p>
            </div>
          </div>

          {/* Cards */}
          <div className={styles.cardsSection}>
            <div className={styles.cardsGrid}>
              <div className={styles.cardsRow}>
                <ProductCard section={sections[0]} />
                <ProductCard section={sections[1]} />
              </div>
              <div className={styles.cardsRow}>
                <ProductCard section={sections[2]} />
                <ProductCard section={sections[3]} />
              </div>
              <div className={styles.cardsRow}>
                <ProductCard section={sections[4]} />
                <ProductCard section={sections[5]} />
              </div>
            </div>
          </div>
        </div>
      </BitkitProvider>
    </Layout>
  );
}
