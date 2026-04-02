export interface ResourceTypeInfo {
  id: string;
  label: string;
}

export interface ResourceStatusInfo {
  id: string;
  label: string;
}

export interface ResourceConfidentialityTypeInfo {
  id: string;
  label: string;
}

export interface TagDto {
  id: string;
  label: string;
}

export interface ApiResource {
  id: string;
  title: string;
  description: string;
  thumbnail_id?: string;
  status?: ResourceStatusInfo;
  confidentiality_type?: ResourceConfidentialityTypeInfo;
  type?: ResourceTypeInfo;
  tags: TagDto[];
}

export interface ApiEvent {
  id: string;
  is_virtual: boolean;
  date_start: string;
  date_end: string;
  event_link?: string;
  location: string;
  ressource: ApiResource;
}

export interface ApiArticle {
  id: string;
  content: string;
  ressource: ApiResource;
}

export interface ApiQuiz {
  id: string;
  participation_count: number;
  ressource_id: string;
}

export interface ApiPoll {
  id: string;
  vote_count: number;
  ressource_id: string;
}
