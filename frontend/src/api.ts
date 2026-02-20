import axios from 'axios';
import {
  ExtractResponse,
  ConfirmRequest,
  ConfirmResponse,
  Person,
  GraphResponse,
  Circle,
} from './types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const extractInfo = async (text: string): Promise<ExtractResponse> => {
  const response = await api.post<ExtractResponse>('/extract', { text });
  return response.data;
};

export const confirmData = async (data: ConfirmRequest): Promise<ConfirmResponse> => {
  const response = await api.post<ConfirmResponse>('/confirm', data);
  return response.data;
};

export const getPersons = async (): Promise<Person[]> => {
  const response = await api.get<Person[]>('/persons');
  return response.data;
};

export const getPerson = async (personId: number): Promise<Person> => {
  const response = await api.get<Person>(`/persons/${personId}`);
  return response.data;
};

export const getGraph = async (): Promise<GraphResponse> => {
  const response = await api.get<GraphResponse>('/graph');
  return response.data;
};

export const saveGraphLayout = async (layoutJson: Record<string, any>): Promise<void> => {
  await api.post('/graph/layout', { layout_json: layoutJson });
};

export const getGraphLayout = async (): Promise<Record<string, any>> => {
  const response = await api.get('/graph/layout');
  return response.data.layout_json;
};

export const getCircles = async (): Promise<Circle[]> => {
  const response = await api.get<Circle[]>('/circles');
  return response.data;
};

export const createCircle = async (name: string, color: string): Promise<Circle> => {
  const response = await api.post<Circle>('/circles', { name, color });
  return response.data;
};
