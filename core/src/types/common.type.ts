import type { Dispatch, SetStateAction } from 'react';

interface HTTPResponse {
  success: boolean;
}

export interface HTTPResponseSuccess<T> extends HTTPResponse {
  success: true;
  data: T;
}

export interface HTTPResponseError extends HTTPResponse {
  success: false;
  error: string;
}

export interface Permalink {
  name: string;
  url: string;
}

export interface IPermalinksContext {
  permalinks: Permalink[];
  setPermalinks: Dispatch<SetStateAction<Permalink[]>>;
}

export interface IChatMessage {
  message: string;
  role: 'ai' | 'user';
  id: string;
}
