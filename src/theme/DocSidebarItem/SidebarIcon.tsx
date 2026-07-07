import React, {type ReactNode} from 'react';

import IconPower from '@site/src/images/icon-power-16px.svg';
import IconPerson from '@site/src/images/icon-person-16px.svg';
import IconDashboard from '@site/src/images/icon-dashboard-16px.svg';
import IconFolder from '@site/src/images/icon-folder-16px.svg';
import IconSecurityShield from '@site/src/images/icon-security-shield-16px.svg';
import IconArrowsHorizontal from '@site/src/images/icon-arrows-horizontal-16px.svg';
import IconCpu from '@site/src/images/icon-cpu-16px.svg';
import IconSparkle from '@site/src/images/icon-sparkle-16px.svg';
import IconCycle from '@site/src/images/icon-cycle-16px.svg';
import IconWorkflowFlow from '@site/src/images/icon-workflow-flow-16px.svg';
import IconConfigure from '@site/src/images/icon-configure-16px.svg';
import IconBuild from '@site/src/images/icon-build-16px.svg';
import IconMemory from '@site/src/images/icon-memory-16px.svg';
import IconCodeSigning from '@site/src/images/icon-code-signing-16px.svg';
import IconTasks from '@site/src/images/icon-tasks-16px.svg';
import IconDeployment from '@site/src/images/icon-deployment-16px.svg';
import IconTerminal from '@site/src/images/icon-terminal-16px.svg';
import IconCode from '@site/src/images/icon-code-16px.svg';
import IconBook from '@site/src/images/icon-book-16px.svg';
import IconGradle from '@site/src/images/icon-gradle-16px.svg';
import IconBazel from '@site/src/images/icon-bazel-16px.svg';
import IconXcode from '@site/src/images/icon-xcode-16px.svg';
import IconGithub from '@site/src/images/icon-github-16px.svg';
import IconOverview from '@site/src/images/icon-overview-16px.svg';
import IconGroup from '@site/src/images/icon-group-16px.svg';
import IconRelease from '@site/src/images/icon-release-16px.svg';
import IconCodePush from '@site/src/images/icon-push-device-16px.svg';
import IconGauge from '@site/src/images/icon-gauge-16px.svg';
import IconSiren from '@site/src/images/icon-siren-16px.svg';
import IconInsights from '@site/src/images/icon-insights-16px.svg';
import IconInstall from '@site/src/images/icon-install-16px.svg';
import IconGit from '@site/src/images/icon-git-16px.svg';
import IconReact from '@site/src/images/icon-react-16px.svg';

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Power: IconPower,
  Person: IconPerson,
  Dashboard: IconDashboard,
  Folder: IconFolder,
  SecurityShield: IconSecurityShield,
  ArrowsHorizontal: IconArrowsHorizontal,
  Cpu: IconCpu,
  Sparkle: IconSparkle,
  Cycle: IconCycle,
  WorkflowFlow: IconWorkflowFlow,
  Configure: IconConfigure,
  Build: IconBuild,
  Memory: IconMemory,
  CodeSigning: IconCodeSigning,
  Tasks: IconTasks,
  Deployment: IconDeployment,
  Terminal: IconTerminal,
  Code: IconCode,
  Book: IconBook,
  Gradle: IconGradle,
  Bazel: IconBazel,
  Xcode: IconXcode,
  Github: IconGithub,
  Overview: IconOverview,
  Group: IconGroup,
  Release: IconRelease,
  CodePush: IconCodePush,
  Gauge: IconGauge,
  Siren: IconSiren,
  Insights: IconInsights,
  Install: IconInstall,
  Git: IconGit,
  React: IconReact,
};

export default function SidebarIcon({name}: {name?: string}): ReactNode {
  if (!name) return null;
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon width={16} height={16} />;
}
