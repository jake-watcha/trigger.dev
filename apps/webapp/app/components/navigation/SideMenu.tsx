import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
import {
  ArrowLeftOnRectangleIcon,
  ArrowsRightLeftIcon,
  BeakerIcon,
  BuildingOffice2Icon,
  CloudArrowUpIcon,
  CloudIcon,
  Cog6ToothIcon,
  ForwardIcon,
  HomeIcon,
  QueueListIcon,
  Squares2X2Icon,
  SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import { Link, NavLink, useLocation } from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { CurrentProject } from "~/features/ee/projects/routes/projects/$projectP";
import { useCurrentEnvironment } from "~/hooks/useEnvironments";
import { useIsOrgChildPage } from "~/hooks/useIsOrgChildPage";
import {
  useCurrentOrganization,
  useOrganizations,
} from "~/hooks/useOrganizations";
import { useOptionalUser } from "~/hooks/useUser";
import { useCurrentWorkflow } from "~/hooks/useWorkflows";
import {
  EnvironmentIcon,
  EnvironmentMenu,
} from "~/routes/resources/environment";
import { titleCase } from "~/utils";
import { CopyTextPanel } from "../CopyTextButton";
import { LogoIcon } from "../LogoIcon";
import { TertiaryButton } from "../primitives/Buttons";
import { MenuTitleToolTip } from "../primitives/MenuTitleToolTip";
import { Body } from "../primitives/text/Body";
import { Header1 } from "../primitives/text/Headers";

export function SideMenuContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full grid-cols-[16rem_auto] overflow-hidden">
      {children}
    </div>
  );
}

type SideMenuItem = {
  name: string;
  icon: React.ReactNode;
  to: string;
  end?: boolean;
};

const iconStyle = "h-6 w-6";

export function OrganizationsSideMenu() {
  const organizations = useOrganizations();
  const currentOrganization = useCurrentOrganization();

  if (organizations === undefined || currentOrganization === undefined) {
    return null;
  }

  let items: SideMenuItem[] = [
    {
      name: "Workflows",
      icon: <ArrowsRightLeftIcon className={iconStyle} />,
      to: `/orgs/${currentOrganization.slug}`,
      end: true,
    },
  ];

  if (currentOrganization.workflows.length > 0) {
    items = [
      ...items,
      {
        name: "Repositories",
        icon: <CloudIcon className={iconStyle} />,
        to: `/orgs/${currentOrganization.slug}/projects`,
        end: false,
      },
      {
        name: "API Integrations",
        icon: <SquaresPlusIcon className={iconStyle} />,
        to: `/orgs/${currentOrganization.slug}/integrations`,
        end: false,
      },
    ];
  }

  return (
    <SideMenu
      subtitle="Organization"
      title={currentOrganization.title}
      items={items}
      backPath="/"
      environmentSwitcher={false}
    />
  );
}

export function CurrentOrganizationSideMenu() {
  const user = useOptionalUser();
  const organizations = useOrganizations();
  const currentOrganization = useCurrentOrganization();

  if (organizations === undefined || currentOrganization === undefined) {
    return null;
  }

  return (
    <ul className="flex h-full flex-col items-center justify-start space-y-2 border-r border-slate-800 bg-slate-950">
      <NavLink
        to="/"
        className="flex min-h-[3.6rem] w-full items-center justify-center border-b border-slate-800"
      >
        <MenuTitleToolTip text="All Organizations">
          <li className="rounded p-2 transition hover:bg-slate-800">
            <LogoIcon className="h-6 w-6" />
          </li>
        </MenuTitleToolTip>
      </NavLink>
      <div className="flex h-full flex-col items-center justify-between">
        <MenuTitleToolTip text={currentOrganization.title}>
          <NavLink
            to={`/orgs/${currentOrganization.slug}`}
            className={(isActive) =>
              isActive ? activeCollapsedStyle : defaultCollapsedStyle
            }
          >
            <li>
              <BuildingOffice2Icon className="h-6 w-6 text-slate-300" />
            </li>
          </NavLink>
        </MenuTitleToolTip>
        <MenuTitleToolTip
          text={
            user
              ? `Logout ${user.displayName ? user.displayName : user.email}`
              : "Logout"
          }
        >
          <a
            href={`/logout`}
            className="mb-2 rounded p-2 transition hover:bg-slate-600/50"
          >
            <li>
              <ArrowLeftOnRectangleIcon className="h-6 w-6 text-slate-300" />
            </li>
          </a>
        </MenuTitleToolTip>
      </div>
    </ul>
  );
}

