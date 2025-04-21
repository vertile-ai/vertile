'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  DiscordLogo,
  GithubLogo,
  Briefcase,
  Envelope,
  Globe,
  HouseLine,
  Info,
  LinkSimple,
  FileArrowUp,
} from '@phosphor-icons/react';

// Define paths object similar to the one in src/utils/paths
const paths = {
  discord: 'https://discord.gg/vertile',
  github: 'https://github.com/vertile-ai/FinetuneLLMs',
};

export const MAX_ICONS = 3;
export const ICON_COMPONENTS = {
  BookOpen: BookOpen,
  DiscordLogo: DiscordLogo,
  GithubLogo: GithubLogo,
  Envelope: Envelope,
  LinkSimple: LinkSimple,
  HouseLine: HouseLine,
  Globe: Globe,
  Briefcase: Briefcase,
  Info: Info,
};

export default function Header() {
  const [githubHover, setGithubHover] = useState<boolean>(false);
  const [discordHover, setDiscordHover] = useState<boolean>(false);

  return (
    <div className="flex justify-between items-center pr-3 pl-5 text-2xl h-full bg-white text-gray-800 border-b border-gray-200">
      <div
        id="header-right-logo"
        className="flex justify-center items-center space-x-3 mr-2"
      >
        <a
          href={paths.discord}
          target="_blank"
          rel="noreferrer"
          onMouseEnter={() => {
            setDiscordHover(true);
          }}
          onMouseLeave={() => {
            setDiscordHover(false);
          }}
          className={`transition-all duration-300 flex justify-center items-center w-[36px] h-[36px] rounded-lg ${
            discordHover ? 'bg-gray-100' : ''
          } shadow-sm`}
          aria-label="Find me on Discord"
        >
          <DiscordLogo
            weight={discordHover ? 'fill' : 'bold'}
            size={24}
            color={discordHover ? '#5865F2' : '#737b85'}
          />
        </a>
        <a
          href={paths.github}
          target="_blank"
          rel="noreferrer"
          onMouseEnter={() => {
            setGithubHover(true);
          }}
          onMouseLeave={() => {
            setGithubHover(false);
          }}
          className={`transition-all duration-300 flex justify-center items-center w-[36px] h-[36px] rounded-lg ${
            githubHover ? 'bg-gray-100' : ''
          } shadow-sm`}
          aria-label="Find me on Github"
        >
          <GithubLogo
            weight={githubHover ? 'fill' : 'bold'}
            size={24}
            color={githubHover ? '#333333' : '#737b85'}
          />
        </a>
      </div>
    </div>
  );
}
