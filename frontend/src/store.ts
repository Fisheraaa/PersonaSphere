import { create } from 'zustand';
import type { Person, ExtractResponse, GraphResponse, Circle, CircleWithMembers } from './types';
import { getPersons, getGraph, getCircles, getCirclesWithMembers } from './api';

interface AppState {
  persons: Person[];
  graphData: GraphResponse | null;
  circles: Circle[];
  circlesWithMembers: CircleWithMembers[];
  extractedData: ExtractResponse | null;
  originalText: string;
  loading: boolean;
  error: string | null;
  isComparedData: boolean;
  
  setPersons: (persons: Person[]) => void;
  setGraphData: (data: GraphResponse) => void;
  setCircles: (circles: Circle[]) => void;
  setCirclesWithMembers: (circles: CircleWithMembers[]) => void;
  setExtractedData: (data: ExtractResponse | null) => void;
  setOriginalText: (text: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsComparedData: (isCompared: boolean) => void;
  
  fetchPersons: () => Promise<void>;
  fetchGraphData: () => Promise<void>;
  fetchCircles: () => Promise<void>;
  fetchCirclesWithMembers: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  persons: [],
  graphData: null,
  circles: [],
  circlesWithMembers: [],
  extractedData: null,
  originalText: '',
  loading: false,
  error: null,
  isComparedData: false,

  setPersons: (persons) => set({ persons }),
  setGraphData: (data) => set({ graphData: data }),
  setCircles: (circles) => set({ circles }),
  setCirclesWithMembers: (circles) => set({ circlesWithMembers: circles }),
  setExtractedData: (data) => set({ extractedData: data }),
  setOriginalText: (text) => set({ originalText: text }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setIsComparedData: (isCompared) => set({ isComparedData: isCompared }),

  fetchPersons: async () => {
    try {
      set({ loading: true, error: null });
      const persons = await getPersons();
      set({ persons });
    } catch (error) {
      set({ error: '获取人物列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchGraphData: async () => {
    try {
      set({ loading: true, error: null });
      const data = await getGraph();
      set({ graphData: data });
    } catch (error) {
      set({ error: '获取关系图数据失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchCircles: async () => {
    try {
      set({ loading: true, error: null });
      const circles = await getCircles();
      set({ circles });
    } catch (error) {
      set({ error: '获取圈子列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchCirclesWithMembers: async () => {
    try {
      set({ loading: true, error: null });
      const circles = await getCirclesWithMembers();
      set({ circlesWithMembers: circles });
    } catch (error) {
      set({ error: '获取圈子成员失败' });
    } finally {
      set({ loading: false });
    }
  },
}));
