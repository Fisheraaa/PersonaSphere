export interface Event {
  id?: number;
  date: string;
  location?: string;
  description: string;
}

export interface Annotation {
  id?: number;
  time: string;
  location?: string;
  description: string;
}

export interface Development {
  id?: number;
  content: string;
  type: string;
}

export interface ExtractedRelation {
  name: string;
  relation_type: string;
}

export interface ExtractedProfile {
  name: string;
  job?: string;
  birthday?: string;
  notes: string[];
  events: Event[];
}

export interface ExtractResponse {
  profile: ExtractedProfile;
  annotations: Annotation[];
  developments: Development[];
  relations: ExtractedRelation[];
}

export interface Person {
  id: number;
  name: string;
  avatar?: string;
  profile: Record<string, any>;
  created_at: string;
  updated_at?: string;
  events: Event[];
  annotations: Annotation[];
  developments: Development[];
}

export interface GraphNode {
  id: number;
  name: string;
  avatar?: string;
}

export interface GraphEdge {
  source: number;
  target: number;
  relation_type: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Circle {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface ConfirmRequest {
  original_text: string;
  is_new_person: boolean;
  person_id?: number;
  profile: ExtractedProfile;
  annotations: Annotation[];
  developments: Development[];
  relations: ExtractedRelation[];
  conflict_resolutions?: Record<string, any>;
}

export interface ConfirmResponse {
  success: boolean;
  person_id: number;
  message: string;
}
