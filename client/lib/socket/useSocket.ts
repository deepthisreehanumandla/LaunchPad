import { useSocketStore } from './socketStore';

export function useSocket() {
  return useSocketStore((state) => state.socket);
}