export function OrganizationSideMenuCollapsed() {
  const organizations = useOrganizations();
  const currentOrganization = useCurrentOrganization();

  if (organizations === undefined || currentOrganization === undefined) {
    return null;
  }

  return (
    <ul className="flex h-full flex-col items-center justify-start space-y-2 border-r border-slate-800 bg-slate-950">
      <NavLink
        to="/"
        className="flex h-[3.6rem] w-full items-center justify-center border-b border-slate-800"
      >
        <MenuTitleToolTip text="All Organizations">
          <li className="rounded p-2 transition hover:bg-slate-800">
            <LogoIcon className="h-6 w-6" />
          </li>
        </MenuTitleToolTip>
      </NavLink>
      <MenuTitleToolTip text="Workflows">
        <WorkflowsNavLink slug={currentOrganization.slug}>
          <li>
            <ArrowsRightLeftIcon className="h-6 w-6 text-slate-300" />
          </li>
        </WorkflowsNavLink>
      </MenuTitleToolTip>
      <MenuTitleToolTip text="Repositories">
        <NavLink
          to={`/orgs/${currentOrganization.slug}/projects`}
          className={({ isActive }) =>
            isActive ? activeCollapsedStyle : defaultCollapsedStyle
          }
        >
          <li>
            <CloudIcon className="h-6 w-6 text-slate-300" />
          </li>
        </NavLink>
      </MenuTitleToolTip>
      <MenuTitleToolTip text="API Integrations">
        <NavLink
          to={`/orgs/${currentOrganization.slug}/integrations`}
          className={({ isActive }) =>
            isActive ? activeCollapsedStyle : defaultCollapsedStyle
          }
        >
          <li>
            <SquaresPlusIcon className="h-6 w-6 text-slate-300" />
          </li>
        </NavLink>
      </MenuTitleToolTip>
    </ul>
  );
}

const defaultCollapsedStyle = "rounded p-2 transition hover:bg-slate-800";
const activeCollapsedStyle =
  "rounded p-2 transition bg-slate-800 hover:bg-slate-600/50";

export function WorkflowsSideMenu() {
  const currentWorkflow = useCurrentWorkflow();
  const organization = useCurrentOrganization();
  const environment = useCurrentEnvironment();

  if (
    currentWorkflow === undefined ||
    organization === undefined ||
    environment === undefined
  ) {
    return null;
  }

  const workflowEventRule = currentWorkflow.rules.find(
    (rule) => rule.environmentId === environment.id
  );

  let items: SideMenuItem[] = [
    {
      name: "Overview",
      icon: <HomeIcon className={iconStyle} />,
      to: ``,
      end: true,
    },
  ];

  if (workflowEventRule) {
    items = [
      ...items,
      {
        name: "Test",
        icon: <BeakerIcon className={iconStyle} />,
        to: `test`,
      },
      {
        name: "Runs",
        icon: <ForwardIcon className={iconStyle} />,
        to: `runs`,
      },
    ];
  }

  items = [
    ...items,
    {
      name: "Connected APIs",
      icon: <Squares2X2Icon className={iconStyle} />,
      to: `integrations`,
    },
    {
      name: "Settings",
      icon: <Cog6ToothIcon className={iconStyle} />,
      to: `settings`,
    },
  ];

  return (
    <SideMenu
      subtitle="Workflow"
      title={currentWorkflow.title}
      items={items}
      backPath={`/orgs/${organization.slug}`}
      environmentSwitcher={true}
    />
  );
}

export function ProjectSideMenu({
  project,
  backPath,
}: {
  project: CurrentProject;
  backPath: string;
}) {
  if (!project) {
    return null;
  }

  const items: SideMenuItem[] = [
    {
      name: "Overview",
      icon: <HomeIcon className={iconStyle} />,
      to: ``,
      end: true,
    },
    {
      name: "Deploys",
      icon: <CloudArrowUpIcon className={iconStyle} />,
      to: `deploys`,
    },
    {
      name: "Logs",
      icon: <QueueListIcon className={iconStyle} />,
      to: `logs`,
    },
    {
      name: "Settings",
      icon: <Cog6ToothIcon className={iconStyle} />,
      to: `settings`,
    },
  ];

  return (
    <SideMenu
      subtitle="Repository"
      title={project.name}
      items={items}
      backPath={backPath}
      environmentSwitcher={false}
    />
  );
}

const defaultStyle =
  "group flex items-center gap-2 px-3 py-2 text-base rounded transition text-slate-300 hover:bg-slate-850 hover:text-white";
