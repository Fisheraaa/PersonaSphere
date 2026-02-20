import { create } from 'zustand';
import { Person, ExtractResponse, GraphResponse, Circle } from './types';
import { getPersons, getGraph, getCircles } from './api';

interface AppState {
  persons: Person[];
  graphData: GraphResponse | null;
  circles: Circle[];
  extractedData: ExtractResponse | null;
  originalText: string;
  currentStep: 'input' | 'confirm';
  loading: boolean;
  error: string | null;
  
  setPersons: (persons: Person[]) => void;
  setGraphData: (data: GraphResponse) => void;
  setCircles: (circles: Circle[]) => void;
  setExtractedData: (data: ExtractResponse | null) => void;
  setOriginalText: (text: string) => void;
  setCurrentStep: (step: 'input' | 'confirm') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  fetchPersons: () => Promise<void>;
  fetchGraphData: () => Promise<void>;
  fetchCircles: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  persons: [],
  graphData: null,
  circles: [],
  extractedData: null,
  originalText: '',
  currentStep: 'input',
  loading: false,
  error: null,

  setPersons: (persons) => set({ persons }),
  setGraphData: (data) => set({ graphData: data }),
  setCircles: (circles) => set({ circles }),
  setExtractedData: (data) => set({ extractedData: data }),
  setOriginalText: (text) => set({ originalText: text }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

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
}));