const activeStyle =
  "group flex items-center gap-2 px-3 py-2 text-base rounded transition bg-slate-800 text-white";

function SideMenu({
  items,
  title,
  subtitle,
  environmentSwitcher,
}: {
  title: string;
  items: SideMenuItem[];
  backPath: string;
  subtitle: string;
  environmentSwitcher: boolean;
}) {
  const organization = useCurrentOrganization();
  invariant(organization, "Organization must be defined");

  const isOrgChildPage = useIsOrgChildPage();

  const [isShowingKeys, setIsShowingKeys] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex flex-1 flex-col overflow-y-auto pb-4">
        <nav
          className="flex h-full flex-col justify-between space-y-1"
          aria-label="Side menu"
        >
          <div className="flex flex-col">
            {isOrgChildPage ? (
              <div className="flex h-[3.6rem] items-center border-b border-slate-800 pl-5 pr-1">
                <Header1
                  size="extra-small"
                  className="overflow-hidden text-ellipsis whitespace-nowrap text-slate-300"
                >
                  {title}
                </Header1>
              </div>
            ) : (
              <div className="flex h-[3.6rem] items-center border-b border-slate-800 pl-5 pr-1">
                <Header1
                  size="extra-small"
                  className="overflow-hidden text-ellipsis whitespace-nowrap text-slate-300"
                >
                  {title}
                </Header1>
              </div>
            )}
            <div className="p-2">
              <Body
                size="small"
                className="mb-1 py-3 pl-1 uppercase tracking-wider text-slate-400"
              >
                {subtitle}
              </Body>
              <div className="flex flex-col gap-y-2">
                {items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      isActive ? activeStyle : defaultStyle
                    }
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
              {environmentSwitcher && (
                <div className="mt-2">
                  <Body
                    size="small"
                    className="py-3 pl-1 uppercase tracking-wider text-slate-400"
                  >
                    Environment
                  </Body>
                  <EnvironmentMenu />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <ul className="ml-3 mr-2 flex flex-col gap-2">
              <li className="flex w-full items-center justify-between">
                <Body
                  size="extra-small"
                  className={`overflow-hidden text-slate-300 transition group-hover:text-slate-400 ${menuSmallTitleStyle}`}
                >
                  API keys
                </Body>
                {!isShowingKeys ? (
                  <TertiaryButton
                    onClick={() => setIsShowingKeys(true)}
                    className="group mr-1.5 transition before:text-xs before:text-slate-400 hover:before:content-['Show_keys']"
                  >
                    <EyeIcon className="h-4 w-4 text-slate-500 transition group-hover:text-slate-400" />
                  </TertiaryButton>
                ) : (
                  <TertiaryButton
                    onClick={() => setIsShowingKeys(false)}
                    className="group mr-1.5 transition before:text-xs before:text-slate-400 hover:before:content-['Hide_keys']"
                  >
                    <EyeSlashIcon className="h-4 w-4 text-slate-500 transition group-hover:text-slate-400" />
                  </TertiaryButton>
                )}
              </li>
              {organization.environments.map((environment) => {
                return (
                  <li
                    key={environment.id}
                    className="flex w-full flex-col justify-between"
                  >
                    <div className="relative flex items-center">
                      <EnvironmentIcon
                        slug={environment.slug}
                        className="absolute top-4 left-2"
                      />
                      <CopyTextPanel
                        value={environment.apiKey}
                        text={
                          isShowingKeys
                            ? environment.apiKey
                            : `${titleCase(environment.slug)}`
                        }
                        variant="slate"
                        className="pl-6 text-slate-300 hover:text-slate-300"
                      />
                    </div>
                  </li>
                );
              })}
              <Body size="extra-small" className="mt-1 text-slate-500">
                Copy these keys into your workflow code. Use the Live key for
                production and Development key for local. Learn more about API
                keys{" "}
                <a
                  href="https://docs.trigger.dev/guides/environments"
                  target="_blank"
                  className="underline underline-offset-2 transition hover:text-slate-200"
                >
                  here
                </a>
                .
              </Body>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}

function WorkflowsNavLink({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const location = useLocation();

  const isActive =
    location.pathname === `/orgs/${slug}` ||
    location.pathname.startsWith(`/orgs/${slug}/workflows`);

  return (
    <Link
      to={`/orgs/${slug}`}
      prefetch="intent"
      className={isActive ? activeCollapsedStyle : defaultCollapsedStyle}
    >
      {children}
    </Link>
  );
}

const menuSmallTitleStyle = "uppercase text-slate-500 tracking-wide";
